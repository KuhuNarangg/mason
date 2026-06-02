const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, updateTrackingUrl, updateAdminNotes, getOrderStats, trackOrder, returnOrder, handleItemReturn, requestOrderCancellation, handleCancellationRequest } = require('../controllers/orderController');
const { protect, adminOnly, adminOrVendor } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.post('/track', trackOrder);
router.get('/my', protect, getMyOrders);
router.get('/stats', protect, adminOrVendor, getOrderStats);
router.get('/', protect, adminOrVendor, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, adminOrVendor, updateOrderStatus);
router.put('/:id/tracking', protect, adminOrVendor, updateTrackingUrl);
router.put('/:id/admin-notes', protect, adminOrVendor, updateAdminNotes);
router.put('/:id/return', protect, returnOrder);
router.put('/:id/return-item-handle', protect, adminOrVendor, handleItemReturn);
router.put('/:id/cancel', protect, requestOrderCancellation);
router.put('/:id/cancel-handle', protect, adminOrVendor, handleCancellationRequest);

module.exports = router;
