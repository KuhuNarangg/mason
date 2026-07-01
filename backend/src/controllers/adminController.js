const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { createNotification } = require('../utils/notificationHelper');
const { sendVendorApproved, sendVendorRejected } = require('../utils/emailService');
const Settlement = require('../models/Settlement');
const Settings = require('../models/Settings');

// @GET /api/v1/admin/users
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 }).lean();
  res.json({ success: true, users });
});

// @DELETE /api/v1/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted' });
});

// @GET /api/v1/admin/dashboard
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProducts,
    totalOrders,
    revenueResult,
    returnRequestsCount,
    recentOrders,
    lowStockProducts,
    last30Days,
    topProducts,
    totalVendors,
    pendingVendorApprovals,
    pendingOrders,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ status: 'return_requested' }),
    Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Product.find({
      'variants.stock': { $lte: 5 },
      isActive: true,
    }).limit(5).select('name thumbnail variants').lean(),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, thumbnail: { $first: '$items.thumbnail' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]),
    User.countDocuments({ role: 'vendor', vendorStatus: 'approved' }),
    User.countDocuments({ role: 'vendor', vendorStatus: 'pending' }),
    Order.countDocuments({ status: 'pending' }),
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;

  res.json({
    success: true,
    totalUsers,
    totalProducts,
    totalOrders,
    totalRevenue,
    returnRequestsCount,
    recentOrders,
    lowStockProducts,
    last30Days,
    topProducts,
    totalVendors,
    pendingVendorApprovals,
    pendingOrders,
  });
});

// @GET /api/v1/admin/users/:id
const getUserDetail = asyncHandler(async (req, res) => {
  const [user, orders] = await Promise.all([
    User.findById(req.params.id).select('-password').lean(),
    Order.find({ user: req.params.id }).sort({ createdAt: -1 }).lean()
  ]);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let totalOrders = orders.length;
  let totalSpent = 0;
  let returnRequests = 0;

  orders.forEach(order => {
    if (order.paymentStatus === 'paid' || order.status === 'delivered') {
      totalSpent += order.totalAmount;
    }
    if (order.status === 'return_requested') {
      returnRequests++;
    } else {
      // Also count item-level return requests
      const itemRequests = order.items.filter(item => item.returnStatus === 'requested').length;
      if (itemRequests > 0) returnRequests++;
    }
  });

  res.json({
    success: true,
    user,
    stats: {
      totalOrders,
      totalSpent,
      returnRequests,
    },
    orders,
  });
});


// ── @GET /api/v1/admin/failed-payments ─────────────────────────────────────
const getFailedPayments = asyncHandler(async (req, res) => {
  const orders = await Order.find({ paymentStatus: 'failed' })
    .populate('user', 'name email')
    .sort({ updatedAt: -1 })
    .lean();
  res.json({ success: true, orders });
});

// ── @POST /api/v1/admin/orders/:id/manual-confirm ──────────────────────────
const manualConfirmOrder = asyncHandler(async (req, res) => {
  const { note, paymentId } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.paymentStatus = 'paid';
  order.status        = 'confirmed';
  if (paymentId) order.paymentId = paymentId;
  order.statusHistory.push({
    status: 'confirmed',
    note: note || `Manually confirmed by admin. ${paymentId ? `Payment ID: ${paymentId}` : ''}`,
  });
  await order.save();

  res.json({ success: true, order });
});

/* ───────────────────────── VENDOR MANAGEMENT ───────────────────────── */

