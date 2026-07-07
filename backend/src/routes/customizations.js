const express = require('express');
const router = express.Router();
const {
  createGeneralRequest,
  getMyGeneralRequests,
  getAllGeneralRequests,
  createRequest,
  updateRequest,
  submitRequest,
  getCustomerRequests,
  getRequestDetail,
  respondToQuote,
  initiatePayment,
  verifyPayment,
  getVendorRequests,
  respondToRequest,
  updateProductionStatus,
  getVendorCustomAnalytics,
  getAdminOverview,
  getAdminVendorPerformance,
  resolveDispute,
  getAllRequests,
  updateRequestStatus,
  verifyGeneralPayment,
  cancelGeneralRequest
} = require('../controllers/customizationController');
const { protect, adminOnly, adminOrVendor, approvedVendor } = require('../middleware/auth');

/* ── General Bespoke Design Routes ─────────────────────────── */
// (used by the "Design Your Dream Outfit" customization page —
// simple requests not tied to a specific vendor/product)

// Create a general bespoke design request
router.post('/general', protect, createGeneralRequest);

// Cancel a general bespoke design request
router.put('/general/:id/cancel', protect, cancelGeneralRequest);

// Verify general bespoke design payment
router.post('/general/verify-payment', protect, verifyGeneralPayment);

// List logged-in customer's general bespoke design requests
router.get('/general/my-requests', protect, getMyGeneralRequests);

// Admin: list all general bespoke design requests
router.get('/general/admin', protect, adminOnly, getAllGeneralRequests);

// Get all general requests (for admin/vendor panel)
router.get('/', protect, adminOrVendor, getAllRequests);

// Update status of general request (for admin/vendor panel)
router.put('/:id/status', protect, adminOrVendor, updateRequestStatus);


/* ── Customer Routes ────────────────────────────────────────── */

// Create request (draft or submitted)
router.post('/', protect, createRequest);

// List logged-in customer's customization requests
router.get('/my-requests', protect, getCustomerRequests);

// Get single request details (checked internally for ownership)
router.get('/:id', protect, getRequestDetail);

// Update draft customization details
router.put('/:id', protect, updateRequest);

// Submit a draft customization request
router.put('/:id/submit', protect, submitRequest);

// Customer respond to quotation (accept, reject, change request)
router.put('/:id/respond-quote', protect, respondToQuote);

// Initiate Razorpay payment for quote
router.post('/:id/pay', protect, initiatePayment);

// Verify Razorpay signature and start production
router.post('/:id/verify-payment', protect, verifyPayment);


/* ── Vendor Routes ──────────────────────────────────────────── */

// List customization requests assigned to the approved vendor
router.get('/vendor/requests', protect, approvedVendor, getVendorRequests);

// Get vendor customization dashboard analytics
router.get('/vendor/analytics', protect, approvedVendor, getVendorCustomAnalytics);

// Vendor responds to customization request (approve, reject, quote)
router.put('/:id/vendor-respond', protect, approvedVendor, respondToRequest);

// Vendor updates production status
router.put('/:id/vendor-status', protect, approvedVendor, updateProductionStatus);


/* ── Admin Routes ───────────────────────────────────────────── */

// General custom requests stats overview for admin
router.get('/admin/overview', protect, adminOnly, getAdminOverview);

// Get vendors monitoring/ratings for custom orders
router.get('/admin/vendors', protect, adminOnly, getAdminVendorPerformance);

// Admin resolves a dispute (refund, replace, reject)
router.put('/:id/admin-dispute', protect, adminOnly, resolveDispute);

module.exports = router;
