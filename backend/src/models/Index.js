const sequelize = require("../config/database");
const User = require("./User");
const Category = require("./Category");
const Product = require("./Product");
const ProductImage = require("./ProductImage");
const ProductVariant = require("./ProductVariant");
const Address = require("./Address");
const Cart = require("./Cart");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Wishlist = require("./Wishlist");
const Review = require("./Review");
const Voucher = require("./Voucher");
const Blog = require("./Blog");
const Contact = require("./Contact");
const ShippingMethod = require("./ShippingMethod");
const SystemConfig = require("./SystemConfig");
const Brand = require("./Brand");
const Material = require("./Material");

// Product - Category
Product.belongsTo(Category, { foreignKey: "categoryId", as: "category" });
Category.hasMany(Product, { foreignKey: "categoryId", as: "products" });

// Product - Images
Product.hasMany(ProductImage, { foreignKey: "productId", as: "images" });
ProductImage.belongsTo(Product, { foreignKey: "productId" });

// Product - Variants
Product.hasMany(ProductVariant, { foreignKey: "productId", as: "variants" });
ProductVariant.belongsTo(Product, { foreignKey: "productId", as: "product" });

// User - Address
User.hasMany(Address, { foreignKey: "userId", as: "addresses" });
Address.belongsTo(User, { foreignKey: "userId" });

// Cart
Cart.belongsTo(User, { foreignKey: "userId" });
Cart.belongsTo(ProductVariant, { foreignKey: "variantId", as: "variant" });
User.hasMany(Cart, { foreignKey: "userId", as: "cartItems" });

// Order
Order.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Order, { foreignKey: "userId", as: "orders" });
Order.hasMany(OrderItem, { foreignKey: "orderId", as: "items" });
OrderItem.belongsTo(Order, { foreignKey: "orderId" });
OrderItem.belongsTo(ProductVariant, { foreignKey: "variantId", as: "variant" });
Order.belongsTo(Voucher, { foreignKey: "voucherId", as: "voucher" });

// Wishlist
Wishlist.belongsTo(User, { foreignKey: "userId" });
Wishlist.belongsTo(Product, { foreignKey: "productId", as: "product" });
User.hasMany(Wishlist, { foreignKey: "userId", as: "wishlists" });

// Review
Review.belongsTo(User, { foreignKey: "userId", as: "user" });
Review.belongsTo(Product, { foreignKey: "productId", as: "product" });
Product.hasMany(Review, { foreignKey: "productId", as: "reviews" });

// Blog
Blog.belongsTo(User, { foreignKey: "authorId", as: "author" });

module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductImage,
  ProductVariant,
  Address,
  Cart,
  Order,
  OrderItem,
  Wishlist,
  Review,
  Voucher,
  Blog,
  Contact,
  ShippingMethod,
  SystemConfig,
  Brand,
  Material,
};
