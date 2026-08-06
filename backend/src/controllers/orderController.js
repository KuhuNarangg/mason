const asyncHandler = require('express-async-handler');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');
const {
  sendOrderConfirmation, sendOrderShipped, sendOrderOutForDelivery, sendOrderDelivered,
  sendReturnRequest, sendReturnApproved, sendRefundProcessed,
  sendAdminNewOrder, sendAdminReturnRequest, sendAdminCancellationRequest,
} = require('../utils/emailService');

// Shared Razorpay instance
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper: trigger a Razorpay refund. Returns { success, refund } or { success: false, error }
const initiateRazorpayRefund = async (paymentId, amountRupees, reason = 'Refund') => {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amountRupees * 100), // convert to paise
      speed: 'normal',
      notes: { reason },
    });
    return { success: true, refund };
  } catch (err) {
    console.error('Razorpay refund error:', err?.error || err);
    return { success: false, error: err?.error?.description || err.message };
  }
};

// @POST /api/v1/orders
const createOrder = asyncHandler(async (req, res) => {
  const {
    items,
    shippingAddress,
    paymentMethod,
    customerNotes,
    couponCode,
    subtotal: bodySubtotal,
    discount: bodyDiscount,
    shippingCharge: bodyShippingCharge,
    totalAmount: bodyTotalAmount,
  } = req.body;

  if (!items || items.length === 0) { res.status(400); throw new Error('No items in order'); }

  // ── Step 1: Fetch all referenced products from the database ──
  const productIds = items.map(i => (typeof i.product === 'object' && i.product?._id ? i.product._id.toString() : String(i.product)));
  const productDocs = await Product.find({ _id: { $in: productIds } })
    .populate('vendor', 'vendorProfile')
    .lean();
  const productMap = new Map(productDocs.map(p => [p._id.toString(), p]));

  // ── Step 2: Validate items and build order items with DB prices ──
  let calculatedSubtotal = 0;
  const itemsWithVendor = [];

  for (const item of items) {
    const prodId = typeof item.product === 'object' && item.product?._id ? item.product._id.toString() : String(item.product);
    const product = productMap.get(prodId);
    if (!product) {
      res.status(400);
      throw new Error(`Product ${prodId} not found`);
    }

    // Validate the variant exists and has stock
    const variant = product.variants?.find(
      v => v.size === item.variantSize && v.color === item.variantColor
    );
    if (!variant) {
      res.status(400);
      throw new Error(`Variant (${item.variantSize}/${item.variantColor}) not found for "${product.name}"`);
    }
    const qty = Number(item.quantity) || 1;
    if (variant.stock < qty) {
      res.status(400);
      throw new Error(`Insufficient stock for "${product.name}" (${item.variantSize}/${item.variantColor}). Available: ${variant.stock}`);
    }

    // Determine authoritative price from database — fallback to originalPrice & discount if price is missing/null/NaN
    let dbPrice = 0;
    if (typeof product.price === 'number' && !isNaN(product.price) && product.price > 0) {
      dbPrice = product.price;
    } else if (typeof product.originalPrice === 'number' && !isNaN(product.originalPrice) && product.originalPrice > 0) {
      const disc = (typeof product.discount === 'number' && !isNaN(product.discount)) ? product.discount : 0;
      dbPrice = Math.round(product.originalPrice * (1 - disc / 100));
    } else if (item.price && !isNaN(Number(item.price)) && Number(item.price) > 0) {
      dbPrice = Number(item.price);
    }
    dbPrice = (isNaN(dbPrice) || dbPrice < 0) ? 0 : Math.round(dbPrice);

    const lineTotal = dbPrice * qty;
    if (!isNaN(lineTotal)) {
      calculatedSubtotal += lineTotal;
    }

    const vendor = product.vendor || null;
    const commissionPercent = (vendor?.vendorProfile?.commissionPercent && !isNaN(Number(vendor.vendorProfile.commissionPercent)))
      ? Number(vendor.vendorProfile.commissionPercent)
      : 10;
    const commissionAmount = vendor ? Math.round((lineTotal * commissionPercent) / 100) : 0;
    const vendorEarning = vendor ? Math.max(0, lineTotal - (isNaN(commissionAmount) ? 0 : commissionAmount)) : 0;

    itemsWithVendor.push({
      product: product._id,
      name: product.name || 'Product',
      thumbnail: product.thumbnail || product.images?.[0] || '',
      variantSize: item.variantSize || 'Standard',
      variantColor: item.variantColor || 'Standard',
      quantity: qty,
      price: dbPrice,
      cgstPercent: Number(product.taxConfig?.cgstPercent ?? 6) || 6,
      sgstPercent: Number(product.taxConfig?.sgstPercent ?? 6) || 6,
      vendor: vendor?._id || null,
      commissionPercent: isNaN(commissionPercent) ? 10 : commissionPercent,
      commissionAmount: isNaN(commissionAmount) ? 0 : commissionAmount,
      vendorEarning: isNaN(vendorEarning) ? 0 : vendorEarning,
      itemStatus: 'pending',
      itemStatusHistory: [{ status: 'pending', note: 'Order placed' }],
    });
  }

  // ── Step 3: Subtotal & Shipping charge — guaranteed non-null numbers ──
  let subtotal = Math.round(Number(calculatedSubtotal));
  if (isNaN(subtotal) || subtotal < 0) {
    if (typeof bodySubtotal === 'number' && !isNaN(bodySubtotal) && bodySubtotal >= 0) {
      subtotal = Math.round(bodySubtotal);
    } else {
      subtotal = 0;
    }
  }

  let shippingCharge = subtotal > 1000 ? 0 : (subtotal > 0 ? 99 : 0);
  if (typeof bodyShippingCharge === 'number' && !isNaN(bodyShippingCharge) && bodyShippingCharge >= 0) {
    shippingCharge = Math.round(bodyShippingCharge);
  }

  // ── Step 4: Apply coupon discount server-side (if provided) ──
  let discount = 0;
  if (couponCode) {
    const Coupon = require('../models/Coupon');
    const coupon = await Coupon.findOne({ code: String(couponCode).toUpperCase(), isActive: true });
    if (coupon && new Date() <= new Date(coupon.expiryDate) && subtotal >= (coupon.minOrderAmount || 0)) {
      if (coupon.discountType === 'percentage') {
        discount = Math.round((subtotal * (coupon.discountValue || 0)) / 100);
      } else {
        discount = Number(coupon.discountValue) || 0;
      }
    }
  }
  if (isNaN(discount) || discount < 0) {
    if (typeof bodyDiscount === 'number' && !isNaN(bodyDiscount) && bodyDiscount >= 0) {
      discount = Math.round(bodyDiscount);
    } else {
      discount = 0;
    }
  }
  discount = Math.min(discount, subtotal);

  // ── Step 5: Final total — single source of truth ──
  const calcTotal = subtotal - discount + shippingCharge;
  let totalAmount = Math.round(Number(calcTotal));
  if (isNaN(totalAmount) || totalAmount < 0) {
    if (typeof bodyTotalAmount === 'number' && !isNaN(bodyTotalAmount) && bodyTotalAmount >= 0) {
      totalAmount = Math.round(bodyTotalAmount);
    } else {
      totalAmount = 0;
    }
  }

  const order = await Order.create({
    user: req.user._id,
    items: itemsWithVendor,
    shippingAddress,
    paymentMethod,
    paymentStatus: 'pending',
    subtotal,
    discount,
    shippingCharge,
    totalAmount,
    customerNotes,
    statusHistory: [{ status: 'pending', note: 'Order placed' }],
  });

  // Decrement stock for each ordered item
  await Promise.all(
    itemsWithVendor.map(async (item) => {
      await Product.updateOne(
        {
          _id: item.product,
          variants: { $elemMatch: { size: item.variantSize, color: item.variantColor } },
        },
        {
          $inc: { 'variants.$.stock': -item.quantity },
        }
      );
    })
  );

  // Clear cart after order
  await Cart.findOneAndDelete({ user: req.user._id });

  // Notify each vendor whose product(s) are part of this order
  const vendorIds = [...new Set(itemsWithVendor.filter((i) => i.vendor).map((i) => i.vendor.toString()))];
  await Promise.all(
    vendorIds.map((vId) =>
      createNotification({
        user: vId,
        title: 'New Order Received',
        message: `You have received a new order #${order.orderNumber}. Please confirm and prepare it for shipping.`,
        link: `/vendor/orders/${order._id}`,
      })
    )
  );

  // Send customer confirmation + admin new-order alert for every order
  const populatedUser = await User.findById(req.user._id);
  if (populatedUser) {
    sendOrderConfirmation({
      name: populatedUser.name,
      email: populatedUser.email,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
      items: itemsWithVendor,
    }).catch(() => {});

    sendAdminNewOrder({
      orderNumber: order.orderNumber,
      customerName: populatedUser.name,
      customerEmail: populatedUser.email,
      totalAmount: order.totalAmount,
      paymentMethod,
      items: itemsWithVendor,
    }).catch(() => {});
  }

  res.status(201).json({ success: true, order });
});

