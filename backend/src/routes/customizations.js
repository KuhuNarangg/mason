const express = require('express');
const router = express.Router();
const Customization = require('../models/Customization');
const { protect, adminOrVendor } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');

// @route   POST /api/v1/customizations
// @desc    Submit a new customization request
// @access  Private (User)
router.post('/', protect, asyncHandler(async (req, res) => {
  const { fabric, color, measurements, notes } = req.body;

  const customization = new Customization({
    user: req.user._id,
    fabric,
    color,
    measurements,
    notes
  });

  const createdRequest = await customization.save();
  res.status(201).json({ success: true, customization: createdRequest });
}));

// @route   GET /api/v1/customizations
// @desc    Get all customization requests
// @access  Private (Admin/Vendor)
router.get('/', protect, adminOrVendor, asyncHandler(async (req, res) => {
  const requests = await Customization.find({})
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });
    
  res.json({ success: true, customizations: requests });
}));

// @route   PUT /api/v1/customizations/:id/status
// @desc    Update customization status
// @access  Private (Admin/Vendor)
router.put('/:id/status', protect, adminOrVendor, asyncHandler(async (req, res) => {
  const { status, priceQuote, paymentStatus } = req.body;
  const request = await Customization.findById(req.params.id);

  if (request) {
    if (status !== undefined) request.status = status;
    if (priceQuote !== undefined) request.priceQuote = priceQuote;
    if (paymentStatus !== undefined) request.paymentStatus = paymentStatus;
    
    const updatedRequest = await request.save();
    res.json({ success: true, customization: updatedRequest });
  } else {
    res.status(404);
    throw new Error('Customization request not found');
  }
}));

module.exports = router;
