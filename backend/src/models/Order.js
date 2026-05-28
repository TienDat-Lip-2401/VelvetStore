const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subtotal: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  shippingFee: {
    type: DataTypes.DECIMAL(12, 0),
    defaultValue: 0
  },
  discount: {
    type: DataTypes.DECIMAL(12, 0),
    defaultValue: 0
  },
  total: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('cod', 'vnpay'),
    defaultValue: 'cod'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending'
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipping', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  voucherId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  vnpayTransactionId: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;