// @POST /api/v1/admin/vendors
const createVendor = asyncHandler(async (req, res) => {
  const { name, email, password, accessCode, businessName, gstNumber, panNumber, phone, commissionPercent } = req.body;

  if (!name || !email || !password || !accessCode || !businessName) {
    res.status(400);
    throw new Error('Name, email, password, access code, and business name are required');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  if (String(accessCode).length < 4) {
    res.status(400);
    throw new Error('Access code must be at least 4 characters');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const vendor = await User.create({
    name,
    email,
    password,
    phone: phone || '',
    role: 'vendor',
    vendorStatus: 'approved',
    vendorProfile: {
      businessName,
      gstNumber: gstNumber || '',
      panNumber: panNumber || '',
      commissionPercent: commissionPercent !== undefined ? Number(commissionPercent) : 10,
      approvedAt: new Date(),
    },
  });

  // Hash and store access code separately to avoid double-hashing by pre-save hook
  const hashedCode = await bcrypt.hash(String(accessCode), 12);
  await User.updateOne({ _id: vendor._id }, { accessCode: hashedCode });

  res.status(201).json({
    success: true,
    message: 'Vendor created successfully.',
    vendor: {
      _id: vendor._id,
      name: vendor.name,
      email: vendor.email,
      role: vendor.role,
      vendorStatus: vendor.vendorStatus,
      vendorProfile: vendor.vendorProfile,
    },
  });
});

// @GET /api/v1/admin/vendors
const getVendors = asyncHandler(async (req, res) => {
  const { status } = req.query; // pending | approved | rejected | suspended
  const query = { role: 'vendor' };
  if (status) query.vendorStatus = status;

  const vendors = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();
  res.json({ success: true, vendors });
});

// @GET /api/v1/admin/vendors/:id
const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' }).select('-password').lean();
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }

  const [productCount, orderStats] = await Promise.all([
    Product.countDocuments({ vendor: vendor._id }),
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { 'items.vendor': vendor._id } },
      { $group: { _id: null, totalItems: { $sum: 1 }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, earning: { $sum: '$items.vendorEarning' }, commission: { $sum: '$items.commissionAmount' } } },
    ]),
  ]);

  res.json({ success: true, vendor, productCount, stats: orderStats[0] || { totalItems: 0, revenue: 0, earning: 0, commission: 0 } });
});

// @PUT /api/v1/admin/vendors/:id/approve
const approveVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }

  vendor.vendorStatus = 'approved';
  vendor.vendorProfile.approvedAt = new Date();
  vendor.vendorProfile.rejectionReason = '';

  // Generate a secure "set password" token (valid 48 hours)
  const rawToken = crypto.randomBytes(32).toString('hex');
  vendor.vendorSetupToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  vendor.vendorSetupExpires = Date.now() + 48 * 60 * 60 * 1000;

  await vendor.save();

  await createNotification({
    user: vendor._id,
    title: 'Vendor Account Approved',
    message: `Congratulations! Your vendor account "${vendor.vendorProfile.businessName}" has been approved. Check your email to set your password and log in.`,
    link: '/vendor/dashboard',
  });

  const setupUrl = `${(process.env.FRONTEND_URL?.split(',')[0] || 'http://localhost:5173')}/vendor-set-password/${rawToken}`;
  sendVendorApproved({
    name: vendor.name,
    email: vendor.email,
    businessName: vendor.vendorProfile.businessName,
    setupUrl,
  }).catch(() => {});

  res.json({ success: true, message: 'Vendor approved', vendor: { _id: vendor._id, vendorStatus: vendor.vendorStatus } });
});

// @PUT /api/v1/admin/vendors/:id/reject
const rejectVendor = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }

  vendor.vendorStatus = 'rejected';
  vendor.vendorProfile.rejectionReason = reason || 'Not specified';
  await vendor.save();

  await createNotification({
    user: vendor._id,
    title: 'Vendor Application Rejected',
    message: `Your vendor application was rejected. Reason: ${vendor.vendorProfile.rejectionReason}`,
    link: '/vendor/register',
  });

  sendVendorRejected({
    name: vendor.name,
    email: vendor.email,
    businessName: vendor.vendorProfile.businessName,
    reason: vendor.vendorProfile.rejectionReason,
  }).catch(() => {});

  res.json({ success: true, message: 'Vendor rejected', vendor: { _id: vendor._id, vendorStatus: vendor.vendorStatus } });
});

