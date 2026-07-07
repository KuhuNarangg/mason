const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const RestockNotification = require('../models/RestockNotification');
const { checkAndNotifyRestocks } = require('../utils/restockHelper');

// @GET /api/v1/products
const getProducts = asyncHandler(async (req, res) => {
  const {
    gender, subGender, type, brand, category, subcategory, vendor,
    minPrice, maxPrice, minDiscount, maxDiscount, rating, inStock,
    size, color, search, sort, page = 1, limit = 20, featured, trending,
  } = req.query;

  const query = { isActive: true };

  if (gender && gender !== 'all') query.gender = gender;
  if (subGender) query.subGender = subGender;
  if (type) query.type = { $in: type.split(',') };
  if (brand) query.brand = { $in: brand.split(',') };
  if (category) {
    const categoryIds = category.split(',').filter(id => mongoose.Types.ObjectId.isValid(id));
    const Category = require('../models/Category');
    const categoriesDb = await Category.find({ _id: { $in: categoryIds } });
    
    const orConditions = [
      { category: { $in: categoryIds } },
      { subcategory: { $in: categoryIds } }
    ];
    
    for (const cat of categoriesDb) {
      const catSlug = String(cat.slug || '').toLowerCase();
      const typeMatches = [];
      
      if (catSlug === 'dresses' || catSlug === 'dress') typeMatches.push('dress');
      if (catSlug === 'tops' || catSlug === 'top') typeMatches.push('top');
      if (catSlug === 'trousers' || catSlug === 'trouser') typeMatches.push('trouser', 'trousers');
      if (catSlug === 'ethnics' || catSlug === 'ethnic') typeMatches.push('ethnic');
      if (catSlug === 'joggers' || catSlug === 'jogger') typeMatches.push('jogger', 'joggers');
      
      const normalized = catSlug.replace(/s$/, '');
      if (normalized && !typeMatches.includes(normalized)) {
        typeMatches.push(normalized);
      }
      
      if (typeMatches.length > 0) {
        orConditions.push({ type: { $in: typeMatches } });
      }
    }
    
    query.$or = orConditions;
  }
  if (subcategory) query.subcategory = { $in: subcategory.split(',') };
  if (vendor) query.vendor = vendor;
  if (featured === 'true') query.isFeatured = true;
  if (trending === 'true') query.isTrending = true;
  if (search) {
    const cleanSearch = search.trim();
    const searchCondition = {
      $or: [
        { name: { $regex: cleanSearch, $options: 'i' } },
        { brand: { $regex: cleanSearch, $options: 'i' } },
        { description: { $regex: cleanSearch, $options: 'i' } },
        { tags: { $in: [new RegExp(cleanSearch, 'i')] } }
      ]
    };
    if (query.$or) {
      query.$and = [
        { $or: query.$or },
        searchCondition
      ];
      delete query.$or;
    } else {
      query.$or = searchCondition.$or;
    }
  }
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }
  if (minDiscount || maxDiscount) {
    query.discount = {};
    if (minDiscount) query.discount.$gte = Number(minDiscount);
    if (maxDiscount) query.discount.$lte = Number(maxDiscount);
  }
  if (rating) query.rating = { $gte: Number(rating) };
  if (size) query['variants.size'] = { $in: size.split(',') };
  if (color) query['variants.color'] = { $in: color.split(',') };
  if (inStock === 'true') query['variants.stock'] = { $gt: 0 };

  const sortOptions = {
    newest: { _id: -1 },
    priceLow: { price: 1 },
    priceHigh: { price: -1 },
    rating: { rating: -1 },
    popular: { numReviews: -1 },
    discount: { discount: -1 },
  };
  const sortBy = sortOptions[sort] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query).sort(sortBy).skip(skip).limit(Number(limit)).lean()
  ]);

  res.json({ success: true, total, page: Number(page), pages: Math.ceil(total / limit), products });
});

// @GET /api/v1/products/filters/options
// Returns distinct filter values (brands, colors, sizes, price range) for a given
// category/subcategory/gender/type scope — used to populate the filter sidebar dynamically.
const getFilterOptions = asyncHandler(async (req, res) => {
  const { gender, category, subcategory, type } = req.query;
  const match = { isActive: true };
  if (gender && gender !== 'all') match.gender = gender;
  if (category && mongoose.Types.ObjectId.isValid(category)) match.category = new mongoose.Types.ObjectId(category);
  if (subcategory && mongoose.Types.ObjectId.isValid(subcategory)) match.subcategory = new mongoose.Types.ObjectId(subcategory);
  if (type) match.type = { $in: type.split(',') };

  const [brands, colors, sizes, priceStats] = await Promise.all([
    Product.distinct('brand', match),
    Product.distinct('variants.color', match),
    Product.distinct('variants.size', match),
    Product.aggregate([
      { $match: match },
      { $group: { _id: null, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
    ]),
  ]);

  res.json({
    success: true,
    brands: brands.filter(Boolean).sort(),
    colors: colors.filter(Boolean).sort(),
    sizes: sizes.filter(Boolean),
    priceRange: priceStats[0] ? { minPrice: priceStats[0].minPrice, maxPrice: priceStats[0].maxPrice } : { minPrice: 0, maxPrice: 0 },
  });
});

// @GET /api/v1/products/:id
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('reviews.user', 'name avatar').lean();
  if (!product) { res.status(404); throw new Error('Product not found'); }
  if (product.reviews) {
    product.reviews = product.reviews.filter(r => r.isApproved);
  }
  res.json({ success: true, product });
});

