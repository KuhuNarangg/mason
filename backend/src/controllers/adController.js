const asyncHandler = require('express-async-handler');
const Ad = require('../models/Ad');
const AdClick = require('../models/AdClick');
const Product = require('../models/Product');

// ─────────────────────────────────────────────
// Helper: detect device type from User-Agent
// ─────────────────────────────────────────────
const getDeviceType = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/.test(ua)) return 'mobile';
  if (ua) return 'desktop';
  return 'unknown';
};

// ─────────────────────────────────────────────
// Helper: build redirect URL for a product
// ─────────────────────────────────────────────
const buildProductUrl = (ad, product) => {
  const base = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',')[0].trim()
    : 'http://localhost:5173';

  // Base product page URL using the slug
  let url = `${base}/product/${product.slug}`;

  // Append UTM params if the ad has them (for Google Analytics tracking)
  const params = new URLSearchParams();
  if (ad.utmSource)   params.set('utm_source',   ad.utmSource);
  if (ad.utmMedium)   params.set('utm_medium',   ad.utmMedium);
  if (ad.utmCampaign) params.set('utm_campaign', ad.utmCampaign);
  params.set('ref', 'ad');   // always tag as coming from an ad

  const queryString = params.toString();
  if (queryString) url += `?${queryString}`;

  return url;
};

// ─────────────────────────────────────────────
// PUBLIC: Ad Redirect + Click Tracking
// GET /api/v1/r/:adId
// ─────────────────────────────────────────────
const redirectAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.adId).populate('product');

  // Ad not found
  if (!ad) {
    return res.status(404).json({ success: false, message: 'Ad not found' });
  }

  // Ad is not live (inactive or outside date range)
  if (!ad.isLive) {
    return res.status(410).json({ success: false, message: 'This ad is no longer active' });
  }

  const product = ad.product;

  // Product was deleted or deactivated
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not available' });
  }

  // Log the click asynchronously (don't await — don't slow down the redirect)
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || '';
  const userAgent = req.headers['user-agent'] || '';
  const referrer = req.headers['referer'] || req.headers['referrer'] || '';

  AdClick.create({
    ad: ad._id,
    product: product._id,
    user: req.user?._id || null,
    ip,
    userAgent,
    referrer,
    device: getDeviceType(userAgent),
  }).catch(() => {});  // silently ignore logging errors

  // Increment click counter on the Ad document (non-blocking)
  Ad.findByIdAndUpdate(ad._id, { $inc: { clicks: 1 } }).exec();

  // Build the destination URL and redirect
  const redirectUrl = buildProductUrl(ad, product);
  res.redirect(302, redirectUrl);
});

// ─────────────────────────────────────────────
// ADMIN: Create Ad
// POST /api/v1/ads
// ─────────────────────────────────────────────
const createAd = asyncHandler(async (req, res) => {
  const { product: productId, title, description, imageUrl, platform, utmSource, utmMedium, utmCampaign, startDate, endDate } = req.body;

  // Verify product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const ad = await Ad.create({
    product: productId,
    title,
    description,
    imageUrl,
    platform,
    utmSource,
    utmMedium,
    utmCampaign,
    startDate,
    endDate,
  });

  const populated = await Ad.findById(ad._id).populate('product', 'name slug thumbnail price');

  // Return the shareable redirect URL along with the ad
  const redirectUrl = `${req.protocol}://${req.get('host')}/api/v1/r/${ad._id}`;

  res.status(201).json({
    success: true,
    ad: populated,
    redirectUrl,   // ← this is what you paste into your Instagram ad
  });
});

// ─────────────────────────────────────────────
// ADMIN: Get all Ads
// GET /api/v1/ads
// ─────────────────────────────────────────────
const getAds = asyncHandler(async (req, res) => {
  const { platform, isActive, page = 1, limit = 20 } = req.query;
  const query = {};

  if (platform) query.platform = platform;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Ad.countDocuments(query);
  const ads = await Ad.find(query)
    .populate('product', 'name slug thumbnail price')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), ads });
});

// ─────────────────────────────────────────────
// ADMIN: Get single Ad
// GET /api/v1/ads/:id
// ─────────────────────────────────────────────
const getAdById = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id).populate('product', 'name slug thumbnail price');
  if (!ad) { res.status(404); throw new Error('Ad not found'); }

  const redirectUrl = `${req.protocol}://${req.get('host')}/api/v1/r/${ad._id}`;
  res.json({ success: true, ad, redirectUrl });
});

// ─────────────────────────────────────────────
// ADMIN: Update Ad
// PUT /api/v1/ads/:id
// ─────────────────────────────────────────────
const updateAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (!ad) { res.status(404); throw new Error('Ad not found'); }

  const fields = ['title', 'description', 'imageUrl', 'platform', 'utmSource', 'utmMedium', 'utmCampaign', 'isActive', 'startDate', 'endDate', 'product'];
  fields.forEach(f => { if (req.body[f] !== undefined) ad[f] = req.body[f]; });

  const updated = await ad.save();
  const populated = await Ad.findById(updated._id).populate('product', 'name slug thumbnail price');
  res.json({ success: true, ad: populated });
});

// ─────────────────────────────────────────────
// ADMIN: Delete Ad
// DELETE /api/v1/ads/:id
// ─────────────────────────────────────────────
const deleteAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findByIdAndDelete(req.params.id);
  if (!ad) { res.status(404); throw new Error('Ad not found'); }

  // Also remove all click logs for this ad
  await AdClick.deleteMany({ ad: req.params.id });

  res.json({ success: true, message: 'Ad and its click data deleted' });
});

// ─────────────────────────────────────────────
// ADMIN: Ad Analytics
// GET /api/v1/ads/:id/analytics
// ─────────────────────────────────────────────
const getAdAnalytics = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id).populate('product', 'name slug thumbnail price');
  if (!ad) { res.status(404); throw new Error('Ad not found'); }

  // Total clicks (from AdClick collection for accuracy)
  const totalClicks = await AdClick.countDocuments({ ad: ad._id });

  // Clicks by device type
  const byDevice = await AdClick.aggregate([
    { $match: { ad: ad._id } },
    { $group: { _id: '$device', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  // Clicks over last 7 days (daily breakdown)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dailyClicks = await AdClick.aggregate([
    { $match: { ad: ad._id, createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: {
          year:  { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day:   { $dayOfMonth: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
  ]);

  // Unique IPs (rough unique visitor count)
  const uniqueVisitors = await AdClick.distinct('ip', { ad: ad._id });

  res.json({
    success: true,
    ad,
    analytics: {
      totalClicks,
      uniqueVisitors: uniqueVisitors.length,
      byDevice,
      dailyClicks,
    },
  });
});

module.exports = {
  redirectAd,
  createAd,
  getAds,
  getAdById,
  updateAd,
  deleteAd,
  getAdAnalytics,
};
