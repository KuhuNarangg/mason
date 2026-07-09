const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const CustomDesignRequest = require('../models/CustomDesignRequest');
const Customization = require('../models/Customization');
const User = require('../models/User');
const Product = require('../models/Product');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Create a general bespoke design request (no specific vendor/product)
//          Used by the "Design Your Dream Outfit" customization page
// @route   POST /api/v1/customizations/general
// @access  Private (Customer)
const createGeneralRequest = asyncHandler(async (req, res) => {
  const {
    productType,
    designType,
    material,
    color,
    printType,
    quoteText,
    customDesignUrl,
    printPlacement,
    quantity,
    totalPrice,
    notes,
    shippingAddress,
    paymentMethod
  } = req.body;

  if (!productType || !material || !color || !printType || !totalPrice || !shippingAddress || !paymentMethod) {
    res.status(400);
    throw new Error('Required fields missing');
  }

  const customization = await Customization.create({
    user: req.user._id,
    productType,
    designType,
    material,
    color,
    printType,
    quoteText,
    customDesignUrl,
    printPlacement,
    quantity: quantity || 1,
    totalPrice,
    notes: notes || '',
    shippingAddress,
    paymentMethod,
    status: 'pending',
  });

  // Razorpay order creation for online payment
  let razorpayOrderData = null;
  if (paymentMethod === 'razorpay') {
    const razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const rzpOrder = await razorpayInstance.orders.create({
      amount: Math.round(totalPrice * 100), // in paise
      currency: 'INR',
      receipt: `CUST_${customization._id.toString().slice(-6).toUpperCase()}`,
      notes: {
        customizationId: customization._id.toString(),
      },
    });

    customization.razorpayOrderId = rzpOrder.id;
    await customization.save();

    razorpayOrderData = {
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      customizationId: customization._id,
    };
  }

  // Notify all admins
  const admins = await User.find({ role: 'admin' }).select('_id');
  await Promise.all(admins.map(admin => createNotification({
    user: admin._id,
    title: 'New Custom Design Order 👕',
    message: `${req.user.name} ordered a custom ${productType} (${color}).`,
    link: '/admin/customizations',
    type: 'custom_order'
  })));

  res.status(201).json({
    success: true,
    message: 'Your custom design order was submitted successfully',
    customization,
    razorpayOrder: razorpayOrderData
  });
});

// @desc    Get logged-in customer's general bespoke design requests
// @route   GET /api/v1/customizations/general/my-requests
// @access  Private (Customer)
const getMyGeneralRequests = asyncHandler(async (req, res) => {
  const requests = await Customization.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

// @desc    Admin: list all general bespoke design requests
// @route   GET /api/v1/customizations/general/admin
// @access  Private (Admin)
const getAllGeneralRequests = asyncHandler(async (req, res) => {
  const requests = await Customization.find({})
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, requests });
});

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_secret',
});

/* ── Customer Controllers ──────────────────────────────────────── */

