const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { createNotification } = require('../utils/notificationHelper');

// @POST /api/v1/orders
const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod, subtotal, discount, shippingCharge, totalAmount, paymentId } = req.body;

  if (!items || items.length === 0) { res.status(400); throw new Error('No items in order'); }

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    paymentStatus: paymentId ? 'paid' : 'pending',
    paymentId,
    subtotal,
    discount,
    shippingCharge,
    totalAmount,
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
  });

  // Clear cart after order
  await Cart.findOneAndDelete({ user: req.user._id });

  res.status(201).json({ success: true, order });
});

// @GET /api/v1/orders/my
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// @GET /api/v1/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  res.json({ success: true, order });
});

// ---- ADMIN ----

// @GET /api/v1/orders (admin)
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  res.json({ success: true, total, orders });
});

// @PUT /api/v1/orders/:id/status (admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.status = status;
  order.statusHistory.push({ status, note });
  if (status === 'delivered') order.paymentStatus = 'paid';
  await order.save();

  // Send Notification
  await createNotification({
    user: order.user,
    title: `Order Status Updated: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your order #${order.orderNumber} is now ${status}. ${note || ''}`,
    link: `/orders/${order._id}`
  });

  res.json({ success: true, order });
});

// @GET /api/v1/orders/stats (admin)
const getOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const statusCounts = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const last7Days = await Order.aggregate([
    { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    { $sort: { _id: 1 } },
  ]);
  res.json({
    success: true,
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0,
    statusCounts,
    last7Days,
  });
});

// @POST /api/v1/orders/track
const trackOrder = asyncHandler(async (req, res) => {
  const { orderId, email } = req.body;
  if (!orderId || !email) { res.status(400); throw new Error('Order ID and Email are required'); }
  
  // Clean the order ID (remove spaces, leading #, and force uppercase)
  const cleanOrderId = orderId.replace(/^#/, '').trim().toUpperCase();
  
  // Try to find the order by orderNumber and populate user
  const order = await Order.findOne({ orderNumber: cleanOrderId }).populate('user', 'email name');
  if (!order) { res.status(404); throw new Error('Order not found with that ID'); }

  // Verify email matches
  if (order.user.email.toLowerCase() !== email.toLowerCase()) {
    res.status(403); throw new Error('Email does not match our records for this order');
  }

  res.json({ success: true, order });
});

// @PUT /api/v1/orders/:id/return — Item-level partial return
const returnOrder = asyncHandler(async (req, res) => {
  const { itemId, reason } = req.body;
  const order = await Order.findById(req.params.id).populate('items.product', 'isReturnable returnWindow name');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  
  // Verify order belongs to user
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized to return this order');
  }

  // Only delivered orders can have returns
  if (order.status !== 'delivered' && order.status !== 'return_requested') {
    res.status(400); throw new Error('Only delivered orders can have items returned');
  }

  // Find the specific item
  const item = order.items.id(itemId);
  if (!item) { res.status(404); throw new Error('Item not found in this order'); }

  // Check if already requested
  if (item.returnStatus && item.returnStatus !== 'none') {
    res.status(400); throw new Error(`This item already has return status: ${item.returnStatus}`);
  }

  // Check if product is returnable
  if (item.product && item.product.isReturnable === false) {
    res.status(400); throw new Error(`"${item.product.name || item.name}" is non-returnable`);
  }

  // Check return window
  const deliveredEntry = order.statusHistory.find(h => h.status === 'delivered');
  if (deliveredEntry) {
    const returnWindow = item.product?.returnWindow ?? 14;
    const deliveredDate = new Date(deliveredEntry.timestamp);
    const deadlineDate = new Date(deliveredDate.getTime() + returnWindow * 24 * 60 * 60 * 1000);
    if (new Date() > deadlineDate) {
      res.status(400); throw new Error(`Return window of ${returnWindow} days has expired for "${item.name}"`);
    }
  }

  // Mark this item for return
  item.returnStatus = 'requested';
  item.returnReason = reason || 'No reason provided';
  item.returnRequestedAt = new Date();

  // Update order-level status if any item has a return request
  if (order.status === 'delivered') {
    order.status = 'return_requested';
    order.statusHistory.push({ 
      status: 'return_requested', 
      note: `Return requested for "${item.name}" — ${reason || 'No reason provided'}` 
    });
  } else {
    // Already in return_requested, just add a history entry
    order.statusHistory.push({ 
      status: 'return_requested', 
      note: `Additional return requested for "${item.name}" — ${reason || 'No reason provided'}` 
    });
  }

  await order.save();
  res.json({ success: true, order });
});