// @GET /api/v1/orders/my
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ success: true, orders });
});

// @GET /api/v1/orders/:id
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
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
  const [total, orders] = await Promise.all([
    Order.countDocuments(query),
    Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()
  ]);
  res.json({ success: true, total, orders });
});

// Valid forward-only status transitions for admin general status update
const ALLOWED_TRANSITIONS = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['delivered'],
  // Terminal / managed-by-dedicated-endpoints — no free changes allowed:
  delivered:        [],
  cancelled:        [],
  cancel_requested: [],   // managed by /cancel-handle
  return_requested: [],   // managed by /return-item-handle
  returned:         [],
  return_rejected:  [],
};

// @PUT /api/v1/orders/:id/status (admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const allowed = ALLOWED_TRANSITIONS[order.status] || [];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(
      `Cannot transition order from "${order.status}" to "${status}". ` +
      (allowed.length
        ? `Allowed next statuses: ${allowed.join(', ')}.`
        : `Order is in a terminal or managed state and cannot be changed here.`)
    );
  }

  order.status = status;
  order.statusHistory.push({ status, note });
  if (status === 'delivered') order.paymentStatus = 'paid';
  
  if (status === 'cancelled') {
    await Promise.all(
      order.items.map(async (item) => {
        await Product.updateOne(
          { _id: item.product, variants: { $elemMatch: { size: item.variantSize, color: item.variantColor } } },
          { $inc: { 'variants.$.stock': item.quantity } }
        );
      })
    );
  }

  await order.save();

  // Send Notification
  await createNotification({
    user: order.user,
    title: `Order Status Updated: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your order #${order.orderNumber} is now ${status}. ${note || ''}`,
    link: `/orders/${order._id}`
  });

  // Send Email
  const populatedUser = await User.findById(order.user);
  if (populatedUser) {
    if (status === 'shipped') {
      await sendOrderShipped({ name: populatedUser.name, email: populatedUser.email, orderNumber: order.orderNumber, trackingUrl: order.trackingUrl });
    } else if (status === 'out_for_delivery') {
      await sendOrderOutForDelivery({ name: populatedUser.name, email: populatedUser.email, orderNumber: order.orderNumber });
    } else if (status === 'delivered') {
      await sendOrderDelivered({ name: populatedUser.name, email: populatedUser.email, orderNumber: order.orderNumber });
    }
  }

  res.json({ success: true, order });
});

