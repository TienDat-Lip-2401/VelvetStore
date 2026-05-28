const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/orderController');

router.post('/', auth, createOrder);
router.get('/my-orders', auth, getMyOrders);
router.get('/stats', adminAuth, getOrderStats);
router.get('/admin', adminAuth, getAllOrders);
router.put('/:id/cancel', auth, cancelOrder);
router.put('/:id/status', adminAuth, updateOrderStatus);
router.get('/:id', auth, getOrderById);

module.exports = router;