// @PUT /api/v1/orders/:id/return-item-handle (admin) — Approve/reject a specific item return
const handleItemReturn = asyncHandler(async (req, res) => {
  const { itemId, action, adminNote } = req.body; // action: 'approve' or 'reject'
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const item = order.items.id(itemId);
  if (!item) { res.status(404); throw new Error('Item not found in this order'); }

  if (item.returnStatus !== 'requested') {
    res.status(400); throw new Error('This item does not have a pending return request');
  }

  if (action === 'approve') {
    item.returnStatus = 'approved';
    item.returnAdminNote = adminNote || 'Return approved';
    order.statusHistory.push({ 
      status: 'returned', 
      note: `Return approved for "${item.name}". ${adminNote || ''}` 
    });
  } else {
    item.returnStatus = 'rejected';
    item.returnAdminNote = adminNote || 'Return rejected';
    order.statusHistory.push({ 
      status: 'return_rejected', 
      note: `Return rejected for "${item.name}". ${adminNote || ''}` 
    });
  }

  // Auto-update order status based on all items' return states
  const allItems = order.items;
  const hasRequested = allItems.some(i => i.returnStatus === 'requested');
  const allProcessed = allItems.every(i => i.returnStatus === 'none' || i.returnStatus === 'approved' || i.returnStatus === 'rejected');
  
  if (!hasRequested && allProcessed) {
    const hasApproved = allItems.some(i => i.returnStatus === 'approved');
    const allRejected = allItems.filter(i => i.returnStatus !== 'none').every(i => i.returnStatus === 'rejected');
    
    if (allRejected) {
      order.status = 'return_rejected';
    } else if (hasApproved) {
      order.status = 'returned';
    }
  }

  await order.save();

  // Send Notification
  await createNotification({
    user: order.user,
    title: `Return ${action === 'approve' ? 'Approved' : 'Rejected'}: ${item.name}`,
    message: `Your return request for "${item.name}" in order #${order.orderNumber} has been ${action}d. ${adminNote || ''}`,
    link: `/orders/${order._id}`
  });

  res.json({ success: true, order });
});

// @PUT /api/v1/orders/:id/cancel
const requestOrderCancellation = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized to cancel this order');
  }

  // Only pending or confirmed orders can be cancelled
  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    res.status(400); throw new Error('Orders that are shipped or delivered cannot be cancelled');
  }

  order.status = 'cancel_requested';
  order.cancellationRequest = {
    isRequested: true,
    reason,
    requestedAt: new Date()
  };
  order.statusHistory.push({ 
    status: 'cancel_requested', 
    note: `Cancellation requested by customer. Reason: ${reason}` 
  });
  
  await order.save();
  res.json({ success: true, order });
});

// @PUT /api/v1/orders/:id/cancel-handle (admin)
const handleCancellationRequest = asyncHandler(async (req, res) => {
  const { action, adminNote } = req.body; // action: 'approve' or 'reject'
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (order.status !== 'cancel_requested') {
    res.status(400); throw new Error('No cancellation request found for this order');
  }

  if (action === 'approve') {
    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: `Cancellation approved by admin. ${adminNote || ''}` });
    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }
  } else {
    // Revert to processing or confirmed
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: `Cancellation request rejected by admin. ${adminNote || ''}` });
  }

  order.cancellationRequest.adminNote = adminNote;
  await order.save();

  // Send Notification
  await createNotification({
    user: order.user,
    title: `Cancellation Request ${action === 'approve' ? 'Approved' : 'Rejected'}`,
    message: `Your cancellation request for order #${order.orderNumber} has been ${action}ed. ${adminNote || ''}`,
    link: `/orders/${order._id}`
  });

  res.json({ success: true, order });
});

module.exports = { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  getAllOrders, 
  updateOrderStatus, 
  getOrderStats, 
  trackOrder, 
  returnOrder,
  handleItemReturn,
  requestOrderCancellation,
  handleCancellationRequest
};
