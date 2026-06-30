const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationHelper');

/* ───────────────────────── PROFILE ───────────────────────── */

// @GET /api/v1/vendor/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ success: true, vendor: user });
});

// @PUT /api/v1/vendor/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, phone, avatar, businessName, gstNumber, panNumber, address, bankDetails } = req.body;

  if (name)   user.name  = name;
  if (phone)  user.phone = phone;
  if (avatar) user.avatar = avatar;

  const { storeBanner, storeDescription } = req.body;

  if (businessName !== undefined) user.vendorProfile.businessName = businessName;
  if (gstNumber !== undefined)    user.vendorProfile.gstNumber = gstNumber;
  if (panNumber !== undefined)    user.vendorProfile.panNumber = panNumber;
  if (storeBanner !== undefined)     user.vendorProfile.storeBanner = storeBanner;
  if (storeDescription !== undefined) user.vendorProfile.storeDescription = storeDescription;
  if (address)     user.vendorProfile.address     = { ...user.vendorProfile.address, ...address };
  if (bankDetails) user.vendorProfile.bankDetails = { ...user.vendorProfile.bankDetails, ...bankDetails };

  await user.save();
  res.json({ success: true, vendor: await User.findById(user._id).select('-password') });
});

/* ───────────────────────── PUBLIC STORE PAGE ───────────────────────── */

// @GET /api/v1/vendor/store/:slug  (public)
const getStoreBySlug = asyncHandler(async (req, res) => {
  const vendorUser = await User.findOne({
    role: 'vendor',
    vendorStatus: 'approved',
    'vendorProfile.storeSlug': req.params.slug,
  }).select('name avatar vendorProfile.businessName vendorProfile.storeSlug vendorProfile.storeBanner vendorProfile.storeDescription createdAt');

  if (!vendorUser) { res.status(404); throw new Error('Store not found'); }

  const { page = 1, limit = 24, sort } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const sortOptions = {
    newest: { _id: -1 },
    priceLow: { price: 1 },
    priceHigh: { price: -1 },
    rating: { rating: -1 },
    popular: { numReviews: -1 },
  };
  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const productQuery = { vendor: vendorUser._id, isActive: true };

  const [productCount, products, ratingAgg] = await Promise.all([
    Product.countDocuments(productQuery),
    Product.find(productQuery).sort(sortBy).skip(skip).limit(Number(limit)).lean(),
    Product.aggregate([
      { $match: productQuery },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, totalReviews: { $sum: '$numReviews' } } },
    ]),
  ]);

  res.json({
    success: true,
    vendor: {
      name: vendorUser.vendorProfile?.businessName || vendorUser.name,
      avatar: vendorUser.avatar,
      storeSlug: vendorUser.vendorProfile?.storeSlug,
      storeBanner: vendorUser.vendorProfile?.storeBanner || '',
      storeDescription: vendorUser.vendorProfile?.storeDescription || '',
      memberSince: vendorUser.createdAt,
      rating: ratingAgg[0]?.avgRating || 0,
      totalReviews: ratingAgg[0]?.totalReviews || 0,
    },
    productCount,
    total: productCount,
    page: Number(page),
    pages: Math.ceil(productCount / limit),
    products,
  });
});

/* ───────────────────────── DASHBOARD ───────────────────────── */

// @GET /api/v1/vendor/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;

  const [productCount, lowStockCount, pendingReturnsCount] = await Promise.all([
    Product.countDocuments({}),
    Product.countDocuments({
      variants: { $elemMatch: { stock: { $lte: 5 } } },
    }),
    Order.countDocuments({
      'items.returnStatus': 'requested',
    }),
  ]);

  const itemAgg = await Order.aggregate([
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.itemStatus',
        count: { $sum: 1 },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        earning: { $sum: '$items.vendorEarning' },
      },
    },
  ]);

  const earningsAgg = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { paymentStatus: 'paid' } },
    {
      $group: {
        _id: '$items.payoutStatus',
        total: { $sum: '$items.vendorEarning' },
      },
    },
  ]);

  const statusCounts = {};
  let totalOrders = 0;
  itemAgg.forEach((s) => {
    statusCounts[s._id] = { count: s.count, revenue: s.revenue, earning: s.earning };
    totalOrders += s.count;
  });

  const earnings = { pending: 0, paid: 0 };
  earningsAgg.forEach((e) => { earnings[e._id] = e.total; });

  res.json({
    success: true,
    products: productCount,
    lowStockCount,
    pendingReturnsCount,
    totalOrderItems: totalOrders,
    statusCounts,
    earnings,
    vendorStatus: req.user.vendorStatus,
    commissionPercent: req.user.vendorProfile?.commissionPercent ?? 10,
  });
});

