const { Op } = require('sequelize');
const { Blog, User } = require('../models');

// GET / - Lấy danh sách bài viết đã xuất bản
const getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: blogs } = await Blog.findAndCountAll({
      where: { isPublished: true },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'avatar']
        }
      ],
      attributes: ['id', 'title', 'slug', 'thumbnail', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Lấy danh sách bài viết thành công',
      blogs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách bài viết. Vui lòng thử lại sau'
    });
  }
};

// GET /:slug - Lấy bài viết theo slug
const getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const blog = await Blog.findOne({
      where: { slug, isPublished: true },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'avatar']
        }
      ]
    });

    if (!blog) {
      return res.status(404).json({
        message: 'Không tìm thấy bài viết'
      });
    }

    res.json({
      message: 'Lấy bài viết thành công',
      blog
    });
  } catch (error) {
    console.error('Get blog by slug error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy bài viết. Vui lòng thử lại sau'
    });
  }
};

// POST / - Tạo bài viết (admin)
const create = async (req, res) => {
  try {
    const { title, slug, content, thumbnail, isPublished } = req.body;

    if (!title || !slug || !content) {
      return res.status(400).json({
        message: 'Vui lòng nhập đầy đủ tiêu đề, slug và nội dung bài viết'
      });
    }

    const existingSlug = await Blog.findOne({ where: { slug } });
    if (existingSlug) {
      return res.status(409).json({
        message: 'Slug này đã được sử dụng. Vui lòng chọn slug khác'
      });
    }

    const blog = await Blog.create({
      title,
      slug,
      content,
      thumbnail: thumbnail || null,
      authorId: req.user.id,
      isPublished: isPublished !== undefined ? isPublished : false
    });

    const blogWithAuthor = await Blog.findByPk(blog.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'avatar']
        }
      ]
    });

    res.status(201).json({
      message: 'Tạo bài viết thành công',
      blog: blogWithAuthor
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi tạo bài viết. Vui lòng thử lại sau'
    });
  }
};

// PUT /:id - Cập nhật bài viết (admin)
const update = async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: 'Không tìm thấy bài viết'
      });
    }

    const { title, slug, content, thumbnail, isPublished } = req.body;

    if (slug && slug !== blog.slug) {
      const existingSlug = await Blog.findOne({
        where: { slug, id: { [Op.ne]: blog.id } }
      });
      if (existingSlug) {
        return res.status(409).json({
          message: 'Slug này đã được sử dụng. Vui lòng chọn slug khác'
        });
      }
    }

    await blog.update({
      title: title || blog.title,
      slug: slug || blog.slug,
      content: content || blog.content,
      thumbnail: thumbnail !== undefined ? thumbnail : blog.thumbnail,
      isPublished: isPublished !== undefined ? isPublished : blog.isPublished
    });

    const blogWithAuthor = await Blog.findByPk(blog.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'avatar']
        }
      ]
    });

    res.json({
      message: 'Cập nhật bài viết thành công',
      blog: blogWithAuthor
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật bài viết. Vui lòng thử lại sau'
    });
  }
};

// GET /admin - Lấy tất cả bài viết cho admin (bao gồm nháp)
const getAdminBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};
    const search = req.query.search;
    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }

    const { count, rows: blogs } = await Blog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'fullName', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Lấy danh sách bài viết thành công',
      blogs,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get admin blogs error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách bài viết. Vui lòng thử lại sau'
    });
  }
};

// DELETE /:id - Xóa bài viết (admin)
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);

    if (!blog) {
      return res.status(404).json({
        message: 'Không tìm thấy bài viết'
      });
    }

    await blog.destroy();

    res.json({
      message: 'Xóa bài viết thành công'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa bài viết. Vui lòng thử lại sau'
    });
  }
};

module.exports = {
  getAll,
  getAdminBlogs,
  getBySlug,
  create,
  update,
  delete: deleteBlog
};