// @GET /api/v1/products/slug/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate('reviews.user', 'name avatar').lean();
  if (!product) { res.status(404); throw new Error('Product not found'); }
  if (product.reviews) {
    product.reviews = product.reviews.filter(r => r.isApproved);
  }
  res.json({ success: true, product });
});

// @POST /api/v1/products (admin)
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

// @PUT /api/v1/products/:id (admin)
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  
  const oldVariants = JSON.parse(JSON.stringify(product.variants || []));
  Object.assign(product, req.body);
  product.slug = null; // reset slug to regenerate
  const updated = await product.save();

  // Fire-and-forget notification check in background
  checkAndNotifyRestocks(product._id, oldVariants, updated.variants).catch(err => {
    console.error('Error triggering restock notification check:', err);
  });

  res.json({ success: true, product: updated });
});

// @POST /api/v1/products/:id/notify-restock
const subscribeRestockNotification = asyncHandler(async (req, res) => {
  const { variantId, size, color, email } = req.body;
  const productId = req.params.id;

  if (!email || !variantId) {
    res.status(400);
    throw new Error('Email and variant ID are required');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Invalid email format');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const variant = product.variants.id(variantId);
  if (!variant) {
    res.status(404);
    throw new Error('Variant not found');
  }

  if (variant.stock > 0) {
    return res.status(400).json({
      success: false,
      message: 'This variant is already in stock!'
    });
  }

  // Check compound unique index subscription
  const existingSub = await RestockNotification.findOne({
    product: productId,
    variantId,
    email: email.toLowerCase()
  });

  if (existingSub) {
    if (existingSub.isNotified === false) {
      return res.json({
        success: true,
        alreadySubscribed: true,
        message: 'You are already subscribed to notifications for this item!'
      });
    } else {
      // Re-activate if it was notified previously (out of stock again)
      existingSub.isNotified = false;
      existingSub.notifiedAt = null;
      await existingSub.save();
      return res.json({
        success: true,
        message: 'Alert reactivated! We will email you when this variant is restocked.'
      });
    }
  }

  await RestockNotification.create({
    product: productId,
    variantId,
    size,
    color,
    email: email.toLowerCase()
  });

  res.json({
    success: true,
    message: 'Subscription successful! We will email you when this variant is restocked.'
  });
});

// @DELETE /api/v1/products/:id (admin)
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json({ success: true, message: 'Product deleted' });
});

// @POST /api/v1/products/:id/reviews
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment, photos } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  // User can only review if they have a delivered order containing this product
  // For testing purposes, bypassing this check so we can submit reviews freely.
  /*
  const hasBought = await Order.findOne({
    user: req.user._id,
    status: 'delivered',
    'items.product': product._id
  });

  if (!hasBought) {
    res.status(403);
    throw new Error('You can only review products after they have been delivered to you.');
  }
  */

  const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (alreadyReviewed) { res.status(400); throw new Error('You have already reviewed this product.'); }

  product.reviews.push({ 
    user: req.user._id, 
    name: req.user.name, 
    rating: Number(rating), 
    comment,
    photos: photos || [],
    isApproved: false
  });
  
  // Rating and numReviews are NOT updated yet. 
  // They will be updated when the admin approves the review.
  
  await product.save();
  res.status(201).json({ success: true, message: 'Review submitted and is pending admin approval' });
});

// @PUT /api/v1/products/:id/wishlist
const toggleWishlist = asyncHandler(async (req, res) => {
  const user = req.user;
  const productId = req.params.id;
  const idx = user.wishlist.indexOf(productId);
  if (idx === -1) {
    user.wishlist.push(productId);
  } else {
    user.wishlist.splice(idx, 1);
  }
  await user.save();
  res.json({ success: true, wishlist: user.wishlist });
});

// @GET /api/v1/products/wishlist/details
const getWishlistProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ _id: { $in: req.user.wishlist } }).lean();
  res.json({ success: true, products });
});

// @GET /api/v1/products/:id/related
const getRelatedProducts = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const limit = Number(req.query.limit) || 8;

  // Build a query that finds candidates sharing at least one attribute
  const candidates = await Product.find({
    _id: { $ne: product._id },
    isActive: true,
    $or: [
      { type: product.type },
      { gender: product.gender },
      { brand: product.brand },
      { tags: { $in: product.tags || [] } },
    ],
  }).limit(50).lean();

  // Score each candidate by how closely it relates
  const scored = candidates.map(c => {
    let score = 0;

    // Same clothing type is the strongest signal (e.g. kurta → kurta)
    if (c.type === product.type) score += 3;

    // Same gender ensures relevance (men's → men's)
    if (c.gender === product.gender) score += 2;

    // Same brand means the shopper might like the label
    if (c.brand === product.brand) score += 2;

    // Overlapping tags (e.g. "festive", "cotton", "casual")
    if (product.tags && c.tags) {
      const overlap = c.tags.filter(t => product.tags.includes(t)).length;
      score += overlap;
    }

    // Similar price range (within 40%) — shoppers have a budget
    const priceDiff = Math.abs(c.price - product.price) / product.price;
    if (priceDiff <= 0.4) score += 1;

    return { product: c, score };
  });

  // Sort by score descending, then by rating as tiebreaker
  scored.sort((a, b) => b.score - a.score || b.product.rating - a.product.rating);

  const related = scored.slice(0, limit).map(s => s.product);
  res.json({ success: true, products: related });
});

module.exports = {
  getProducts,
  getFilterOptions,
  getProductById, 
  getProductBySlug, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  addReview, 
  toggleWishlist,
  getWishlistProducts,
  getRelatedProducts,
  subscribeRestockNotification
};
