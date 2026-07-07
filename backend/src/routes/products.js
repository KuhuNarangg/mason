const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  getProducts, getFilterOptions, getProductById, getProductBySlug,
  createProduct, updateProduct, deleteProduct,
  addReview, toggleWishlist, getWishlistProducts, getRelatedProducts,
  subscribeRestockNotification
} = require('../controllers/productController');
const { protect, adminOnly, adminOrVendor } = require('../middleware/auth');

const notifyRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many restock notifications requested from this IP. Please try again after 5 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/', getProducts);
router.get('/filters/options', getFilterOptions);
router.get('/wishlist/details', protect, getWishlistProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProductById);
router.post('/', protect, adminOrVendor, createProduct);
router.put('/:id', protect, adminOrVendor, updateProduct);
router.delete('/:id', protect, adminOrVendor, deleteProduct);
router.post('/:id/reviews', protect, addReview);
router.put('/:id/wishlist', protect, toggleWishlist);

// Public route to subscribe to restock notifications, with rate limit protection
router.post('/:id/notify-restock', notifyRateLimiter, subscribeRestockNotification);

module.exports = router;
