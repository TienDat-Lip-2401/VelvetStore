const { Product, Category, ProductImage, ProductVariant, Review, User } = require('../models');
const { Op } = require('sequelize');

// Lấy danh sách sản phẩm với phân trang, lọc, sắp xếp
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      categoryId,
      search,
      minPrice,
      maxPrice,
      color,
      size,
      sort
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const offset = (pageNum - 1) * limitNum;

    // Xây dựng điều kiện lọc sản phẩm
    const where = { isActive: true };

    if (categoryId) {
      const childCategories = await Category.findAll({
        where: { parentId: categoryId, isActive: true },
        attributes: ['id']
      });
      const categoryIds = [parseInt(categoryId), ...childCategories.map(c => c.id)];
      where.categoryId = { [Op.in]: categoryIds };
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ];
    }

    if (minPrice) {
      where.price = { ...where.price, [Op.gte]: parseFloat(minPrice) };
    }

    if (maxPrice) {
      where.price = { ...where.price, [Op.lte]: parseFloat(maxPrice) };
    }

    // Lọc theo màu sắc hoặc kích thước qua biến thể
    const variantWhere = {};
    if (color) {
      const colorMap = {
        'den': { [Op.like]: '%Đen%' },
        'trang': { [Op.like]: '%Trắng%' },
        'do': { [Op.like]: '%Đỏ%' },
        'xanh-duong': { [Op.or]: [{ [Op.like]: '%Xanh dương%' }, { [Op.like]: '%Xanh nhạt%' }, { [Op.like]: '%Xanh đậm%' }, { [Op.like]: '%Xanh navy%' }, { [Op.eq]: 'Xanh' }] },
        'xanh-la': { [Op.or]: [{ [Op.like]: '%Xanh lá%' }, { [Op.like]: '%Xanh rêu%' }] },
        'vang': { [Op.like]: '%Vàng%' },
        'hong': { [Op.like]: '%Hồng%' },
        'nau': { [Op.like]: '%Nâu%' },
        'xam': { [Op.like]: '%Xám%' },
        'be': { [Op.like]: '%Be%' }
      };

      const mappedCondition = colorMap[color.toLowerCase()];
      if (mappedCondition) {
        variantWhere.color = mappedCondition;
      } else {
        variantWhere.color = { [Op.like]: `%${color}%` };
      }
    }
    if (size) {
      variantWhere.size = size;
    }
    const hasVariantFilter = Object.keys(variantWhere).length > 0;

    // Sắp xếp
    let order = [['createdAt', 'DESC']];
    if (sort) {
      switch (sort) {
        case 'price_asc':
          order = [['price', 'ASC']];
          break;
        case 'price_desc':
          order = [['price', 'DESC']];
          break;
        case 'name_asc':
          order = [['name', 'ASC']];
          break;
        case 'name_desc':
          order = [['name', 'DESC']];
          break;
        case 'newest':
          order = [['createdAt', 'DESC']];
          break;
        case 'best_selling':
          order = [['totalSold', 'DESC']];
          break;
        case 'rating':
          order = [['avgRating', 'DESC']];
          break;
        default:
          order = [['createdAt', 'DESC']];
      }
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
        ...(hasVariantFilter
          ? [
              {
                model: ProductVariant,
                as: 'variants',
                where: variantWhere,
                required: true
              }
            ]
          : [])
      ],
      order,
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
    console.error('Lỗi khi lấy danh sách sản phẩm:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm' });
  }
};

// Lấy chi tiết sản phẩm theo ID hoặc slug
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const where = { isActive: true };
    if (isNaN(id)) {
      where.slug = id;
    } else {
      where.id = id;
    }

    const product = await Product.findOne({
      where,
      include: [
        {
          model: ProductImage,
          as: 'images',
          order: [['sortOrder', 'ASC']]
        },
        {
          model: ProductVariant,
          as: 'variants'
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Review,
          as: 'reviews',
          where: { isVisible: true },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'avatar']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy chi tiết sản phẩm' });
  }
};

// Lấy sản phẩm nổi bật
const getFeatured = async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { isActive: true, isFeatured: true },
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
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 8
    });

    res.json({ products });
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm nổi bật:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy sản phẩm nổi bật' });
  }
};