// @desc    Create a new customization request
// @route   POST /api/v1/customizations
// @access  Private (Customer)
const createRequest = asyncHandler(async (req, res) => {
  const {
    vendorId,
    productId,
    selectedColor,
    selectedFabric,
    selectedStyle,
    size,
    measurements,
    notes,
    referenceImages,
    status
  } = req.body;

  if (!vendorId || !productId || !selectedColor || !selectedFabric || !selectedStyle || !size) {
    res.status(400);
    throw new Error('Required fields: vendorId, productId, selectedColor, selectedFabric, selectedStyle, size');
  }

  // Check if vendor exists and is indeed a vendor
  const vendor = await User.findOne({ _id: vendorId, role: 'vendor' });
  if (!vendor) {
    res.status(404);
    throw new Error('Vendor not found');
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const initialStatus = status === 'submitted' ? 'submitted' : 'draft';

  const request = await CustomDesignRequest.create({
    customerId: req.user._id,
    vendorId,
    productId,
    selectedColor,
    selectedFabric,
    selectedStyle,
    size,
    measurements: measurements || {},
    notes: notes || '',
    referenceImages: referenceImages || [],
    status: initialStatus,
    paymentStatus: 'pending'
  });

  if (initialStatus === 'submitted') {
    // Notify vendor
    await createNotification({
      user: vendorId,
      title: 'New Custom Design Request 👕',
      message: `You received a new customization request for "${product.name}" from ${req.user.name}.`,
      link: `/vendor/custom-orders`,
      type: 'custom_order'
    });
  }

  res.status(201).json({ success: true, request });
});

// @desc    Update a draft request
// @route   PUT /api/v1/customizations/:id
// @access  Private (Customer)
const updateRequest = asyncHandler(async (req, res) => {
  const request = await CustomDesignRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.customerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  if (request.status !== 'draft') {
    res.status(400);
    throw new Error('Only draft requests can be edited');
  }

  const fields = [
    'selectedColor', 'selectedFabric', 'selectedStyle', 'size',
    'measurements', 'notes', 'referenceImages'
  ];

  fields.forEach(f => {
    if (req.body[f] !== undefined) request[f] = req.body[f];
  });

  if (req.body.status === 'submitted') {
    request.status = 'submitted';
    // Notify vendor
    await createNotification({
      user: request.vendorId,
      title: 'New Custom Design Request 👕',
      message: `You received a new customization request from ${req.user.name}.`,
      link: `/vendor/custom-orders`,
      type: 'custom_order'
    });
  }

  const updated = await request.save();
  res.json({ success: true, request: updated });
});

// @desc    Submit a draft request
// @route   PUT /api/v1/customizations/:id/submit
// @access  Private (Customer)
const submitRequest = asyncHandler(async (req, res) => {
  const request = await CustomDesignRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.customerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  if (request.status !== 'draft') {
    res.status(400);
    throw new Error('Request is already submitted or processed');
  }

  request.status = 'submitted';
  await request.save();

  // Notify vendor
  await createNotification({
    user: request.vendorId,
    title: 'New Custom Design Request 👕',
    message: `You received a new customization request from ${req.user.name}.`,
    link: `/vendor/custom-orders`,
    type: 'custom_order'
  });

  res.json({ success: true, message: 'Request submitted successfully', request });
});

// @desc    Get customer requests
// @route   GET /api/v1/customizations/my-requests
// @access  Private (Customer)
const getCustomerRequests = asyncHandler(async (req, res) => {
  const requests = await CustomDesignRequest.find({ customerId: req.user._id })
    .populate('vendorId', 'name email vendorProfile.businessName')
    .populate('productId', 'name thumbnail price')
    .sort({ createdAt: -1 });

  res.json({ success: true, requests });
});

// @desc    Get single customization request details
// @route   GET /api/v1/customizations/:id
// @access  Private (Customer/Vendor/Admin)
const getRequestDetail = asyncHandler(async (req, res) => {
  const request = await CustomDesignRequest.findById(req.params.id)
    .populate('customerId', 'name email phone')
    .populate('vendorId', 'name email vendorProfile.businessName')
    .populate('productId', 'name thumbnail price brand');

  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  // RBAC checks
  const isCustomer = request.customerId._id.toString() === req.user._id.toString();
  const isVendor = request.vendorId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isCustomer && !isVendor && !isAdmin) {
    res.status(403);
    throw new Error('Not authorised to view this request');
  }

  res.json({ success: true, request });
});

