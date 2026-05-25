const express = require('express');
const router = express.Router();
const { getCoupons, createCoupon, deleteCoupon, validateCoupon } = require('../controllers/couponController');
const { protect, adminOnly } = require('../middleware/auth');

// Public/User route
router.post('/validate', validateCoupon);

// Admin only routes
router.get('/', protect, adminOnly, getCoupons);
router.post('/', protect, adminOnly, createCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
