const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');
const {
  getAdminProducts,
  getCustomers,
  toggleCustomerStatus,
  getProductImages,
  uploadProductImages,
  deleteProductImage,
  setPrimaryImage,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getShippingMethods,
  createShippingMethod,
  updateShippingMethod,
  deleteShippingMethod,
  getSystemConfig,
  updateSystemConfig,
  getRevenueReport,
  getBestSellers,
  getLowStock,
  uploadImage
} = require('../controllers/adminController');
const { getBrands, createBrand, deleteBrand, getMaterials, createMaterial, deleteMaterial } = require('../controllers/brandMaterialController');

// Tất cả route yêu cầu quyền admin
router.use(adminAuth);

// Quản lý sản phẩm (admin)
router.get('/products', getAdminProducts);

// Quản lý khách hàng
router.get('/customers', getCustomers);
router.put('/customers/:id/toggle-status', toggleCustomerStatus);

// Quản lý hình ảnh sản phẩm
router.post('/products/:id/images', upload.array('images', 10), uploadProductImages);
router.get('/products/:id/images', getProductImages);
router.delete('/images/:id', deleteProductImage);
router.put('/images/:id/primary', setPrimaryImage);

// Quản lý biến thể sản phẩm
router.post('/products/:id/variants', addProductVariant);
router.put('/variants/:id', updateProductVariant);
router.delete('/variants/:id', deleteProductVariant);

// Quản lý phương thức vận chuyển
router.get('/shipping-methods', getShippingMethods);
router.post('/shipping-methods', createShippingMethod);
router.put('/shipping-methods/:id', updateShippingMethod);
router.delete('/shipping-methods/:id', deleteShippingMethod);

// Cấu hình hệ thống
router.get('/system-config', getSystemConfig);
router.put('/system-config', updateSystemConfig);

// Upload ảnh chung
router.post('/upload', upload.single('image'), uploadImage);

// Báo cáo
router.get('/reports/revenue', getRevenueReport);
router.get('/reports/best-sellers', getBestSellers);
router.get('/reports/low-stock', getLowStock);

// Thương hiệu
router.get('/brands', getBrands);
router.post('/brands', createBrand);
router.delete('/brands/:id', deleteBrand);

// Chất liệu
router.get('/materials', getMaterials);
router.post('/materials', createMaterial);
router.delete('/materials/:id', deleteMaterial);

module.exports = router;
