const express = require('express');
const router = express.Router();
const {
  generateShipmentForOrder,
  printShipmentLabel,
  trackShipment,
  requestReturnShipment,
  receiveShiprocketWebhook
} = require('../controllers/shiprocketController');
const { protect, approvedVendor } = require('../middleware/auth');

// Vendor/Admin: Create shipment ad-hoc order & assign courier AWB
router.post('/create/:orderId', protect, approvedVendor, generateShipmentForOrder);

// Vendor/Admin: Generate and fetch printable shipping label PDF URL
router.get('/label/:shipmentId', protect, approvedVendor, printShipmentLabel);

// Customer/Vendor/Admin: Track package checkpoints
router.get('/track/:orderId', protect, trackShipment);

// Vendor/Admin: Initiate reverse return pickup
router.post('/return/:orderId', protect, approvedVendor, requestReturnShipment);

// Public: receive live tracking updates webhook
router.post('/webhook', receiveShiprocketWebhook);

module.exports = router;
