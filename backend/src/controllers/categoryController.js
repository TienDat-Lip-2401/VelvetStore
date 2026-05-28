const { Category, Product, ProductImage } = require('../models');

// Lấy tất cả danh mục đang hoạt động kèm danh mục con
const getAll = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true, parentId: null },
      include: [
        {
          model: Category,
          as: 'children',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: Category,
              as: 'children',
              where: { isActive: true },
              required: false
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({ categories });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách danh mục:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy danh sách danh mục' });
  }
};

// Lấy chi tiết danh mục theo ID kèm sản phẩm
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: Category,
          as: 'children',
          where: { isActive: true },
          required: false
        },
        {
          model: Product,
          as: 'products',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: ProductImage,
              as: 'images',
              where: { isPrimary: true },
              required: false
            }
          ]
        }
      ]
    });

    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    res.json({ category });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết danh mục:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi lấy chi tiết danh mục' });
  }
};

// Tạo danh mục mới (Admin)
const create = async (req, res) => {
  try {
    const { name, slug, description, image, parentId } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ message: 'Tên và đường dẫn danh mục không được để trống' });
    }

    const existingSlug = await Category.findOne({ where: { slug } });
    if (existingSlug) {
      return res.status(400).json({ message: 'Đường dẫn danh mục đã tồn tại' });
    }

    if (parentId) {
      const parentCategory = await Category.findByPk(parentId);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
      }
    }

    const category = await Category.create({
      name,
      slug,
      description: description || null,
      image: image || null,
      parentId: parentId || null
    });

    res.status(201).json({ message: 'Tạo danh mục thành công', category });
  } catch (error) {
    console.error('Lỗi khi tạo danh mục:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi tạo danh mục' });
  }
};

// Cập nhật danh mục (Admin)
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, image, parentId } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    if (slug && slug !== category.slug) {
      const existingSlug = await Category.findOne({ where: { slug } });
      if (existingSlug) {
        return res.status(400).json({ message: 'Đường dẫn danh mục đã tồn tại' });
      }
    }

    if (parentId) {
      if (parseInt(parentId) === parseInt(id)) {
        return res.status(400).json({ message: 'Danh mục không thể là danh mục cha của chính nó' });
      }
      const parentCategory = await Category.findByPk(parentId);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Danh mục cha không tồn tại' });
      }
    }

    await category.update({
      name: name !== undefined ? name : category.name,
      slug: slug !== undefined ? slug : category.slug,
      description: description !== undefined ? description : category.description,
      image: image !== undefined ? image : category.image,
      parentId: parentId !== undefined ? parentId : category.parentId
    });

    res.json({ message: 'Cập nhật danh mục thành công', category });
  } catch (error) {
    console.error('Lỗi khi cập nhật danh mục:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật danh mục' });
  }
};

// Xóa mềm danh mục (Admin)
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    // Kiểm tra danh mục con
    const childCount = await Category.count({ where: { parentId: id, isActive: true } });
    if (childCount > 0) {
      return res.status(400).json({ message: 'Không thể xóa danh mục đang có danh mục con hoạt động' });
    }

    // Kiểm tra sản phẩm
    const productCount = await Product.count({ where: { categoryId: id, isActive: true } });
    if (productCount > 0) {
      return res.status(400).json({ message: 'Không thể xóa danh mục đang có sản phẩm hoạt động' });
    }

    await category.update({ isActive: false });

    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    console.error('Lỗi khi xóa danh mục:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi xóa danh mục' });
  }
};

module.exports = { getAll, getById, create, update, delete: remove };
