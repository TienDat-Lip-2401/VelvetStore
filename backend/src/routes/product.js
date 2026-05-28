const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { adminAuth } = require('../middleware/auth');

// Public routes
router.get('/', productController.getAll);
router.get('/featured', productController.getFeatured);
router.get('/sale', productController.getSale);
router.get('/category/:categoryId', productController.getByCategory);
router.get('/:id', productController.getById);

// Admin routes
router.post('/', adminAuth, productController.create);
router.put('/:id', adminAuth, productController.update);
router.delete('/:id', adminAuth, productController.delete);

module.exports = router;
