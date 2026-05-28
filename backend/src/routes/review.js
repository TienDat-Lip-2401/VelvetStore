const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  getProductReviews,
  getAllReviews,
  createReview,
  deleteReview,
  toggleVisibility
} = require('../controllers/reviewController');

// Admin - lấy tất cả đánh giá
router.get('/admin', adminAuth, getAllReviews);

// Public
router.get('/product/:productId', getProductReviews);

// Yêu cầu đăng nhập
router.post('/', auth, createReview);

// Yêu cầu quyền admin
router.delete('/:id', adminAuth, deleteReview);
router.put('/:id/toggle', adminAuth, toggleVisibility);

module.exports = router;
