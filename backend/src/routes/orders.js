const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrderById, getAllOrders, updateOrderStatus, getOrderStats, trackOrder, returnOrder, handleItemReturn, requestOrderCancellation, handleCancellationRequest } = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.post('/track', trackOrder);
router.get('/my', protect, getMyOrders);
router.get('/stats', protect, adminOnly, getOrderStats);
router.get('/', protect, adminOnly, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, adminOnly, updateOrderStatus);
router.put('/:id/return', protect, returnOrder);
router.put('/:id/return-item-handle', protect, adminOnly, handleItemReturn);
router.put('/:id/cancel', protect, requestOrderCancellation);
router.put('/:id/cancel-handle', protect, adminOnly, handleCancellationRequest);

module.exports = router;
