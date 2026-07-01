const express = require('express');
const router  = express.Router();
const {
  getAllUsers, getUserDetail, deleteUser, getDashboardStats,
  getFailedPayments, manualConfirmOrder,
  createVendor, getVendors, getVendorById, approveVendor, rejectVendor, suspendVendor, reinstateVendor, setVendorCommission, deleteVendor,
  getReturns, getReviews, deleteReview, approveReview, getAnalytics,
  getSettlementsOverview, getVendorSettlementDetail, settleVendorPayout,
  getSettings, updateSettings,
} = require('../controllers/adminController');
const { getHomeMedia, getAdminHomeMedia, createHomeMedia, deleteHomeMedia } = require('../controllers/homeMediaController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/dashboard',                   getDashboardStats);
router.get('/analytics',                   getAnalytics);
router.get('/users',                       getAllUsers);
router.get('/users/:id',                   getUserDetail);
router.delete('/users/:id',                deleteUser);

/* ── Payment management ── */
router.get('/failed-payments',             getFailedPayments);
router.post('/orders/:id/manual-confirm',  manualConfirmOrder);

/* ── Vendor management ── */
router.post('/vendors',                    createVendor);
router.get('/vendors',                     getVendors);
router.get('/vendors/:id',                 getVendorById);
router.put('/vendors/:id/approve',         approveVendor);
router.put('/vendors/:id/reject',          rejectVendor);
router.put('/vendors/:id/suspend',         suspendVendor);
router.put('/vendors/:id/reinstate',       reinstateVendor);
router.put('/vendors/:id/commission',      setVendorCommission);
router.delete('/vendors/:id',              deleteVendor);

/* ── Home Media management ── */
router.get('/homemedia',                   getAdminHomeMedia);
router.post('/homemedia',                  createHomeMedia);
router.delete('/homemedia/:id',            deleteHomeMedia);

/* ── Returns management ── */
router.get('/returns',                     getReturns);

/* ── Reviews moderation ── */
router.get('/reviews',                     getReviews);
router.delete('/reviews/:productId/:reviewId', deleteReview);
router.put('/reviews/:productId/:reviewId/approve', approveReview);

/* ── Vendor settlements ── */
router.get('/settlements/overview',           getSettlementsOverview);
router.get('/settlements/vendor/:id',         getVendorSettlementDetail);
router.post('/settlements/vendor/:id/settle', settleVendorPayout);

/* ── Platform settings ── */
router.get('/settings',                    getSettings);
router.put('/settings',                    updateSettings);

module.exports = router;