/* ───────────────────────── PRODUCTS ───────────────────────── */

// @GET /api/v1/vendor/products
const getMyProducts = asyncHandler(async (req, res) => {
  const { search, isActive, page = 1, limit = 20 } = req.query;
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (search) query.name = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
  ]);

  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), products });
});

// @GET /api/v1/vendor/products/:id
const getMyProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json({ success: true, product });
});

// @POST /api/v1/vendor/products
const createProduct = asyncHandler(async (req, res) => {
  const data = { ...req.body, vendor: req.user._id };
  const product = await Product.create(data);
  res.status(201).json({ success: true, product });
});

// @PUT /api/v1/vendor/products/:id
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const body = { ...req.body };
  delete body.vendor; // vendor cannot reassign ownership

  Object.assign(product, body);
  product.slug = null; // regenerate slug
  const updated = await product.save();
  res.json({ success: true, product: updated });
});

// @DELETE /api/v1/vendor/products/:id
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// @PUT /api/v1/vendor/products/:id/toggle-active
const toggleProductActive = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  product.isActive = !product.isActive;
  await product.save();
  res.json({ success: true, product });
});

/* ───────────────────────── INVENTORY ───────────────────────── */

// @GET /api/v1/vendor/inventory
const getInventory = asyncHandler(async (req, res) => {
  const { lowStockOnly } = req.query;
  const products = await Product.find({})
    .select('name thumbnail variants lowStockThreshold isActive')
    .lean();

  let rows = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      rows.push({
        productId: p._id,
        productName: p.name,
        thumbnail: p.thumbnail,
        variantId: v._id,
        size: v.size,
        color: v.color,
        sku: v.sku,
        stock: v.stock,
        lowStockThreshold: p.lowStockThreshold ?? 5,
        isLow: v.stock <= (p.lowStockThreshold ?? 5),
        isActive: p.isActive,
      });
    });
  });

  if (lowStockOnly === 'true') rows = rows.filter((r) => r.isLow);

  res.json({ success: true, total: rows.length, items: rows });
});

// @PUT /api/v1/vendor/inventory/:productId/variants/:variantId
const updateVariantStock = asyncHandler(async (req, res) => {
  const { productId, variantId } = req.params;
  const { stock } = req.body;
  if (stock === undefined || stock < 0) { res.status(400); throw new Error('Valid stock value required'); }

  const product = await Product.findById(productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const variant = product.variants.id(variantId);
  if (!variant) { res.status(404); throw new Error('Variant not found'); }

  variant.stock = stock;
  await product.save();
  res.json({ success: true, product });
});

/* ───────────────────────── ORDERS ───────────────────────── */

// @GET /api/v1/vendor/orders
const getVendorOrders = asyncHandler(async (req, res) => {
  const { itemStatus, returnStatus, page = 1, limit = 20 } = req.query;

  const query = {};
  if (itemStatus) query['items.itemStatus'] = itemStatus;
  if (returnStatus) query['items.returnStatus'] = returnStatus;

  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const total = await Order.countDocuments(query);

  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), orders });
});

// @GET /api/v1/vendor/orders/:id
const getVendorOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .lean();
  if (!order) { res.status(404); throw new Error('Order not found'); }

  res.json({ success: true, order });
});

// @PUT /api/v1/vendor/orders/:id/bill
const updateOrderBill = asyncHandler(async (req, res) => {
  const { billUrl } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.billUrl = billUrl || '';
  await order.save();

  res.json({ success: true, message: 'Order bill updated successfully', billUrl: order.billUrl });
});

// Allowed forward transitions for vendor-controlled item status
const ITEM_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed:    ['shipped'],
  shipped:   ['delivered'],
  delivered: [],
  cancelled: [],
};

// @PUT /api/v1/vendor/orders/:id/items/:itemId/status
const updateItemStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const item = order.items.id(req.params.itemId);
  if (!item) {
    res.status(404); throw new Error('Item not found');
  }

  const allowed = ITEM_TRANSITIONS[item.itemStatus] || [];
  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(
      `Cannot transition item from "${item.itemStatus}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}.`
    );
  }

  item.itemStatus = status;
  item.itemStatusHistory.push({ status, note });

  if (status === 'cancelled') {
    await Product.updateOne(
      { _id: item.product, variants: { $elemMatch: { size: item.variantSize, color: item.variantColor } } },
      { $inc: { 'variants.$.stock': item.quantity } }
    );
  }

  // If every item for this order is shipped/delivered, optionally bump order-level status forward.
  await order.save();

  await createNotification({
    user: order.user,
    title: `Order Update: ${item.name}`,
    message: `An item in your order #${order.orderNumber} is now "${status}". ${note || ''}`,
    link: `/orders/${order._id}`,
  });

  res.json({ success: true, item });
});