// @PUT /api/v1/admin/vendors/:id/suspend
const suspendVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }

  vendor.vendorStatus = 'suspended';
  await vendor.save();

  // Deactivate all of the vendor's products so they stop showing in the store
  await Product.updateMany({ vendor: vendor._id }, { isActive: false });

  await createNotification({
    user: vendor._id,
    title: 'Vendor Account Suspended',
    message: 'Your vendor account has been suspended by the admin. Contact support for details.',
    link: '/vendor/dashboard',
  });

  res.json({ success: true, message: 'Vendor suspended', vendor: { _id: vendor._id, vendorStatus: vendor.vendorStatus } });
});

// @PUT /api/v1/admin/vendors/:id/reinstate
const reinstateVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }

  vendor.vendorStatus = 'approved';
  await vendor.save();

  res.json({ success: true, message: 'Vendor reinstated', vendor: { _id: vendor._id, vendorStatus: vendor.vendorStatus } });
});

// @PUT /api/v1/admin/vendors/:id/commission
const setVendorCommission = asyncHandler(async (req, res) => {
  const { commissionPercent } = req.body;
  if (commissionPercent === undefined || commissionPercent < 0 || commissionPercent > 100) {
    res.status(400); throw new Error('commissionPercent must be between 0 and 100');
  }

  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }

  vendor.vendorProfile.commissionPercent = commissionPercent;
  await vendor.save();

  res.json({ success: true, message: 'Commission updated', commissionPercent });
});

// @DELETE /api/v1/admin/vendors/:id
const deleteVendor = asyncHandler(async (req, res) => {
  const vendor = await User.findOne({ _id: req.params.id, role: 'vendor' });
  if (!vendor) { res.status(404); throw new Error('Vendor not found'); }

  // Delete all products belonging to this vendor
  await Product.deleteMany({ vendor: vendor._id });

  // Delete all settlements belonging to this vendor
  await Settlement.deleteMany({ vendor: vendor._id });

  // Delete the vendor user record
  await User.findByIdAndDelete(vendor._id);

  res.json({ success: true, message: 'Vendor and their products deleted successfully' });
});

// @GET /api/v1/admin/settlements/overview — pending payout totals grouped per vendor
const getSettlementsOverview = asyncHandler(async (req, res) => {
  const pending = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.vendor': { $ne: null }, 'items.payoutStatus': 'pending', 'items.itemStatus': { $nin: ['cancelled'] } } },
    { $group: {
      _id: '$items.vendor',
      pendingAmount: { $sum: '$items.vendorEarning' },
      itemCount: { $sum: 1 },
    } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendorInfo' } },
    { $unwind: '$vendorInfo' },
    { $project: {
      pendingAmount: 1, itemCount: 1,
      name: '$vendorInfo.vendorProfile.businessName',
      fallbackName: '$vendorInfo.name',
      email: '$vendorInfo.email',
    } },
    { $sort: { pendingAmount: -1 } },
  ]);

  res.json({
    success: true,
    vendors: pending.map(v => ({ ...v, name: v.name || v.fallbackName || 'Unknown Vendor' })),
  });
});

// @GET /api/v1/admin/settlements/vendor/:id — pending items + settlement history for a vendor
const getVendorSettlementDetail = asyncHandler(async (req, res) => {
  const vendorId = req.params.id;

  const orders = await Order.find({ 'items.vendor': vendorId, 'items.payoutStatus': 'pending' })
    .select('orderNumber items createdAt')
    .lean();

  const pendingItems = [];
  for (const order of orders) {
    for (const item of order.items) {
      if (String(item.vendor) === String(vendorId) && item.payoutStatus === 'pending' && item.itemStatus !== 'cancelled') {
        pendingItems.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          itemId: item._id,
          name: item.name,
          quantity: item.quantity,
          vendorEarning: item.vendorEarning,
          itemStatus: item.itemStatus,
          createdAt: order.createdAt,
        });
      }
    }
  }

  const history = await Settlement.find({ vendor: vendorId }).sort({ createdAt: -1 }).lean();

  res.json({ success: true, pendingItems, history });
});

