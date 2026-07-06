const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

// @GET /api/v1/coupons (Admin only)
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// @POST /api/v1/coupons (Admin only)
const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, expiryDate } = req.body;
  
  const exists = await Coupon.findOne({ code: code.toUpperCase() });
  if (exists) {
    res.status(400);
    throw new Error('Coupon code already exists');
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    discountType,
    discountValue,
    minOrderAmount,
    expiryDate,
  });

  res.status(201).json({ success: true, coupon });
});

// @PUT /api/v1/coupons/:id (Admin only)
const updateCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, expiryDate, isActive } = req.body;

  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) { res.status(404); throw new Error('Coupon not found'); }

  // If code is changing, make sure it doesn't clash with another coupon
  if (code && code.toUpperCase() !== coupon.code) {
    const exists = await Coupon.findOne({ code: code.toUpperCase(), _id: { $ne: req.params.id } });
    if (exists) { res.status(400); throw new Error('Coupon code already in use'); }
    coupon.code = code.toUpperCase();
  }

  if (discountType   !== undefined) coupon.discountType   = discountType;
  if (discountValue  !== undefined) coupon.discountValue  = discountValue;
  if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
  if (expiryDate     !== undefined) coupon.expiryDate     = expiryDate;
  if (isActive       !== undefined) coupon.isActive       = isActive;

  await coupon.save();
  res.json({ success: true, coupon });
});

// @DELETE /api/v1/coupons/:id (Admin only)
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  res.json({ success: true, message: 'Coupon deleted' });
});

// @POST /api/v1/coupons/validate (Public/User)
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    res.status(404);
    throw new Error('Invalid or expired coupon code');
  }

  if (new Date() > new Date(coupon.expiryDate)) {
    coupon.isActive = false;
    await coupon.save();
    res.status(400);
    throw new Error('This coupon has expired');
  }

  if (cartTotal < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`This coupon requires a minimum order of ₹${coupon.minOrderAmount}`);
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((cartTotal * coupon.discountValue) / 100);
  } else {
    discountAmount = coupon.discountValue;
  }

  res.json({
    success: true,
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount
    }
  });
});

// @GET /api/v1/coupons/active (Public)
const getActiveCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true, expiryDate: { $gt: new Date() } }).sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

module.exports = {
  getCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getActiveCoupons
};
