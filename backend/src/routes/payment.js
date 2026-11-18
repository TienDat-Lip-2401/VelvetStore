const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createVnpayUrl,
  vnpayReturn,
  vnpayIpn
} = require('../controllers/paymentController');

router.post('/create-vnpay-url', auth, createVnpayUrl);
router.get('/vnpay-return', vnpayReturn);
router.get('/vnpay-ipn', vnpayIpn);

module.exports = router;