// @POST /api/v1/admin/settlements/vendor/:id/settle — mark selected items as paid, create settlement record
const settleVendorPayout = asyncHandler(async (req, res) => {
  const vendorId = req.params.id;
  const { items, method, reference, note } = req.body; // items: [{ orderId, itemId }]

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400); throw new Error('No items provided to settle');
  }

  const settlementOrders = [];
  let totalAmount = 0;

  for (const { orderId, itemId } of items) {
    const order = await Order.findById(orderId);
    if (!order) continue;
    const item = order.items.id(itemId);
    if (!item || String(item.vendor) !== String(vendorId) || item.payoutStatus !== 'pending') continue;

    item.payoutStatus = 'paid';
    await order.save();

    settlementOrders.push({ order: order._id, itemId: item._id, amount: item.vendorEarning });
    totalAmount += item.vendorEarning || 0;
  }

  if (settlementOrders.length === 0) {
    res.status(400); throw new Error('None of the provided items could be settled');
  }

  const settlement = await Settlement.create({
    vendor: vendorId,
    amount: totalAmount,
    itemCount: settlementOrders.length,
    orders: settlementOrders,
    method: method || 'manual',
    reference: reference || '',
    note: note || '',
    settledBy: req.user._id,
  });

  res.status(201).json({ success: true, settlement });
});

// @GET /api/v1/admin/settings
const getSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findById('platform');
  if (!settings) settings = await Settings.create({ _id: 'platform' });
  res.json({ success: true, settings });
});

// @PUT /api/v1/admin/settings
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findById('platform');
  if (!settings) settings = new Settings({ _id: 'platform' });

  const allowed = [
    'siteName', 'supportEmail', 'supportPhone', 'defaultCommissionPercent',
    'shippingCharge', 'freeShippingThreshold', 'taxConfig', 'returnWindowDays',
    'maintenanceMode', 'maintenanceMessage', 'vendorAutoApprove',
  ];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) settings[key] = req.body[key];
  });

  await settings.save();
  res.json({ success: true, settings });
});

// @GET /api/v1/admin/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const days = Math.min(Number(req.query.days) || 30, 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [
    revenueTrend,
    orderStatusBreakdown,
    categoryBreakdown,
    vendorPerformance,
    paymentMethodBreakdown,
    totals,
  ] = await Promise.all([
    // Revenue & orders per day
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
        orders: { $sum: 1 },
      } },
      { $sort: { _id: 1 } },
    ]),

    // Orders by status
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    // Revenue by category
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productInfo' } },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: { $ifNull: ['$productInfo.type', 'Uncategorized'] },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        unitsSold: { $sum: '$items.quantity' },
      } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),

    // Vendor performance (revenue, commission, orders)
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: '$items' },
      { $match: { 'items.vendor': { $ne: null } } },
      { $group: {
        _id: '$items.vendor',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        commission: { $sum: '$items.commissionAmount' },
        vendorEarning: { $sum: '$items.vendorEarning' },
        unitsSold: { $sum: '$items.quantity' },
      } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendorInfo' } },
      { $unwind: { path: '$vendorInfo', preserveNullAndEmptyArrays: true } },
      { $project: {
        revenue: 1, commission: 1, vendorEarning: 1, unitsSold: 1,
        name: '$vendorInfo.vendorProfile.businessName',
        fallbackName: '$vendorInfo.name',
      } },
    ]),

    // Payment method breakdown
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]),

    // Overall totals for the period
    Order.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
        avgOrderValue: { $avg: '$totalAmount' },
      } },
    ]),
  ]);

  res.json({
    success: true,
    days,
    revenueTrend,
    orderStatusBreakdown,
    categoryBreakdown,
    vendorPerformance: vendorPerformance.map(v => ({ ...v, name: v.name || v.fallbackName || 'Unknown Vendor' })),
    paymentMethodBreakdown,
    totals: totals[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 },
  });
});

