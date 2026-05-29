const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

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
    topProducts
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
    ])
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;

  res.json({ success: true, totalUsers, totalProducts, totalOrders, totalRevenue, returnRequestsCount, recentOrders, lowStockProducts, last30Days, topProducts });
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

module.exports = { getAllUsers, getUserDetail, deleteUser, getDashboardStats, getFailedPayments, manualConfirmOrder };

