const { Wishlist, Product, ProductImage } = require('../models');

// GET / - Lấy danh sách yêu thích
const getWishlist = async (req, res) => {
  try {
    const wishlists = await Wishlist.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'slug', 'price', 'salePrice', 'avgRating', 'isActive'],
          include: [
            {
              model: ProductImage,
              as: 'images',
              attributes: ['id', 'url', 'isPrimary'],
              order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      message: 'Lấy danh sách yêu thích thành công',
      wishlists
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy danh sách yêu thích. Vui lòng thử lại sau'
    });
  }
};

// POST / - Thêm sản phẩm vào danh sách yêu thích
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp mã sản phẩm'
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm'
      });
    }

    // Kiểm tra trùng lặp
    const existing = await Wishlist.findOne({
      where: { userId: req.user.id, productId }
    });

    if (existing) {
      return res.status(409).json({
        message: 'Sản phẩm đã có trong danh sách yêu thích'
      });
    }

    const wishlistItem = await Wishlist.create({
      userId: req.user.id,
      productId
    });

    res.status(201).json({
      message: 'Đã thêm sản phẩm vào danh sách yêu thích',
      wishlistItem
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi thêm vào danh sách yêu thích. Vui lòng thử lại sau'
    });
  }
};

// DELETE /:productId - Xóa sản phẩm khỏi danh sách yêu thích
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlistItem = await Wishlist.findOne({
      where: { userId: req.user.id, productId }
    });

    if (!wishlistItem) {
      return res.status(404).json({
        message: 'Sản phẩm không có trong danh sách yêu thích'
      });
    }

    await wishlistItem.destroy();

    res.json({
      message: 'Đã xóa sản phẩm khỏi danh sách yêu thích'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa khỏi danh sách yêu thích. Vui lòng thử lại sau'
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