// @GET /api/v1/admin/returns
const getReturns = asyncHandler(async (req, res) => {
  const { status } = req.query; // optional: requested|approved|rejected|completed
  const statuses = status ? [status] : ['requested', 'approved', 'rejected', 'completed'];

  const orders = await Order.find({ 'items.returnStatus': { $in: statuses } })
    .populate('user', 'name email')
    .sort({ updatedAt: -1 })
    .lean();

  const returns = [];
  for (const order of orders) {
    order.items.forEach((item, idx) => {
      if (statuses.includes(item.returnStatus)) {
        returns.push({
          orderId: order._id,
          orderNumber: order.orderNumber,
          itemId: item._id,
          itemIndex: idx,
          customer: order.user,
          product: { _id: item.product, name: item.name, thumbnail: item.thumbnail },
          variantSize: item.variantSize,
          variantColor: item.variantColor,
          quantity: item.quantity,
          price: item.price,
          returnStatus: item.returnStatus,
          returnReason: item.returnReason,
          returnRequestedAt: item.returnRequestedAt,
          returnAdminNote: item.returnAdminNote,
          refundAmount: item.refundAmount,
          createdAt: order.updatedAt,
        });
      }
    });
  }

  returns.sort((a, b) => new Date(b.returnRequestedAt || b.createdAt) - new Date(a.returnRequestedAt || a.createdAt));

  res.json({ success: true, returns });
});

// @GET /api/v1/admin/reviews
const getReviews = asyncHandler(async (req, res) => {
  const { rating } = req.query;
  const products = await Product.find(
    { 'reviews.0': { $exists: true } },
    { name: 1, slug: 1, thumbnail: 1, reviews: 1 }
  ).lean();

  let reviews = [];
  for (const product of products) {
    for (const review of product.reviews) {
      reviews.push({
        reviewId: review._id,
        productId: product._id,
        productName: product.name,
        productSlug: product.slug,
        productThumbnail: product.thumbnail,
        user: review.user,
        name: review.name,
        rating: review.rating,
        comment: review.comment,
        photos: review.photos,
        createdAt: review.createdAt,
        isApproved: review.isApproved,
      });
    }
  }

  if (rating) reviews = reviews.filter(r => Number(r.rating) === Number(rating));
  reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, reviews });
});

// @DELETE /api/v1/admin/reviews/:productId/:reviewId
const deleteReview = asyncHandler(async (req, res) => {
  const { productId, reviewId } = req.params;
  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const review = product.reviews.id(reviewId);
  if (!review) { res.status(404); throw new Error('Review not found'); }

  review.deleteOne();

  // Recalculate ratings based only on approved reviews
  product.calculateApprovedRating();
  await product.save();
  res.json({ success: true, message: 'Review deleted' });
});

// @PUT /api/v1/admin/reviews/:productId/:reviewId/approve
const approveReview = asyncHandler(async (req, res) => {
  const { productId, reviewId } = req.params;
  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const review = product.reviews.id(reviewId);
  if (!review) { res.status(404); throw new Error('Review not found'); }

  // Toggle approval status
  review.isApproved = !review.isApproved;
  
  // Recalculate rating
  product.calculateApprovedRating();
  await product.save();

  res.json({ 
    success: true, 
    message: `Review ${review.isApproved ? 'approved' : 'unapproved'} successfully`,
    isApproved: review.isApproved
  });
});

module.exports = {
  getAllUsers, getUserDetail, deleteUser, getDashboardStats, getFailedPayments, manualConfirmOrder,
  createVendor, getVendors, getVendorById, approveVendor, rejectVendor, suspendVendor, reinstateVendor, setVendorCommission, deleteVendor,
  getReturns, getReviews, deleteReview, approveReview, getAnalytics,
  getSettlementsOverview, getVendorSettlementDetail, settleVendorPayout,
  getSettings, updateSettings,
};