// @desc    Customer responds to quote
// @route   PUT /api/v1/customizations/:id/respond-quote
// @access  Private (Customer)
const respondToQuote = asyncHandler(async (req, res) => {
  const { action, notes } = req.body;
  if (!action || !['accept', 'reject', 'change_request'].includes(action)) {
    res.status(400);
    throw new Error('Valid action is required (accept, reject, change_request)');
  }

  const request = await CustomDesignRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.customerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  if (request.status !== 'quoted') {
    res.status(400);
    throw new Error('No active quote found to respond to');
  }

  if (action === 'accept') {
    request.status = 'accepted';
    // Notify vendor
    await createNotification({
      user: request.vendorId,
      title: 'Quote Accepted 👍',
      message: `${req.user.name} accepted your quote of ₹${request.quotedPrice}. Waiting for payment.`,
      link: `/vendor/custom-orders`,
      type: 'custom_order'
    });
  } else if (action === 'reject') {
    request.status = 'rejected';
    // Notify vendor
    await createNotification({
      user: request.vendorId,
      title: 'Quote Rejected 👎',
      message: `${req.user.name} rejected your quote of ₹${request.quotedPrice}.`,
      link: `/vendor/custom-orders`,
      type: 'custom_order'
    });
  } else if (action === 'change_request') {
    request.status = 'submitted'; // Send back to vendor review
    if (notes) request.notes = `${request.notes}\n\n[Change Request Notes]: ${notes}`;
    // Notify vendor
    await createNotification({
      user: request.vendorId,
      title: 'Revision Requested 🔄',
      message: `${req.user.name} requested changes on your quote.`,
      link: `/vendor/custom-orders`,
      type: 'custom_order'
    });
  }

  const updated = await request.save();
  res.json({ success: true, message: `Quote ${action}ed successfully`, request: updated });
});

// @desc    Initiate payment for custom request quote
// @route   POST /api/v1/customizations/:id/pay
// @access  Private (Customer)
const initiatePayment = asyncHandler(async (req, res) => {
  const request = await CustomDesignRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.customerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  if (request.status !== 'accepted') {
    res.status(400);
    throw new Error('Quote must be accepted before initiating payment');
  }

  if (request.paymentStatus === 'paid') {
    res.status(400);
    throw new Error('Payment already completed');
  }

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(request.quotedPrice * 100),
    currency: 'INR',
    receipt: `custom_${request._id.toString().substring(18)}`,
    notes: {
      customRequestId: request._id.toString(),
      customerId: request.customerId.toString()
    }
  });

  request.razorpayOrderId = rzpOrder.id;
  await request.save();

  res.json({
    success: true,
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID
  });
});

// @desc    Verify Razorpay signature and set status to production
// @route   POST /api/v1/customizations/:id/verify-payment
// @access  Private (Customer)
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing required payment fields');
  }

  const request = await CustomDesignRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  // Signature check
  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment signature verification failed');
  }

  request.paymentStatus = 'paid';
  request.razorpayPaymentId = razorpay_payment_id;
  request.razorpaySignature = razorpay_signature;
  request.status = 'production';
  await request.save();

  // Notify vendor
  await createNotification({
    user: request.vendorId,
    title: 'Custom Payment Received 💳',
    message: `Payment received for custom order. Production starts now!`,
    link: `/vendor/custom-orders`,
    type: 'custom_order'
  });

  res.json({ success: true, message: 'Payment verified and production started', request });
});


/* ── Vendor Controllers ────────────────────────────────────────── */

// @desc    Get vendor assigned requests
// @route   GET /api/v1/customizations/vendor/requests
// @access  Private (Vendor)
const getVendorRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = { vendorId: req.user._id };
  if (status) query.status = status;

  const requests = await CustomDesignRequest.find(query)
    .populate('customerId', 'name email phone')
    .populate('productId', 'name thumbnail price')
    .sort({ createdAt: -1 });

  res.json({ success: true, requests });
});