// @PUT /api/v1/orders/:id/tracking (admin/vendor)
const updateTrackingUrl = asyncHandler(async (req, res) => {
  const { trackingUrl } = req.body;

  if (trackingUrl && !/^(https?:\/\/)/i.test(trackingUrl)) {
    res.status(400); throw new Error('Invalid tracking URL. Must start with http:// or https://');
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.trackingUrl = trackingUrl;
  
  // If order is not shipped yet, auto-ship it
  if (trackingUrl && ['pending', 'processing', 'confirmed'].includes(order.status)) {
    order.status = 'shipped';
    order.statusHistory.push({ status: 'shipped', note: 'Tracking link uploaded' });
    
    if (order.user) {
      await sendOrderShipped({ name: order.user.name, email: order.user.email, orderNumber: order.orderNumber, trackingUrl });
    }
    
    await createNotification({
      user: order.user._id,
      title: 'Order Shipped',
      message: `Your order #${order.orderNumber} has been shipped. Track it now!`,
      link: `/orders/${order._id}`
    });
  }

  await order.save();
  res.json({ success: true, order });
});

// @PUT /api/v1/orders/:id/admin-notes (admin/vendor)
const updateAdminNotes = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  
  order.adminNotes = adminNotes;
  await order.save();
  res.json({ success: true, order });
});

