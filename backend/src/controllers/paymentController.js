const crypto = require('crypto');
const { Order } = require('../models');

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

// GET /vnpay-return - Xử lý kết quả trả về từ VNPay
const vnpayReturn = async (req, res) => {
  try {
    const vnpParams = { ...req.query };
    const secureHash = vnpParams.vnp_SecureHash;

    // Xóa các tham số hash khỏi object
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    const secretKey = process.env.VNPAY_HASH_SECRET;
    const sortedParams = sortObject(vnpParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      return res.status(400).json({
        message: 'Chữ ký không hợp lệ',
        code: '97'
      });
    }

    const orderCode = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionId = vnpParams.vnp_TransactionNo;

    const order = await Order.findOne({
      where: { orderCode }
    });

    if (!order) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng',
        code: '01'
      });
    }

    if (responseCode === '00') {
      await order.update({
        paymentStatus: 'paid',
        vnpayTransactionId: transactionId
      });

      return res.json({
        message: 'Thanh toán thành công',
        code: '00',
        order: {
          id: order.id,
          orderCode: order.orderCode,
          total: order.total,
          paymentStatus: 'paid'
        }
      });
    } else {
      await order.update({
        paymentStatus: 'failed'
      });

      return res.json({
        message: 'Thanh toán thất bại',
        code: responseCode,
        order: {
          id: order.id,
          orderCode: order.orderCode,
          total: order.total,
          paymentStatus: 'failed'
        }
      });
    }
  } catch (error) {
    console.error('VNPay return error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xử lý kết quả thanh toán. Vui lòng thử lại sau'
    });
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
  vnpayReturn
};