// @desc    Vendor respond to request (approve, reject, or quote)
// @route   PUT /api/v1/customizations/:id/vendor-respond
// @access  Private (Vendor)
const respondToRequest = asyncHandler(async (req, res) => {
  const { action, estimatedPrice, productionDays, message, reason } = req.body;
  if (!action || !['approve', 'reject', 'quote'].includes(action)) {
    res.status(400);
    throw new Error('Valid action is required (approve, reject, quote)');
  }

  const request = await CustomDesignRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.vendorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  if (request.status !== 'submitted') {
    res.status(400);
    throw new Error('Can only respond to submitted requests');
  }

  if (action === 'quote') {
    if (!estimatedPrice || !productionDays) {
      res.status(400);
      throw new Error('Price and production days are required for a quotation');
    }
    request.status = 'quoted';
    request.quotedPrice = estimatedPrice;
    request.productionDays = productionDays;
    request.vendorMessage = message || '';
    
    // Notify customer
    await createNotification({
      user: request.customerId,
      title: 'New Price Quote Received 🏷️',
      message: `Vendor quoted ₹${estimatedPrice} with ${productionDays} days production time.`,
      link: `/profile/customizations`,
      type: 'custom_order'
    });
  } else if (action === 'approve') {
    request.status = 'accepted';
    // Notify customer
    await createNotification({
      user: request.customerId,
      title: 'Design Approved by Vendor ✅',
      message: `Your customization request has been approved. Waiting for price quote.`,
      link: `/profile/customizations`,
      type: 'custom_order'
    });
  } else if (action === 'reject') {
    request.status = 'rejected';
    request.rejectionReason = reason || 'Fabric/Design not possible';
    
    // Notify customer
    await createNotification({
      user: request.customerId,
      title: 'Request Rejected ❌',
      message: `Your request was rejected. Reason: ${request.rejectionReason}`,
      link: `/profile/customizations`,
      type: 'custom_order'
    });
  }

  const updated = await request.save();
  res.json({ success: true, message: `Request status set to ${request.status}`, request: updated });
});

// @desc    Vendor updates production status (production -> ready -> shipped -> delivered)
// @route   PUT /api/v1/customizations/:id/vendor-status
// @access  Private (Vendor)
const updateProductionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const validTransitions = ['production', 'ready', 'shipped', 'delivered'];
  if (!status || !validTransitions.includes(status)) {
    res.status(400);
    throw new Error('Invalid production status update target');
  }

  const request = await CustomDesignRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  if (request.vendorId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  request.status = status;
  await request.save();

  // Notifications mapping
  const titles = {
    production: 'Production Started 🛠️',
    ready: 'Custom Design Tailored ✨',
    shipped: 'Order Shipped 🚚',
    delivered: 'Order Delivered 🎉'
  };

  const messages = {
    production: 'The vendor has started tailoring your custom design.',
    ready: 'Your custom dress has been tailored and is ready for shipping.',
    shipped: 'Your customized order is on its way.',
    delivered: 'Your customized dress has been delivered successfully!'
  };

  await createNotification({
    user: request.customerId,
    title: titles[status],
    message: messages[status],
    link: `/profile/customizations`,
    type: 'custom_order'
  });

  res.json({ success: true, message: `Status updated to ${status}`, request });
});

// @desc    Get vendor custom sales metrics analytics
// @route   GET /api/v1/customizations/vendor/analytics
// @access  Private (Vendor)
const getVendorCustomAnalytics = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const [totalOrders, totalRevenueData, pendingRequests, completedOrders] = await Promise.all([
    CustomDesignRequest.countDocuments({ vendorId, status: { $nin: ['draft'] } }),
    CustomDesignRequest.aggregate([
      { $match: { vendorId, paymentStatus: 'paid' } },
      { $group: { _id: null, revenue: { $sum: '$quotedPrice' } } }
    ]),
    CustomDesignRequest.countDocuments({ vendorId, status: 'submitted' }),
    CustomDesignRequest.find({ vendorId, status: 'delivered' }).select('createdAt updatedAt').lean()
  ]);

  // Average production days calculation
  let averageProductionTime = 0;
  if (completedOrders.length > 0) {
    const totalTimeMs = completedOrders.reduce((sum, o) => sum + (new Date(o.updatedAt) - new Date(o.createdAt)), 0);
    averageProductionTime = Math.round(totalTimeMs / (1000 * 60 * 60 * 24 * completedOrders.length)); // in days
  }

  res.json({
    success: true,
    totalCustomOrders: totalOrders,
    revenue: totalRevenueData[0]?.revenue || 0,
    pendingRequests,
    averageProductionTime
  });
});


