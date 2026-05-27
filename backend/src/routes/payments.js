const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyPayment, handleWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

// Create a Razorpay order (requires auth + existing DB order)
router.post('/create-razorpay-order', protect, createRazorpayOrder);

// Verify payment signature after Razorpay modal success
router.post('/verify', protect, verifyPayment);

// Razorpay webhook (no auth — uses HMAC signature check internally)
router.post('/webhook', handleWebhook);

module.exports = router;
