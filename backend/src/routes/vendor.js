const express = require('express');
const router = express.Router();
const {
  getProfile, updateProfile, getDashboard,
  getMyProducts, getMyProductById, createProduct, updateProduct, deleteProduct, toggleProductActive,
  getInventory, updateVariantStock,
  getVendorOrders, getVendorOrderById, updateItemStatus, updateItemTracking, updateOrderBill,
  getEarnings, getInvoices,
  getStoreBySlug,
} = require('../controllers/vendorController');
const { protect, vendorOnly, approvedVendor } = require('../middleware/auth');

/* Public storefront — vendor's public store page (no auth required) */
router.get('/store/:slug', getStoreBySlug);

// All vendor routes below require a logged-in vendor account
router.use(protect, vendorOnly);

/* Profile — accessible even while pending approval, so vendor can complete details */
router.get('/profile',    getProfile);
router.put('/profile',    updateProfile);
router.get('/dashboard',  getDashboard);

/* Everything below requires an approved vendor account */
router.use(approvedVendor);

/* Products */
router.get('/products',                     getMyProducts);
router.get('/products/:id',                 getMyProductById);
router.post('/products',                    createProduct);
router.put('/products/:id',                 updateProduct);
router.delete('/products/:id',              deleteProduct);
router.put('/products/:id/toggle-active',   toggleProductActive);

/* Inventory */
router.get('/inventory',                                  getInventory);
router.put('/inventory/:productId/variants/:variantId',   updateVariantStock);

/* Orders */
router.get('/orders',                                getVendorOrders);
router.get('/orders/:id',                            getVendorOrderById);
router.put('/orders/:id/items/:itemId/status',       updateItemStatus);
router.put('/orders/:id/items/:itemId/tracking',     updateItemTracking);
router.put('/orders/:id/bill',                       updateOrderBill);

/* Earnings */
router.get('/earnings',           getEarnings);
router.get('/earnings/invoices',  getInvoices);

module.exports = router;