/* ── Admin Controllers ─────────────────────────────────────────── */

// @desc    Get admin customization request statistics overview
// @route   GET /api/v1/customizations/admin/overview
// @access  Private (Admin)
const getAdminOverview = asyncHandler(async (req, res) => {
  const [total, pending, activeProduction, delivered, popularStyles, popularFabrics] = await Promise.all([
    CustomDesignRequest.countDocuments({ status: { $ne: 'draft' } }),
    CustomDesignRequest.countDocuments({ status: 'submitted' }),
    CustomDesignRequest.countDocuments({ status: 'production' }),
    CustomDesignRequest.countDocuments({ status: 'delivered' }),
    
    // Popular custom style aggregator
    CustomDesignRequest.aggregate([
      { $match: { status: { $ne: 'draft' } } },
      { $group: { _id: '$selectedStyle', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),

    // Popular custom fabric aggregator
    CustomDesignRequest.aggregate([
      { $match: { status: { $ne: 'draft' } } },
      { $group: { _id: '$selectedFabric', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
  ]);

  res.json({
    success: true,
    totalRequests: total,
    pendingRequests: pending,
    activeProductionOrders: activeProduction,
    deliveredOrders: delivered,
    popularStyles,
    popularFabrics
  });
});

// @desc    Get custom vendors monitoring and ratings
// @route   GET /api/v1/customizations/admin/vendors
// @access  Private (Admin)
const getAdminVendorPerformance = asyncHandler(async (req, res) => {
  const vendorPerformance = await CustomDesignRequest.aggregate([
    { $match: { status: { $nin: ['draft', 'rejected'] } } },
    {
      $group: {
        _id: '$vendorId',
        totalRequests: { $sum: 1 },
        completedRequests: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        totalRevenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$quotedPrice', 0] } }
      }
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'vendorInfo' } },
    { $unwind: '$vendorInfo' },
    {
      $project: {
        _id: 1,
        vendorName: '$vendorInfo.name',
        businessName: '$vendorInfo.vendorProfile.businessName',
        totalRequests: 1,
        totalRevenue: 1,
        orderCompletionRate: {
          $multiply: [
            { $cond: [{ $gt: ['$totalRequests', 0] }, { $divide: ['$completedRequests', '$totalRequests'] }, 0] },
            100
          ]
        }
      }
    },
    { $sort: { totalRevenue: -1 } }
  ]);

  res.json({ success: true, vendors: vendorPerformance });
});

// @desc    Admin resolve disputes
// @route   PUT /api/v1/customizations/:id/admin-dispute
// @access  Private (Admin)
const resolveDispute = asyncHandler(async (req, res) => {
  const { disputeReason, resolution, adminNotes } = req.body;
  if (!resolution || !['refund', 'replace', 'rejected'].includes(resolution)) {
    res.status(400);
    throw new Error('Valid resolution is required (refund, replace, rejected)');
  }

  const request = await CustomDesignRequest.findById(req.params.id);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }

  request.dispute.isDisputed = true;
  request.dispute.reason = disputeReason || 'Incorrect custom details / quality issue';
  request.dispute.resolution = resolution;
  request.dispute.adminNotes = adminNotes || '';
  request.dispute.resolvedAt = new Date();

  if (resolution === 'refund') {
    request.paymentStatus = 'refunded';
    request.status = 'rejected';
  }

  await request.save();

  // Notify customer
  await createNotification({
    user: request.customerId,
    title: 'Dispute Resolved ⚖️',
    message: `Admin resolved dispute. Resolution: ${resolution}.`,
    link: `/profile/customizations`,
    type: 'custom_order'
  });

  // Notify vendor
  await createNotification({
    user: request.vendorId,
    title: 'Dispute Case Resolved ⚖️',
    message: `Admin resolved customization dispute for custom request ID: ${request._id.toString()}. Resolution: ${resolution}`,
    link: `/vendor/custom-orders`,
    type: 'custom_order'
  });

  res.json({ success: true, message: `Dispute resolved as ${resolution}`, request });
});

// @desc    Get all general bespoke customization requests (accessible by admin and vendor)
// @route   GET /api/v1/customizations
// @access  Private (Admin/Vendor)
const getAllRequests = asyncHandler(async (req, res) => {
  const requests = await Customization.find({})
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 });

  res.json({ success: true, customizations: requests });
});

// @desc    Update a general bespoke request status/quote (accessible by admin and vendor)
// @route   PUT /api/v1/customizations/:id/status
// @access  Private (Admin/Vendor)
const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status, priceQuote, paymentStatus } = req.body;

  const customization = await Customization.findById(req.params.id);
  if (!customization) {
    res.status(404);
    throw new Error('Customization request not found');
  }

  if (status !== undefined) customization.status = status;
  if (priceQuote !== undefined) customization.priceQuote = priceQuote;
  if (paymentStatus !== undefined) customization.paymentStatus = paymentStatus;

  const updated = await customization.save();

  // Populate user info for frontend response consistency
  const populated = await Customization.findById(updated._id).populate('user', 'name email phone');

  // Notify customer of update
  await createNotification({
    user: customization.user,
    title: 'Customization Request Updated ✂️',
    message: `Your custom design status is now "${status || customization.status}".`,
    link: '/profile',
    type: 'custom_order'
  });

  res.json({ success: true, customization: populated });
});

