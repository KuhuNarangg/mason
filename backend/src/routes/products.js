const express = require('express');
const router = express.Router();
const {
  getProducts, getProductById, getProductBySlug,
  createProduct, updateProduct, deleteProduct,
  addReview, toggleWishlist, getWishlistProducts, getRelatedProducts
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/wishlist/details', protect, getWishlistProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id/related', getRelatedProducts);
router.get('/:id', getProductById);
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.post('/:id/reviews', protect, addReview);
router.put('/:id/wishlist', protect, toggleWishlist);

module.exports = router;
