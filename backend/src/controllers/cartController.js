const { Cart, ProductVariant, Product, ProductImage } = require('../models');

// GET / - Lấy giỏ hàng của người dùng
const getCart = async (req, res) => {
  try {
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
              attributes: ['id', 'name', 'slug', 'price', 'salePrice', 'isActive'],
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  attributes: ['id', 'url', 'isPrimary', 'sortOrder'],
                  order: [['isPrimary', 'DESC'], ['sortOrder', 'ASC']]
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    let totalAmount = 0;
    const items = cartItems.map(item => {
      const variant = item.variant;
      const product = variant ? variant.product : null;
      const price = product
        ? Number(product.salePrice || product.price)
        : 0;
      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;

      return {
        ...item.toJSON(),
        price,
        itemTotal
      };
    });

    res.json({
      message: 'Lấy giỏ hàng thành công',
      cart: items,
      totalAmount,
      totalItems: items.length
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi lấy giỏ hàng. Vui lòng thử lại sau'
    });
  }
};

// POST / - Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const { variantId, quantity = 1 } = req.body;

    if (!variantId) {
      return res.status(400).json({
        message: 'Vui lòng chọn phiên bản sản phẩm'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        message: 'Số lượng phải lớn hơn 0'
      });
    }

    const variant = await ProductVariant.findByPk(variantId, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'isActive']
        }
      ]
    });

    if (!variant) {
      return res.status(404).json({
        message: 'Không tìm thấy phiên bản sản phẩm'
      });
    }

    if (!variant.product || !variant.product.isActive) {
      return res.status(400).json({
        message: 'Sản phẩm hiện không còn bán'
      });
    }

    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const existingItem = await Cart.findOne({
      where: {
        userId: req.user.id,
        variantId
      }
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (newQuantity > variant.stock) {
        return res.status(400).json({
          message: `Số lượng tồn kho không đủ. Chỉ còn ${variant.stock} sản phẩm`
        });
      }

      await existingItem.update({ quantity: newQuantity });

      res.json({
        message: 'Cập nhật số lượng trong giỏ hàng thành công',
        cartItem: existingItem
      });
    } else {
      if (quantity > variant.stock) {
        return res.status(400).json({
          message: `Số lượng tồn kho không đủ. Chỉ còn ${variant.stock} sản phẩm`
        });
      }

      const cartItem = await Cart.create({
        userId: req.user.id,
        variantId,
        quantity
      });

      res.status(201).json({
        message: 'Thêm sản phẩm vào giỏ hàng thành công',
        cartItem
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi thêm vào giỏ hàng. Vui lòng thử lại sau'
    });
  }
};

// PUT /:id - Cập nhật số lượng sản phẩm trong giỏ hàng
const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        message: 'Số lượng phải lớn hơn 0'
      });
    }

    const cartItem = await Cart.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    const variant = await ProductVariant.findByPk(cartItem.variantId);

    if (!variant) {
      return res.status(404).json({
        message: 'Phiên bản sản phẩm không còn tồn tại'
      });
    }

    if (quantity > variant.stock) {
      return res.status(400).json({
        message: `Số lượng tồn kho không đủ. Chỉ còn ${variant.stock} sản phẩm`
      });
    }

    await cartItem.update({ quantity });

    res.json({
      message: 'Cập nhật số lượng thành công',
      cartItem
    });
  } catch (error) {
    console.error('Update cart quantity error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi cập nhật giỏ hàng. Vui lòng thử lại sau'
    });
  }
};

// DELETE /:id - Xóa sản phẩm khỏi giỏ hàng
const removeItem = async (req, res) => {
  try {
    const { id } = req.params;

    const cartItem = await Cart.findOne({
      where: {
        id,
        userId: req.user.id
      }
    });

    if (!cartItem) {
      return res.status(404).json({
        message: 'Không tìm thấy sản phẩm trong giỏ hàng'
      });
    }

    await cartItem.destroy();

    res.json({
      message: 'Xóa sản phẩm khỏi giỏ hàng thành công'
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa sản phẩm. Vui lòng thử lại sau'
    });
  }
};

// DELETE / - Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
  try {
    await Cart.destroy({
      where: { userId: req.user.id }
    });

    res.json({
      message: 'Đã xóa toàn bộ giỏ hàng'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      message: 'Đã xảy ra lỗi khi xóa giỏ hàng. Vui lòng thử lại sau'
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeItem,
  clearCart
};
