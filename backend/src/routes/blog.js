const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const blogController = require('../controllers/blogController');

// Admin - phải đặt trước /:slug để không bị match nhầm
router.get('/admin', adminAuth, blogController.getAdminBlogs);

// Public
router.get('/', blogController.getAll);
router.get('/:slug', blogController.getBySlug);

// Yêu cầu quyền admin
router.post('/', adminAuth, blogController.create);
router.put('/:id', adminAuth, blogController.update);
router.delete('/:id', adminAuth, blogController.delete);

module.exports = router;
