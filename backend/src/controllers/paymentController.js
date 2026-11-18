const crypto = require('crypto');
const { Order, OrderItem, Cart, sequelize } = require('../models');
const { restoreOrderInventory } = require('../utils/restoreOrderInventory');

// POST /create-vnpay-url - Tạo URL thanh toán VNPay
const createVnpayUrl = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp mã đơn hàng'
      });
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: req.user.id
      }
    });

    if (!order) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.paymentMethod !== 'vnpay') {
      return res.status(400).json({
        message: 'Đơn hàng này không sử dụng phương thức thanh toán VNPay'
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        message: 'Đơn hàng này đã được thanh toán'
      });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({
        message: 'Không thể thanh toán đơn hàng đã bị hủy'
      });
    }

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    const vnpUrl = process.env.VNPAY_URL;
    const returnUrl = process.env.VNPAY_RETURN_URL;

    const now = new Date();
    const createDate = formatDate(now);
    const ipAddr = req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;

    const vnpParams = {
      vnp_Amount: String(Math.round(Number(order.total) * 100)),
      vnp_Command: 'pay',
      vnp_CreateDate: createDate,
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddr,
      vnp_Locale: 'vn',
      vnp_OrderInfo: `Thanh toan don hang ${order.orderCode}`,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: returnUrl,
      vnp_TmnCode: tmnCode,
      vnp_TxnRef: order.orderCode,
      vnp_Version: '2.1.0'
    };

    // Sắp xếp tham số theo key
    const sortedParams = sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams.vnp_SecureHash = signed;

    const paymentUrl = `${vnpUrl}?${new URLSearchParams(sortedParams).toString()}`;

    res.json({
      message: 'Tạo URL thanh toán thành công',
      paymentUrl
    });
  } catch (error) {
    console.error('Create VNPay URL error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi tạo URL thanh toán. Vui lòng thử lại sau'
    });
  }
};

// Kiểm tra chữ ký VNPay; trả về params (đã bỏ hash) nếu hợp lệ, ngược lại null
function verifyVnpayParams(query) {
  const vnpParams = { ...query };
  const secureHash = vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHash;
  delete vnpParams.vnp_SecureHashType;

  const signData = new URLSearchParams(sortObject(vnpParams)).toString();
  const signed = crypto
    .createHmac('sha512', process.env.VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return secureHash === signed ? vnpParams : null;
}

// Ghi kết quả thanh toán vào đơn (dùng chung cho Return URL và IPN).
// Khóa đơn trong transaction để Return và IPN đến cùng lúc không xử lý 2 lần.
async function applyVnpayResult(query) {
  const params = verifyVnpayParams(query);
  if (!params) return { code: '97', message: 'Chữ ký không hợp lệ' };

  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { orderCode: params.vnp_TxnRef },
      include: [{ model: OrderItem, as: 'items' }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!order) {
      await transaction.rollback();
      return { code: '01', message: 'Không tìm thấy đơn hàng' };
    }

    if (Number(params.vnp_Amount) !== Math.round(Number(order.total) * 100)) {
      await transaction.rollback();
      return { code: '04', message: 'Số tiền thanh toán không khớp với đơn hàng' };
    }

    const alreadyProcessed = order.paymentStatus !== 'pending';
    const isSuccess = params.vnp_ResponseCode === '00' &&
      (params.vnp_TransactionStatus === undefined || params.vnp_TransactionStatus === '00');

    if (!alreadyProcessed && isSuccess) {
      await order.update(
        { paymentStatus: 'paid', vnpayTransactionId: params.vnp_TransactionNo },
        { transaction }
      );
    } else if (!alreadyProcessed) {
      const updateData = { paymentStatus: 'failed' };

      // Thanh toán thất bại -> hủy đơn, hoàn kho và trả sản phẩm về giỏ để khách đặt lại
      if (order.status === 'pending') {
        updateData.status = 'cancelled';
        await restoreOrderInventory(order, transaction);
        for (const item of order.items) {
          await Cart.findOrCreate({
            where: { userId: order.userId, variantId: item.variantId },
            defaults: { quantity: item.quantity },
            transaction
          });
        }
      }

      await order.update(updateData, { transaction });
    }

    await transaction.commit();

    const paid = order.paymentStatus === 'paid';
    return {
      code: paid ? '00' : (params.vnp_ResponseCode || '99'),
      message: paid ? 'Thanh toán thành công' : 'Thanh toán thất bại',
      alreadyProcessed,
      order: {
        id: order.id,
        orderCode: order.orderCode,
        total: order.total,
        paymentStatus: order.paymentStatus
      }
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// GET /vnpay-return - Frontend chuyển tiếp query string VNPay trả về để xác minh và hiển thị
const vnpayReturn = async (req, res) => {
  try {
    const result = await applyVnpayResult(req.query);
    const httpStatus = { '97': 400, '04': 400, '01': 404 }[result.code] || 200;
    const { alreadyProcessed, ...body } = result;
    res.status(httpStatus).json(body);
  } catch (error) {
    console.error('VNPay return error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xử lý kết quả thanh toán. Vui lòng thử lại sau'
    });
  }
};

// GET /vnpay-ipn - VNPay gọi thẳng server báo kết quả (kể cả khi khách đóng trình duyệt)
const vnpayIpn = async (req, res) => {
  try {
    const result = await applyVnpayResult(req.query);
    if (['97', '01', '04'].includes(result.code)) {
      return res.json({ RspCode: result.code, Message: result.message });
    }
    if (result.alreadyProcessed) {
      return res.json({ RspCode: '02', Message: 'Order already confirmed' });
    }
    res.json({ RspCode: '00', Message: 'Confirm Success' });
  } catch (error) {
    console.error('VNPay IPN error:', error);
    res.json({ RspCode: '99', Message: 'Unknown error' });
  }
};

// Hàm sắp xếp object theo key
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// Hàm format ngày theo định dạng VNPay: yyyyMMddHHmmss
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

module.exports = {
  createVnpayUrl,
  vnpayReturn,
  vnpayIpn
};
