const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  create,
  getAll,
  markAsRead
} = require('../controllers/contactController');

// Public
router.post('/', create);

// Yêu cầu quyền admin
router.get('/', adminAuth, getAll);
router.put('/:id/read', adminAuth, markAsRead);

module.exports = router;
