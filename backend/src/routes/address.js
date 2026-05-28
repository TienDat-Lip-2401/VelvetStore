const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefault
} = require('../controllers/addressController');

// Tất cả route yêu cầu đăng nhập
router.use(auth);

router.get('/', getAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);
router.put('/:id/default', setDefault);

module.exports = router;
