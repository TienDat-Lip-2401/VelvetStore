const { Op } = require('sequelize');
const { sequelize, User, Product, ProductImage, ProductVariant, Category, ShippingMethod, SystemConfig, Order, OrderItem } = require('../models');
const { cloudinary } = require('../config/cloudinary');

// ========================
// QUẢN LÝ KHÁCH HÀNG
// ========================

// GET /customers - Danh sách khách hàng
const getCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = { role: 'customer' };

    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: customers } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Lấy danh sách khách hàng thành công',
      customers,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách khách hàng. Vui lòng thử lại sau'
    });
  }
};

// PUT /customers/:id/toggle-status - Khóa/mở tài khoản khách hàng
const toggleCustomerStatus = async (req, res) => {
  try {
    const customer = await User.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({
        message: 'Không tìm thấy khách hàng'
      });
    }

    if (customer.role !== 'customer') {
      return res.status(400).json({
        message: 'Không thể thay đổi trạng thái tài khoản quản trị viên'
      });
    }

    await customer.update({ isActive: !customer.isActive });

    res.json({
      message: customer.isActive ? 'Đã mở khóa tài khoản khách hàng' : 'Đã khóa tài khoản khách hàng',
      customer
    });
  } catch (error) {
    console.error('Toggle customer status error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi thay đổi trạng thái tài khoản. Vui lòng thử lại sau'
    });
  }
};

// ========================
// QUẢN LÝ HÌNH ẢNH SẢN PHẨM
// ========================

// GET /products/:id/images - Lấy tất cả hình ảnh của sản phẩm
const getProductImages = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      });
    }

    const images = await ProductImage.findAll({
      where: { productId: req.params.id },
      order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']]
    });

    res.json({
      message: 'Lấy danh sách hình ảnh thành công',
      images
    });
  } catch (error) {
    console.error('Get product images error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách hình ảnh. Vui lòng thử lại sau'
    });
  }
};

// POST /products/:id/images - Upload hình ảnh sản phẩm
const uploadProductImages = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'Vui lòng chọn ít nhất một hình ảnh để tải lên'
      });
    }

    // Kiểm tra xem đã có hình ảnh nào chưa (nếu chưa thì ảnh đầu tiên sẽ là primary)
    const existingCount = await ProductImage.count({ where: { productId: product.id } });

    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const image = await ProductImage.create({
        productId: product.id,
        url: file.path,
        publicId: file.filename,
        isPrimary: existingCount === 0 && i === 0,
        sortOrder: existingCount + i
      });
      images.push(image);
    }

    res.status(201).json({
      message: `Tải lên ${images.length} hình ảnh thành công`,
      images
    });
  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi tải lên hình ảnh. Vui lòng thử lại sau'
    });
  }
};

// DELETE /images/:id - Xóa hình ảnh
const deleteProductImage = async (req, res) => {
  try {
    const image = await ProductImage.findByPk(req.params.id);

    if (!image) {
      return res.status(404).json({
        message: 'Không tìm thấy hình ảnh'
      });
    }

    // Xóa hình trên Cloudinary
    if (image.publicId) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr);
      }
    }

    const wasPrimary = image.isPrimary;
    const productId = image.productId;

    await image.destroy();

    // Nếu xóa ảnh chính, đặt ảnh đầu tiên còn lại làm ảnh chính
    if (wasPrimary) {
      const nextImage = await ProductImage.findOne({
        where: { productId },
        order: [['sortOrder', 'ASC']]
      });
      if (nextImage) {
        await nextImage.update({ isPrimary: true });
      }
    }

    res.json({
      message: 'Xóa hình ảnh thành công'
    });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa hình ảnh. Vui lòng thử lại sau'
    });
  }
};

// PUT /images/:id/primary - Đặt ảnh làm ảnh chính
const setPrimaryImage = async (req, res) => {
  try {
    const image = await ProductImage.findByPk(req.params.id);

    if (!image) {
      return res.status(404).json({
        message: 'Không tìm thấy hình ảnh'
      });
    }

    // Bỏ primary tất cả ảnh khác của sản phẩm
    await ProductImage.update(
      { isPrimary: false },
      { where: { productId: image.productId } }
    );

    await image.update({ isPrimary: true });

    res.json({
      message: 'Đặt ảnh đại diện thành công',
      image
    });
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi đặt ảnh đại diện. Vui lòng thử lại sau'
    });
  }
};

// ========================
// QUẢN LÝ BIẾN THỂ SẢN PHẨM
// ========================

// POST /products/:id/variants - Thêm biến thể
const addProductVariant = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      });
    }

    const { size, color, stock, sku } = req.body;

    if (!size || !color) {
      return res.status(400).json({
        message: 'Vui lòng nhập kích thước và màu sắc'
      });
    }

    // Kiểm tra biến thể trùng (cùng size và color)
    const existing = await ProductVariant.findOne({
      where: { productId: product.id, size, color }
    });

    if (existing) {
      return res.status(409).json({
        message: 'Biến thể với kích thước và màu sắc này đã tồn tại'
      });
    }

    const variant = await ProductVariant.create({
      productId: product.id,
      size,
      color,
      stock: stock || 0,
      sku: sku || null
    });

    res.status(201).json({
      message: 'Thêm biến thể sản phẩm thành công',
      variant
    });
  } catch (error) {
    console.error('Add product variant error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi thêm biến thể. Vui lòng thử lại sau'
    });
  }
};

