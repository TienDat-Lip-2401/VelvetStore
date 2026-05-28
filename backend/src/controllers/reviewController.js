const { Op } = require('sequelize');
const { Review, Product, User } = require('../models');

// Hàm tính lại avgRating cho sản phẩm
const recalcAvgRating = async (productId) => {
  const reviews = await Review.findAll({
    where: { productId, isVisible: true },
    attributes: ['rating']
  });

  if (reviews.length === 0) {
    await Product.update({ avgRating: 0 }, { where: { id: productId } });
    return;
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = (sum / reviews.length).toFixed(1);
  await Product.update({ avgRating: avg }, { where: { id: productId } });
};

// GET /product/:productId - Lấy đánh giá của sản phẩm
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { productId, isVisible: true },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'avatar']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      message: 'Lấy danh sách đánh giá thành công',
      reviews,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách đánh giá. Vui lòng thử lại sau'
    });
  }
};

// POST / - Tạo đánh giá mới
const createReview = async (req, res) => {
  try {
    const { productId, rating, comment, images, orderId } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp mã sản phẩm và số sao đánh giá'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: 'Số sao đánh giá phải từ 1 đến 5'
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Kiểm tra đã đánh giá chưa (mỗi user chỉ đánh giá 1 lần cho mỗi sản phẩm)
    const existing = await Review.findOne({
      where: { userId: req.user.id, productId }
    });

    if (existing) {
      return res.status(409).json({
        message: 'Bạn đã đánh giá sản phẩm này rồi'
      });
    }

    const review = await Review.create({
      userId: req.user.id,
      productId,
      orderId: orderId || null,
      rating,
      comment: comment || null,
      images: images || null
    });

    // Cập nhật avgRating
    await recalcAvgRating(productId);

    const reviewWithUser = await Review.findByPk(review.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'avatar']
        }
      ]
    });

    res.status(201).json({
      message: 'Đánh giá sản phẩm thành công',
      review: reviewWithUser
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi đánh giá sản phẩm. Vui lòng thử lại sau'
    });
  }
};

// GET /admin - Lấy tất cả đánh giá (admin)
const getAllReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = {};
    const includeClause = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'avatar']
      },
      {
        model: Product,
        as: 'product',
        attributes: ['id', 'name', 'slug']
      }
    ];

    if (search) {
      whereClause[Op.or] = [
        { comment: { [Op.like]: `%${search}%` } },
        { '$user.fullName$': { [Op.like]: `%${search}%` } },
        { '$product.name$': { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      subQuery: false
    });

    res.json({
      message: 'Lấy danh sách đánh giá thành công',
      reviews,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách đánh giá. Vui lòng thử lại sau'
    });
  }
};

// DELETE /:id - Xóa đánh giá (admin)
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({
        message: 'Không tìm thấy đánh giá'
      });
    }

    const productId = review.productId;
    await review.destroy();

    // Cập nhật avgRating
    await recalcAvgRating(productId);

    res.json({
      message: 'Xóa đánh giá thành công'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa đánh giá. Vui lòng thử lại sau'
    });
  }
};

// PUT /:id/toggle - Ẩn/hiện đánh giá (admin)
const toggleVisibility = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({
        message: 'Không tìm thấy đánh giá'
      });
    }

    await review.update({ isVisible: !review.isVisible });

    // Cập nhật avgRating (vì chỉ tính các đánh giá visible)
    await recalcAvgRating(review.productId);

    res.json({
      message: review.isVisible ? 'Đã hiện đánh giá' : 'Đã ẩn đánh giá',
      review
    });
  } catch (error) {
    console.error('Toggle review visibility error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi thay đổi trạng thái đánh giá. Vui lòng thử lại sau'
    });
  }
};

module.exports = {
  getProductReviews,
  getAllReviews,
  createReview,
  deleteReview,
  toggleVisibility
};
