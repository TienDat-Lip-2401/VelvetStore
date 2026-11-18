const { Op } = require('sequelize');
const {
  Order,
  OrderItem,
  Cart,
  ProductVariant,
  Product,
  ProductImage,
  Address,
  User,
  Voucher,
  sequelize
} = require('../models');
const { restoreOrderInventory } = require('../utils/restoreOrderInventory');

// Phí vận chuyển: miễn phí cho đơn (tạm tính) trên ngưỡng, ngược lại tính phí cố định.
// Phải khớp với cách tính hiển thị ở frontend (CartPage / CheckoutPage).
const FREE_SHIPPING_THRESHOLD = 500000;
const SHIPPING_FEE = 30000;
const VALID_PAYMENT_METHODS = ['cod', 'vnpay'];

// Đơn chỉ được đi tiến theo luồng; đã giao hoặc đã hủy thì không đổi nữa
const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['confirmed', 'shipping', 'delivered', 'cancelled'],
  confirmed: ['shipping', 'delivered', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

// POST / - Tạo đơn hàng
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      addressId,
      fullName,
      phone,
      address,
      note,
      voucherId,
      voucherCode
    } = req.body;

    const paymentMethod = String(req.body.paymentMethod || 'cod').toLowerCase();
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Phương thức thanh toán không hợp lệ'
      });
    }

    // Xác định thông tin giao hàng
    let shippingFullName, shippingPhone, shippingAddress;

    if (addressId) {
      const savedAddress = await Address.findOne({
        where: { id: addressId, userId: req.user.id }
      });

      if (!savedAddress) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Không tìm thấy địa chỉ giao hàng'
        });
      }

      shippingFullName = savedAddress.fullName;
      shippingPhone = savedAddress.phone;
      shippingAddress = `${savedAddress.street}, ${savedAddress.ward}, ${savedAddress.district}, ${savedAddress.province}`;
    } else if (fullName && phone && address) {
      shippingFullName = fullName;
      shippingPhone = phone;
      shippingAddress = address;
    } else {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Vui lòng cung cấp địa chỉ giao hàng'
      });
    }

    // Lấy sản phẩm từ giỏ hàng
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: ProductVariant,
          as: 'variant',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  where: { isPrimary: true },
                  required: false,
                  limit: 1
                }
              ]
            }
          ]
        }
      ],
      transaction
    });

    if (cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng'
      });
    }

    // Kiểm tra tồn kho và tính tổng tiền
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      const variant = item.variant;

      if (!variant) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Phiên bản sản phẩm không còn tồn tại'
        });
      }

      const product = variant.product;

      if (!product || !product.isActive) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Sản phẩm "${product ? product.name : ''}" hiện không còn bán`
        });
      }

      if (item.quantity > variant.stock) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Sản phẩm "${product.name}" (${variant.size}/${variant.color}) chỉ còn ${variant.stock} sản phẩm`
        });
      }

      const price = Number(product.salePrice || product.price);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      const primaryImage = product.images && product.images.length > 0
        ? product.images[0].url
        : null;

      orderItemsData.push({
        variantId: variant.id,
        productName: product.name,
        size: variant.size,
        color: variant.color,
        price,
        quantity: item.quantity,
        image: primaryImage
      });
    }

    // Xử lý mã giảm giá
    let discount = 0;
    let appliedVoucherId = null;

    if (voucherId || voucherCode) {
      const voucher = voucherId
        ? await Voucher.findByPk(voucherId, { transaction, lock: transaction.LOCK.UPDATE })
        : await Voucher.findOne({
            where: { code: String(voucherCode).trim().toUpperCase() },
            transaction,
            lock: transaction.LOCK.UPDATE
          });

      if (!voucher) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Không tìm thấy mã giảm giá'
        });
      }

      if (!voucher.isActive) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Mã giảm giá không còn hoạt động'
        });
      }

      const now = new Date();
      if (now < new Date(voucher.startDate) || now > new Date(voucher.endDate)) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Mã giảm giá đã hết hạn hoặc chưa bắt đầu'
        });
      }

      if (voucher.usageLimit !== null && voucher.usedCount >= voucher.usageLimit) {
        await transaction.rollback();
        return res.status(400).json({
          message: 'Mã giảm giá đã hết lượt sử dụng'
        });
      }

      if (subtotal < Number(voucher.minOrderValue)) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Đơn hàng tối thiểu ${Number(voucher.minOrderValue).toLocaleString('vi-VN')}đ để sử dụng mã giảm giá này`
        });
      }

      if (voucher.discountType === 'percent') {
        discount = Math.floor(subtotal * Number(voucher.discountValue) / 100);
        if (voucher.maxDiscount !== null && discount > Number(voucher.maxDiscount)) {
          discount = Number(voucher.maxDiscount);
        }
      } else {
        discount = Number(voucher.discountValue);
      }

      if (discount > subtotal) {
        discount = subtotal;
      }

      appliedVoucherId = voucher.id;

      await voucher.update(
        { usedCount: voucher.usedCount + 1 },
        { transaction }
      );
    }

    const shippingFee = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const total = subtotal - discount + shippingFee;
    const orderCode = 'VS' + Date.now();

    // Tạo đơn hàng
    const order = await Order.create(
      {
        orderCode,
        userId: req.user.id,
        fullName: shippingFullName,
        phone: shippingPhone,
        address: shippingAddress,
        note: note || null,
        subtotal,
        shippingFee,
        discount,
        total,
        paymentMethod,
        paymentStatus: 'pending',
        status: 'pending',
        voucherId: appliedVoucherId
      },
      { transaction }
    );

    // Tạo chi tiết đơn hàng
    const itemsToCreate = orderItemsData.map(item => ({
      ...item,
      orderId: order.id
    }));

    await OrderItem.bulkCreate(itemsToCreate, { transaction });

    // Giảm tồn kho và cập nhật totalSold
    for (const item of cartItems) {
      // Trừ kho có điều kiện để 2 đơn đặt cùng lúc không làm tồn kho bị âm
      const [affected] = await ProductVariant.update(
        { stock: sequelize.literal(`stock - ${Number(item.quantity)}`) },
        { where: { id: item.variant.id, stock: { [Op.gte]: item.quantity } }, transaction }
      );
      if (affected === 0) {
        await transaction.rollback();
        return res.status(409).json({
          message: `Sản phẩm "${item.variant.product.name}" (${item.variant.size}/${item.variant.color}) vừa hết hàng, vui lòng kiểm tra lại giỏ hàng`
        });
      }

      await Product.update(
        { totalSold: sequelize.literal(`totalSold + ${item.quantity}`) },
        { where: { id: item.variant.product.id }, transaction }
      );
    }

    // Xóa giỏ hàng
    await Cart.destroy({
      where: { userId: req.user.id },
      transaction
    });

    await transaction.commit();

    // Lấy đơn hàng đầy đủ
    const createdOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ]
    });

    res.status(201).json({
      message: 'Đặt hàng thành công',
      order: createdOrder
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create order error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại sau'
    });
  }
};

// GET /my-orders - Lấy danh sách đơn hàng của người dùng
const getMyOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status } = req.query;

    const where = { userId: req.user.id };
    if (status) {
      where.status = status;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      message: 'Lấy danh sách đơn hàng thành công',
      orders,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng. Vui lòng thử lại sau'
    });
  }
};

// GET /:id - Lấy chi tiết đơn hàng
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: ProductVariant,
              as: 'variant',
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'name', 'slug']
                }
              ]
            }
          ]
        },
        {
          model: Voucher,
          as: 'voucher',
          attributes: ['id', 'code', 'discountType', 'discountValue']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng'
      });
    }

    // Kiểm tra quyền truy cập: chủ đơn hoặc admin
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Bạn không có quyền xem đơn hàng này'
      });
    }

    res.json({
      message: 'Lấy chi tiết đơn hàng thành công',
      order
    });
  } catch (error) {
    console.error('Get order by id error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy chi tiết đơn hàng. Vui lòng thử lại sau'
    });
  }
};

// PUT /:id/cancel - Hủy đơn hàng
const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    const order = await Order.findOne({
      where: {
        id,
        userId: req.user.id
      },
      include: [
        {
          model: OrderItem,
          as: 'items'
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        message: 'Không tìm thấy đơn hàng'
      });
    }

    if (order.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        message: 'Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xác nhận'
      });
    }

    await restoreOrderInventory(order, transaction);

    await order.update(
      { status: 'cancelled' },
      { transaction }
    );

    await transaction.commit();

    res.json({
      message: 'Hủy đơn hàng thành công',
      order
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Cancel order error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi hủy đơn hàng. Vui lòng thử lại sau'
    });
  }
};

// GET /admin - Lấy tất cả đơn hàng (Admin)
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { status, search } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where[Op.or] = [
        { orderCode: { [Op.like]: `%${search}%` } },
        { fullName: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'phone']
        },
        {
          model: OrderItem,
          as: 'items'
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      message: 'Lấy danh sách đơn hàng thành công',
      orders,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng. Vui lòng thử lại sau'
    });
  }
};

// PUT /:id/status - Cập nhật trạng thái đơn hàng (Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Trạng thái không hợp lệ. Các trạng thái hợp lệ: ${validStatuses.join(', ')}`
      });
    }

    const transaction = await sequelize.transaction();
    try {
      const order = await Order.findByPk(id, {
        include: [
          {
            model: OrderItem,
            as: 'items'
          }
        ],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!order) {
        await transaction.rollback();
        return res.status(404).json({
          message: 'Không tìm thấy đơn hàng'
        });
      }

      const allowed = ALLOWED_STATUS_TRANSITIONS[order.status] || [];
      if (!allowed.includes(status)) {
        await transaction.rollback();
        return res.status(400).json({
          message: `Không thể chuyển đơn hàng từ "${order.status}" sang "${status}"`
        });
      }

      const updateData = { status };

      // Admin hủy đơn -> hoàn kho
      if (status === 'cancelled') {
        await restoreOrderInventory(order, transaction);
      }

      // Khi giao thành công và thanh toán COD thì cập nhật paymentStatus
      if (status === 'delivered' && order.paymentMethod === 'cod') {
        updateData.paymentStatus = 'paid';
      }

      await order.update(updateData, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'items'
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.json({
      message: 'Cập nhật trạng thái đơn hàng thành công',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng. Vui lòng thử lại sau'
    });
  }
};

// GET /stats - Thống kê đơn hàng (Admin)
const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Doanh thu hôm nay
    const todayRevenue = await Order.sum('total', {
      where: {
        status: { [Op.ne]: 'cancelled' },
        createdAt: { [Op.gte]: today }
      }
    });

    // Doanh thu tháng này
    const monthRevenue = await Order.sum('total', {
      where: {
        status: { [Op.ne]: 'cancelled' },
        createdAt: { [Op.gte]: firstDayOfMonth }
      }
    });

    // Tổng doanh thu
    const totalRevenue = await Order.sum('total', {
      where: {
        status: { [Op.ne]: 'cancelled' }
      }
    });

    // Tổng đơn hàng
    const totalOrders = await Order.count();

    // Đơn hàng hôm nay
    const todayOrders = await Order.count({
      where: {
        createdAt: { [Op.gte]: today }
      }
    });

    // Đơn hàng chờ xử lý
    const pendingOrders = await Order.count({
      where: { status: 'pending' }
    });

    // Khách hàng mới tháng này
    const newCustomers = await User.count({
      where: {
        role: 'customer',
        createdAt: { [Op.gte]: firstDayOfMonth }
      }
    });

    // Đơn hàng theo trạng thái
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      message: 'Lấy thống kê thành công',
      stats: {
        todayRevenue: Number(todayRevenue) || 0,
        monthRevenue: Number(monthRevenue) || 0,
        totalRevenue: Number(totalRevenue) || 0,
        totalOrders,
        todayOrders,
        pendingOrders,
        newCustomers,
        ordersByStatus
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy thống kê. Vui lòng thử lại sau'
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
};