// @GET /api/v1/orders/stats (admin)
const getOrderStats = asyncHandler(async (req, res) => {
  const [totalOrders, revenueResult, statusCounts, last7Days] = await Promise.all([
    Order.countDocuments(),
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } },
    ])
  ]);

  res.json({
    success: true,
    totalOrders,
    totalRevenue: revenueResult[0]?.total || 0,
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
  const order = await Order.findOne({ orderNumber: cleanOrderId }).populate('user', 'email name').lean();
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

  // Send Notification
  await createNotification({
    user: req.user._id,
    title: 'Return Requested',
    message: `Return request submitted for item in order #${order.orderNumber}.`,
    link: `/orders/${order._id}`
  });

  // Send Emails — customer acknowledgement + admin alert
  sendReturnRequest({ name: req.user.name, email: req.user.email, orderNumber: order.orderNumber, itemName: item.name }).catch(() => {});
  sendAdminReturnRequest({ orderNumber: order.orderNumber, customerName: req.user.name, customerEmail: req.user.email, itemName: item.name, reason: reason || 'No reason provided' }).catch(() => {});

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
    item.returnStatus   = 'approved';
    item.returnAdminNote = adminNote || 'Return approved';

    // Restore stock for returned item
    await Product.updateOne(
      { _id: item.product, variants: { $elemMatch: { size: item.variantSize, color: item.variantColor } } },
      { $inc: { 'variants.$.stock': item.quantity } }
    );

    // ── Trigger partial Razorpay refund for this item ─────────
    const itemRefundAmount = item.price * item.quantity;
    if (order.paymentStatus === 'paid' && order.paymentId) {
      const { success, refund, error } = await initiateRazorpayRefund(
        order.paymentId,
        itemRefundAmount,
        `Return approved for "${item.name}" in order #${order.orderNumber}`
      );
      if (success) {
        item.refundId     = refund.id;
        item.refundAmount = itemRefundAmount;
        order.statusHistory.push({
          status: 'returned',
          note: `Return approved for "${item.name}". Refund of ₹${itemRefundAmount} initiated. Razorpay Refund ID: ${refund.id}. ${adminNote || ''}`,
        });
      } else {
        item.refundAmount = itemRefundAmount; // record intended amount even if failed
        order.statusHistory.push({
          status: 'returned',
          note: `Return approved for "${item.name}". Refund of ₹${itemRefundAmount} could not be auto-processed (${error}). Admin will process manually. ${adminNote || ''}`,
        });
      }
    } else {
      order.statusHistory.push({
        status: 'returned',
        note: `Return approved for "${item.name}". ${adminNote || ''}`,
      });
    }
    // ─────────────────────────────────────────────────────────

  } else {
    item.returnStatus   = 'rejected';
    item.returnAdminNote = adminNote || 'Return rejected';
    order.statusHistory.push({
      status: 'return_rejected',
      note: `Return rejected for "${item.name}". ${adminNote || ''}`
    });
  }

  // Auto-update order-level status based on all items' return states
  const allItems = order.items;
  const hasRequested = allItems.some(i => i.returnStatus === 'requested');
  const allProcessed = allItems.every(i => ['none','approved','rejected'].includes(i.returnStatus));

  if (!hasRequested && allProcessed) {
    const hasApproved = allItems.some(i => i.returnStatus === 'approved');
    const allRejected = allItems.filter(i => i.returnStatus !== 'none').every(i => i.returnStatus === 'rejected');
    if (allRejected)   order.status = 'return_rejected';
    else if (hasApproved) order.status = 'returned';
  }

  await order.save();

  // Send Notification
  await createNotification({
    user: order.user,
    title: `Return ${action === 'approve' ? 'Approved' : 'Rejected'}`,
    message: action === 'approve' 
      ? `Return approved for ${item.name}. Refund initiated: ₹${item.refundAmount}` 
      : `Return rejected for ${item.name}. ${adminNote || ''}`,
    link: `/orders/${order._id}`
  });

  // Send Email
  const populatedUser = await User.findById(order.user);
  if (populatedUser && action === 'approve') {
    await sendReturnApproved({ name: populatedUser.name, email: populatedUser.email, orderNumber: order.orderNumber, itemName: item.name, refundAmount: item.refundAmount });
    await sendRefundProcessed({ name: populatedUser.name, email: populatedUser.email, orderNumber: order.orderNumber, amount: item.refundAmount });
  }

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

  // Notify admin about the cancellation request
  const cancelUser = await User.findById(req.user._id).select('name email');
  if (cancelUser) {
    sendAdminCancellationRequest({ orderNumber: order.orderNumber, customerName: cancelUser.name, customerEmail: cancelUser.email, reason }).catch(() => {});
  }

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

    // Restore stock for all items
    await Promise.all(
      order.items.map(async (item) => {
        await Product.updateOne(
          { _id: item.product, variants: { $elemMatch: { size: item.variantSize, color: item.variantColor } } },
          { $inc: { 'variants.$.stock': item.quantity } }
        );
      })
    );

    // ── Trigger real Razorpay refund ──────────────────────────
    if (order.paymentStatus === 'paid' && order.paymentId) {
      const { success, refund, error } = await initiateRazorpayRefund(
        order.paymentId,
        order.totalAmount,
        `Order #${order.orderNumber} cancelled — ${order.cancellationRequest?.reason || 'Customer request'}`
      );
      if (success) {
        order.paymentStatus = 'refunded';
        order.refundId     = refund.id;
        order.refundAmount = order.totalAmount;
        order.refundStatus = 'initiated';
        order.statusHistory.push({
          status: 'cancelled',
          note: `Refund of ₹${order.totalAmount} initiated. Razorpay Refund ID: ${refund.id}. Expected within 5–7 business days.`,
        });
      } else {
        // Don't block the cancellation; flag for manual follow-up
        order.paymentStatus = 'refunded';
        order.refundStatus = 'failed';
        order.statusHistory.push({
          status: 'cancelled',
          note: `Refund could not be auto-processed (${error}). Admin will process manually.`,
        });
      }
    }
    // ─────────────────────────────────────────────────────────

  } else {
    // Revert to confirmed
    order.status = 'confirmed';
    order.statusHistory.push({ status: 'confirmed', note: `Cancellation request rejected by admin. ${adminNote || ''}` });
  }

  order.cancellationRequest.adminNote = adminNote;
  await order.save();

  // Send Notification
  const isApproved = action === 'approve';
  await createNotification({
    user: order.user,
    title: `Cancellation ${isApproved ? 'Approved — Refund Initiated' : 'Request Rejected'}`,
    message: isApproved
      ? `Your order #${order.orderNumber} has been cancelled. A refund of ₹${order.totalAmount} has been initiated and will reflect within 5–7 business days. ${adminNote || ''}`
      : `Your cancellation request for order #${order.orderNumber} was rejected. ${adminNote || ''}`,
    link: `/orders/${order._id}`,
  });

  res.json({ success: true, order });
});

module.exports = { 
  createOrder, 
  getMyOrders, 
  getOrderById, 
  getAllOrders, 
  updateOrderStatus, 
  updateTrackingUrl,
  updateAdminNotes,
  getOrderStats, 
  trackOrder, 
  returnOrder,
  handleItemReturn,
  requestOrderCancellation,
  handleCancellationRequest
};
