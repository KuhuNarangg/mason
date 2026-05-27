const express = require('express');
const router = express.Router();
const {
  createAd,
  getAds,
  getAdById,
  updateAd,
  deleteAd,
  getAdAnalytics,
} = require('../controllers/adController');
const { protect, adminOnly } = require('../middleware/auth');

// ─────────────────────────────────────────
// ADMIN — Ad management (all protected)
// ─────────────────────────────────────────
router.get('/',     protect, adminOnly, getAds);
router.post('/',    protect, adminOnly, createAd);
router.get('/:id',  protect, adminOnly, getAdById);
router.put('/:id',  protect, adminOnly, updateAd);
router.delete('/:id', protect, adminOnly, deleteAd);
router.get('/:id/analytics', protect, adminOnly, getAdAnalytics);

module.exports = router;