// PUT /variants/:id - Cập nhật biến thể
const updateProductVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);

    if (!variant) {
      return res.status(404).json({
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    const { size, color, stock, sku } = req.body;

    // Kiểm tra trùng nếu thay đổi size hoặc color
    if ((size && size !== variant.size) || (color && color !== variant.color)) {
      const existing = await ProductVariant.findOne({
        where: {
          productId: variant.productId,
          size: size || variant.size,
          color: color || variant.color,
          id: { [Op.ne]: variant.id }
        }
      });

      if (existing) {
        return res.status(409).json({
          message: 'Biến thể với kích thước và màu sắc này đã tồn tại'
        });
      }
    }

    await variant.update({
      size: size || variant.size,
      color: color || variant.color,
      stock: stock !== undefined ? stock : variant.stock,
      sku: sku !== undefined ? sku : variant.sku
    });

    res.json({
      message: 'Cập nhật biến thể thành công',
      variant
    });
  } catch (error) {
    console.error('Update product variant error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật biến thể. Vui lòng thử lại sau'
    });
  }
};

// DELETE /variants/:id - Xóa biến thể
const deleteProductVariant = async (req, res) => {
  try {
    const variant = await ProductVariant.findByPk(req.params.id);

    if (!variant) {
      return res.status(404).json({
        message: 'Không tìm thấy biến thể sản phẩm'
      });
    }

    await variant.destroy();

    res.json({
      message: 'Xóa biến thể sản phẩm thành công'
    });
  } catch (error) {
    console.error('Delete product variant error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa biến thể. Vui lòng thử lại sau'
    });
  }
};

// ========================
// QUẢN LÝ VẬN CHUYỂN
// ========================

// GET /shipping-methods
const getShippingMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.findAll({
      order: [['createdAt', 'ASC']]
    });

    res.json({
      message: 'Lấy danh sách phương thức vận chuyển thành công',
      shippingMethods: methods
    });
  } catch (error) {
    console.error('Get shipping methods error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách phương thức vận chuyển. Vui lòng thử lại sau'
    });
  }
};

// POST /shipping-methods
const createShippingMethod = async (req, res) => {
  try {
    const { name, description, fee, estimatedDays, isActive } = req.body;

    if (!name || fee === undefined) {
      return res.status(400).json({
        message: 'Vui lòng nhập tên và phí vận chuyển'
      });
    }

    const method = await ShippingMethod.create({
      name,
      description: description || null,
      fee,
      estimatedDays: estimatedDays || null,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({
      message: 'Tạo phương thức vận chuyển thành công',
      shippingMethod: method
    });
  } catch (error) {
    console.error('Create shipping method error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi tạo phương thức vận chuyển. Vui lòng thử lại sau'
    });
  }
};

// PUT /shipping-methods/:id
const updateShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findByPk(req.params.id);

    if (!method) {
      return res.status(404).json({
        message: 'Không tìm thấy phương thức vận chuyển'
      });
    }

    const { name, description, fee, estimatedDays, isActive } = req.body;

    await method.update({
      name: name || method.name,
      description: description !== undefined ? description : method.description,
      fee: fee !== undefined ? fee : method.fee,
      estimatedDays: estimatedDays !== undefined ? estimatedDays : method.estimatedDays,
      isActive: isActive !== undefined ? isActive : method.isActive
    });

    res.json({
      message: 'Cập nhật phương thức vận chuyển thành công',
      shippingMethod: method
    });
  } catch (error) {
    console.error('Update shipping method error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật phương thức vận chuyển. Vui lòng thử lại sau'
    });
  }
};

// DELETE /shipping-methods/:id
const deleteShippingMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findByPk(req.params.id);

    if (!method) {
      return res.status(404).json({
        message: 'Không tìm thấy phương thức vận chuyển'
      });
    }

    await method.destroy();

    res.json({
      message: 'Xóa phương thức vận chuyển thành công'
    });
  } catch (error) {
    console.error('Delete shipping method error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa phương thức vận chuyển. Vui lòng thử lại sau'
    });
  }
};

// ========================
// CẤU HÌNH HỆ THỐNG
// ========================

// GET /system-config
const getSystemConfig = async (req, res) => {
  try {
    const configs = await SystemConfig.findAll({
      order: [['key', 'ASC']]
    });

    res.json({
      message: 'Lấy cấu hình hệ thống thành công',
      configs
    });
  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy cấu hình hệ thống. Vui lòng thử lại sau'
    });
  }
};

