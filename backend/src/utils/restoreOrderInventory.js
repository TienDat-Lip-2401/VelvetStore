const { ProductVariant, Product, Voucher, sequelize } = require('../models');

// Hoàn lại tồn kho, lượt bán và lượt dùng voucher của một đơn bị hủy.
// order phải được load kèm `items`; gọi trong transaction của nơi hủy đơn.
const restoreOrderInventory = async (order, transaction) => {
  for (const item of order.items) {
    await ProductVariant.update(
      { stock: sequelize.literal(`stock + ${Number(item.quantity)}`) },
      { where: { id: item.variantId }, transaction }
    );

    const variant = await ProductVariant.findByPk(item.variantId, { transaction });
    if (variant) {
      await Product.update(
        { totalSold: sequelize.literal(`GREATEST(totalSold - ${Number(item.quantity)}, 0)`) },
        { where: { id: variant.productId }, transaction }
      );
    }
  }

  if (order.voucherId) {
    await Voucher.update(
      { usedCount: sequelize.literal('GREATEST(usedCount - 1, 0)') },
      { where: { id: order.voucherId }, transaction }
    );
  }
};

module.exports = { restoreOrderInventory };