// @PUT /api/v1/vendor/orders/:id/items/:itemId/tracking
const updateItemTracking = asyncHandler(async (req, res) => {
  const { trackingNumber, shippingCarrier, shippingLabelUrl } = req.body;

  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const item = order.items.id(req.params.itemId);
  if (!item) {
    res.status(404); throw new Error('Item not found');
  }

  if (trackingNumber !== undefined) item.trackingNumber = trackingNumber;
  if (shippingCarrier !== undefined) item.shippingCarrier = shippingCarrier;
  if (shippingLabelUrl !== undefined) item.shippingLabelUrl = shippingLabelUrl;

  // Auto-advance to shipped once a tracking number is added
  if (trackingNumber && ['pending', 'confirmed', 'packed'].includes(item.itemStatus)) {
    item.itemStatus = 'shipped';
    item.itemStatusHistory.push({ status: 'shipped', note: 'Tracking number added' });

    await createNotification({
      user: order.user._id,
      title: 'Item Shipped',
      message: `"${item.name}" from order #${order.orderNumber} has been shipped. ${shippingCarrier ? `Carrier: ${shippingCarrier}. ` : ''}Tracking: ${trackingNumber}`,
      link: `/orders/${order._id}`,
    });
  }

  await order.save();
  res.json({ success: true, item });
});

/* ───────────────────────── EARNINGS ───────────────────────── */

// @GET /api/v1/vendor/earnings
const getEarnings = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const { from, to } = req.query;

  const match = { 'items.vendor': vendorId };
  if (from || to) {
    match.createdAt = {};
    if (from) match.createdAt.$gte = new Date(from);
    if (to) match.createdAt.$lte = new Date(to);
  }

  const agg = await Order.aggregate([
    { $unwind: '$items' },
    { $match: { 'items.vendor': vendorId, ...(match.createdAt ? { createdAt: match.createdAt } : {}) } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        unitsSold: { $sum: '$items.quantity' },
        grossRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        commission: { $sum: '$items.commissionAmount' },
        earning: { $sum: '$items.vendorEarning' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totals = agg.reduce((acc, d) => {
    acc.unitsSold += d.unitsSold;
    acc.grossRevenue += d.grossRevenue;
    acc.commission += d.commission;
    acc.earning += d.earning;
    return acc;
  }, { unitsSold: 0, grossRevenue: 0, commission: 0, earning: 0 });

  res.json({ success: true, daily: agg, totals, commissionPercent: req.user.vendorProfile?.commissionPercent ?? 10 });
});

// @GET /api/v1/vendor/earnings/invoices
const getInvoices = asyncHandler(async (req, res) => {
  const vendorId = req.user._id;
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const orders = await Order.find({ 'items.vendor': vendorId, paymentStatus: 'paid' })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  const invoices = orders.map((o) => {
    const myItems = o.items.filter((i) => i.vendor && i.vendor.toString() === vendorId.toString());
    const subtotal = myItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const commission = myItems.reduce((s, i) => s + (i.commissionAmount || 0), 0);
    const earning = myItems.reduce((s, i) => s + (i.vendorEarning || 0), 0);
    return {
      orderId: o._id,
      orderNumber: o.orderNumber,
      date: o.createdAt,
      customer: o.user?.name,
      items: myItems,
      subtotal,
      commission,
      earning,
    };
  });

  const total = await Order.countDocuments({ 'items.vendor': vendorId, paymentStatus: 'paid' });
  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), invoices });
});

// @PUT /api/v1/vendor/products/bulk-category
const bulkAssignCategory = asyncHandler(async (req, res) => {
  const { productIds, categoryId } = req.body;
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    res.status(400);
    throw new Error('Please select at least one product.');
  }
  if (!categoryId) {
    res.status(400);
    throw new Error('Please select a category.');
  }

  const result = await Product.updateMany(
    { _id: { $in: productIds }, vendor: req.user._id },
    { $set: { category: categoryId } }
  );

  res.json({
    success: true,
    message: `Successfully assigned category to ${result.modifiedCount} product(s).`,
    modifiedCount: result.modifiedCount,
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getDashboard,
  getMyProducts,
  getMyProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
  getInventory,
  updateVariantStock,
  getVendorOrders,
  getVendorOrderById,
  updateItemStatus,
  updateItemTracking,
  updateOrderBill,
  getEarnings,
  getInvoices,
  getStoreBySlug,
  bulkAssignCategory,
};