// PUT /system-config
const updateSystemConfig = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp khóa cấu hình'
      });
    }

    const [config, created] = await SystemConfig.findOrCreate({
      where: { key },
      defaults: { value }
    });

    if (!created) {
      await config.update({ value });
    }

    res.json({
      message: 'Cập nhật cấu hình thành công',
      config
    });
  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật cấu hình. Vui lòng thử lại sau'
    });
  }
};

// ========================
// BÁO CÁO
// ========================

// GET /reports/revenue - Báo cáo doanh thu
const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp ngày bắt đầu và ngày kết thúc'
      });
    }

    let dateFormat;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-W%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const results = await Order.findAll({
      where: {
        createdAt: {
          [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
        },
        status: { [Op.ne]: 'cancelled' }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat), 'label'],
        [sequelize.fn('SUM', sequelize.col('total')), 'revenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orderCount']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat), 'ASC']],
      raw: true
    });

    const labels = results.map(r => r.label);
    const data = results.map(r => parseFloat(r.revenue) || 0);
    const orderCounts = results.map(r => parseInt(r.orderCount) || 0);

    res.json({
      message: 'Lấy báo cáo doanh thu thành công',
      labels,
      data,
      orderCounts
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy báo cáo doanh thu. Vui lòng thử lại sau'
    });
  }
};

// GET /reports/best-sellers - Top sản phẩm bán chạy
const getBestSellers = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { totalSold: { [Op.gt]: 0 } },
      include: [
        {
          model: ProductImage,
          as: 'images',
          where: { isPrimary: true },
          attributes: ['url'],
          required: false
        }
      ],
      attributes: ['id', 'name', 'slug', 'price', 'salePrice', 'totalSold'],
      order: [['totalSold', 'DESC']],
      limit: 10
    });

    res.json({
      message: 'Lấy danh sách sản phẩm bán chạy thành công',
      products
    });
  } catch (error) {
    console.error('Get best sellers error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm bán chạy. Vui lòng thử lại sau'
    });
  }
};

// GET /reports/low-stock - Sản phẩm sắp hết hàng
const getLowStock = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: ProductVariant,
          as: 'variants',
          attributes: ['id', 'size', 'color', 'stock']
        },
        {
          model: ProductImage,
          as: 'images',
          where: { isPrimary: true },
          attributes: ['url'],
          required: false
        }
      ],
      attributes: {
        include: [
          [
            sequelize.literal('(SELECT COALESCE(SUM(pv.stock), 0) FROM product_variants AS pv WHERE pv.productId = Product.id)'),
            'totalStock'
          ]
        ]
      },
      having: sequelize.literal('totalStock < 10'),
      group: ['Product.id'],
      order: [[sequelize.literal('totalStock'), 'ASC']]
    });

    res.json({
      message: 'Lấy danh sách sản phẩm tồn kho thấp thành công',
      products
    });
  } catch (error) {
    console.error('Get low stock error:', error);

    // Fallback: dùng cách khác nếu GROUP BY/HAVING gặp vấn đề
    try {
      const allProducts = await Product.findAll({
        include: [
          {
            model: ProductVariant,
            as: 'variants',
            attributes: ['id', 'size', 'color', 'stock']
          },
          {
            model: ProductImage,
            as: 'images',
            where: { isPrimary: true },
            attributes: ['url'],
            required: false
          }
        ],
        where: { isActive: true }
      });

      const lowStockProducts = allProducts
        .map(p => {
          const plain = p.toJSON();
          plain.totalStock = plain.variants.reduce((sum, v) => sum + v.stock, 0);
          return plain;
        })
        .filter(p => p.totalStock < 10)
        .sort((a, b) => a.totalStock - b.totalStock);

      res.json({
        message: 'Lấy danh sách sản phẩm tồn kho thấp thành công',
        products: lowStockProducts
      });
    } catch (fallbackError) {
      console.error('Get low stock fallback error:', fallbackError);
      res.status(500).json({
        message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm tồn kho thấp. Vui lòng thử lại sau'
      });
    }
  }
};

// GET /products - Danh sách sản phẩm (admin, bao gồm inactive)
const getAdminProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: ProductImage,
          as: 'images',
          where: { isPrimary: true },
          required: false
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductVariant,
          as: 'variants',
          attributes: ['id', 'size', 'color', 'stock']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true
    });

    const totalPages = Math.ceil(count / limitNum);

    res.json({
      products,
      totalPages,
      currentPage: pageNum,
      totalProducts: count
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm' });
  }
};

// Upload ảnh chung (trả về URL Cloudinary)
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được tải lên' });
    }
    res.json({ url: req.file.path });
  } catch (error) {
    console.error('Lỗi upload ảnh:', error);
    res.status(500).json({ message: 'Lỗi khi tải ảnh lên' });
  }
};

module.exports = {
  getAdminProducts,
  getCustomers,
  toggleCustomerStatus,
  getProductImages,
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  getSystemConfig,
  updateSystemConfig,
  getRevenueReport,
  getBestSellers,
  getLowStock,
  uploadImage
};
