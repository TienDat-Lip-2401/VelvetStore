const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { adminAuth } = require('../middleware/auth');

// Public routes
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

// Admin routes
router.post('/', adminAuth, categoryController.create);
router.put('/:id', adminAuth, categoryController.update);
router.delete('/:id', adminAuth, categoryController.delete);

module.exports = router;
