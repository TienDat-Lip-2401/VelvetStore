const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Voucher = sequelize.define('Voucher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  discountType: {
    type: DataTypes.ENUM('percent', 'fixed'),
    allowNull: false
  },
  discountValue: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  minOrderValue: {
    type: DataTypes.DECIMAL(12, 0),
    defaultValue: 0
  },
  maxDiscount: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: true
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'vouchers',
  timestamps: true
});

module.exports = Voucher;
