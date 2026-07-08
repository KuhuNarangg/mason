const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seoController');

router.get('/sitemap.xml', seoController.generateSitemapIndex);
router.get('/sitemap-products.xml', seoController.generateProductSitemap);
router.get('/sitemap-collections.xml', seoController.generateCollectionSitemap);
router.get('/feed/google-merchant.xml', seoController.generateGoogleMerchantFeed);

module.exports = router;
