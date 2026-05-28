const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const voucherController = require('../controllers/voucherController');

// Yêu cầu đăng nhập
router.post('/validate', auth, voucherController.validate);

// Yêu cầu quyền admin
router.get('/', adminAuth, voucherController.getAll);
router.get('/:id', adminAuth, voucherController.getById);
router.post('/', adminAuth, voucherController.create);
router.put('/:id', adminAuth, voucherController.update);
router.delete('/:id', adminAuth, voucherController.delete);

module.exports = router;