// @desc    Verify Razorpay payment for a general bespoke request
// @route   POST /api/v1/customizations/general/verify-payment
// @access  Private (Customer)
const verifyGeneralPayment = asyncHandler(async (req, res) => {
  const { customizationId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!customizationId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    res.status(400);
    throw new Error('Missing required payment fields');
  }

  // Signature check
  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_secret')
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generated !== razorpay_signature) {
    res.status(400);
    throw new Error('Payment signature verification failed');
  }

  const customization = await Customization.findById(customizationId);
  if (!customization) {
    res.status(404);
    throw new Error('Customization request not found');
  }

  customization.paymentStatus = 'paid';
  customization.paymentId = razorpay_payment_id;
  customization.status = 'approved'; // Set to approved since payment received
  await customization.save();

  res.json({ success: true, message: 'Payment verified successfully', customization });
});

// @desc    Cancel a general bespoke customization request
// @route   PUT /api/v1/customizations/general/:id/cancel
// @access  Private (Customer)
const cancelGeneralRequest = asyncHandler(async (req, res) => {
  const customization = await Customization.findById(req.params.id);
  if (!customization) {
    res.status(404);
    throw new Error('Customization request not found');
  }

  // Check ownership
  if (customization.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised');
  }

  // Can only cancel if status is 'pending'
  if (customization.status !== 'pending') {
    res.status(400);
    throw new Error('This request cannot be cancelled as it has already been processed');
  }

  customization.status = 'cancelled';
  await customization.save();

  // Notify admins
  const admins = await User.find({ role: 'admin' }).select('_id');
  await Promise.all(admins.map(admin => createNotification({
    user: admin._id,
    title: 'Custom Design Order Cancelled ❌',
    message: `${req.user.name} cancelled their custom order (ID: ${customization._id.toString().slice(-6).toUpperCase()}).`,
    link: '/admin/customizations',
    type: 'custom_order'
  })));

  res.json({ success: true, message: 'Custom order cancelled successfully', customization });
});

module.exports = {
  createGeneralRequest,
  getMyGeneralRequests,
  getAllGeneralRequests,
  createRequest,
  updateRequest,
  submitRequest,
  getCustomerRequests,
  getRequestDetail,
  respondToQuote,
  initiatePayment,
  verifyPayment,
  getVendorRequests,
  respondToRequest,
  updateProductionStatus,
  getVendorCustomAnalytics,
  getAdminOverview,
  getAdminVendorPerformance,
  resolveDispute,
  getAllRequests,
  updateRequestStatus,
  verifyGeneralPayment,
  cancelGeneralRequest
};
