const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShippingMethod = sequelize.define('ShippingMethod', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  fee: {
    type: DataTypes.DECIMAL(12, 0),
    allowNull: false
  },
  estimatedDays: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'shipping_methods',
  timestamps: true
});

module.exports = ShippingMethod;