// Lấy sản phẩm đang giảm giá
const getSale = async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows: products } = await Product.findAndCountAll({
      where: {
        isActive: true,
        salePrice: { [Op.ne]: null, [Op.lt]: Product.sequelize.col('price') }
      },
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
    console.error('Lỗi khi lấy sản phẩm giảm giá:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy sản phẩm giảm giá' });
  }
};

// Lấy sản phẩm theo danh mục
const getByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const offset = (pageNum - 1) * limitNum;

    // Kiểm tra danh mục tồn tại
    const category = await Category.findOne({
      where: { id: categoryId, isActive: true }
    });

    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    // Lấy danh mục con để bao gồm sản phẩm
    const childCategories = await Category.findAll({
      where: { parentId: categoryId, isActive: true },
      attributes: ['id']
    });
    const categoryIds = [parseInt(categoryId), ...childCategories.map(c => c.id)];

    const { count, rows: products } = await Product.findAndCountAll({
      where: {
        isActive: true,
        categoryId: { [Op.in]: categoryIds }
      },
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
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true
    });

    const totalPages = Math.ceil(count / limitNum);

    res.json({
      category,
      products,
      totalPages,
      currentPage: pageNum,
      totalProducts: count
    });
  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm theo danh mục:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy sản phẩm theo danh mục' });
  }
};

// Tạo sản phẩm mới (Admin)
const create = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      salePrice,
      categoryId,
      material,
      brand,
      isFeatured
    } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        message: 'Tên và giá sản phẩm không được để trống'
      });
    }

    // Auto-generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    }

    const existingSlug = await Product.findOne({ where: { slug: finalSlug } });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    const category = await Category.findOne({
      where: { id: categoryId, isActive: true }
    });
    if (!category) {
      return res.status(400).json({ message: 'Danh mục không tồn tại hoặc đã bị vô hiệu hóa' });
    }

    if (salePrice && parseFloat(salePrice) >= parseFloat(price)) {
      return res.status(400).json({ message: 'Giá khuyến mãi phải nhỏ hơn giá gốc' });
    }

    const product = await Product.create({
      name,
      slug: finalSlug,
      description: description || null,
      price,
      salePrice: salePrice || null,
      categoryId,
      material: material || null,
      brand: brand || null,
      isFeatured: isFeatured || false
    });

    res.status(201).json({ message: 'Tạo sản phẩm thành công', product });
  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo sản phẩm' });
  }
};

// Cập nhật sản phẩm (Admin)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      slug,
      description,
      price,
      salePrice,
      categoryId,
      material,
      brand,
      isFeatured
    } = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    if (slug && slug !== product.slug) {
      const existingSlug = await Product.findOne({ where: { slug } });
      if (existingSlug) {
        return res.status(400).json({ message: 'Đường dẫn sản phẩm đã tồn tại' });
      }
    }

    if (categoryId) {
      const category = await Category.findOne({
        where: { id: categoryId, isActive: true }
      });
      if (!category) {
        return res.status(400).json({ message: 'Danh mục không tồn tại hoặc đã bị vô hiệu hóa' });
      }
    }

    const effectivePrice = price !== undefined ? price : product.price;
    const effectiveSalePrice = salePrice !== undefined ? salePrice : product.salePrice;
    if (effectiveSalePrice && parseFloat(effectiveSalePrice) >= parseFloat(effectivePrice)) {
      return res.status(400).json({ message: 'Giá khuyến mãi phải nhỏ hơn giá gốc' });
    }

    await product.update({
      name: name !== undefined ? name : product.name,
      slug: slug !== undefined ? slug : product.slug,
      description: description !== undefined ? description : product.description,
      price: price !== undefined ? price : product.price,
      salePrice: salePrice !== undefined ? salePrice : product.salePrice,
      categoryId: categoryId !== undefined ? categoryId : product.categoryId,
      material: material !== undefined ? material : product.material,
      brand: brand !== undefined ? brand : product.brand,
      isFeatured: isFeatured !== undefined ? isFeatured : product.isFeatured
    });

    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: ProductImage,
          as: 'images'
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    res.json({ message: 'Cập nhật sản phẩm thành công', product: updatedProduct });
  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật sản phẩm' });
  }
};

// Xóa mềm sản phẩm (Admin)
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    await product.update({ isActive: false });

    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa sản phẩm' });
  }
};

module.exports = {
  getAll,
  getById,
  getFeatured,
  getSale,
  getByCategory,
  create,
  update,
  delete: remove
};
