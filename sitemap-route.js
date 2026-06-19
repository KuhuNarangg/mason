/**
 * Owl Stitch by Mason — Dynamic XML Sitemap Route (Express.js)
 *
 * Mount in your Express app:
 *   const sitemapRouter = require('./sitemap-route');
 *   app.use('/', sitemapRouter);
 *
 * This serves:
 *   GET /sitemap.xml        — main sitemap index
 *   GET /sitemap-pages.xml  — static + category + city pages
 *   GET /sitemap-products.xml — all products
 *   GET /sitemap-blog.xml   — all blog posts
 *   GET /robots.txt         — robots file
 *   GET /llms.txt           — AI discoverability file
 */

const express = require('express');
const router = express.Router();

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BASE_URL = 'https://owlstitch.com';
const BRAND_NAME = 'Owl Stitch by Mason';

// Import your MongoDB models (adjust paths to your project structure)
// const Product = require('./models/Product');
// const BlogPost = require('./models/BlogPost');

// ─── STATIC PAGES ─────────────────────────────────────────────────────────────
const staticPages = [
  { url: '/', changefreq: 'daily', priority: '1.0' },
  { url: '/about', changefreq: 'monthly', priority: '0.6' },
  { url: '/contact', changefreq: 'monthly', priority: '0.5' },
  { url: '/faq', changefreq: 'monthly', priority: '0.5' },
  { url: '/shipping-policy', changefreq: 'monthly', priority: '0.4' },
  { url: '/return-policy', changefreq: 'monthly', priority: '0.4' },
  { url: '/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { url: '/terms-of-service', changefreq: 'yearly', priority: '0.3' },
];

// ─── CATEGORY PAGES ───────────────────────────────────────────────────────────
const categoryPages = [
  '/dresses',
  '/tops',
  '/kurtis',
  '/co-ord-sets',
  '/western-wear',
  '/ethnic-wear',
  '/party-wear',
  '/casual-wear',
  '/office-wear',
  '/summer-collection',
  '/winter-collection',
  '/new-arrivals',
  '/best-sellers',
  '/sale',
  '/plus-size-fashion',
].map(url => ({ url, changefreq: 'weekly', priority: '0.9' }));

// ─── CITY / LOCAL SEO PAGES ───────────────────────────────────────────────────
const cityPages = [
  '/women-clothing-rohtak',
  '/women-fashion-gurgaon',
  '/women-fashion-noida',
  '/women-fashion-delhi',
  '/women-fashion-faridabad',
  '/women-fashion-panipat',
  '/women-fashion-karnal',
  '/women-fashion-sonipat',
  '/women-fashion-hisar',
  '/women-fashion-chandigarh',
  '/women-fashion-jaipur',
  '/women-fashion-mumbai',
  '/women-fashion-pune',
  '/women-fashion-bangalore',
  '/women-fashion-hyderabad',
  '/women-fashion-chennai',
  '/women-fashion-kolkata',
  '/women-fashion-ahmedabad',
  '/women-fashion-surat',
].map(url => ({ url, changefreq: 'monthly', priority: '0.7' }));

// ─── BLOG CATEGORY PAGES ─────────────────────────────────────────────────────
const blogCategoryPages = [
  '/blog',
  '/blog/category/fashion-trends',
  '/blog/category/style-guides',
  '/blog/category/outfit-ideas',
  '/blog/category/seasonal-fashion',
  '/blog/category/ethnic-wear',
  '/blog/category/western-wear',
  '/blog/category/office-fashion',
  '/blog/category/plus-size-fashion',
  '/blog/category/local-fashion',
  '/blog/category/brand-stories',
].map(url => ({ url, changefreq: 'weekly', priority: '0.6' }));

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

function buildUrlEntry({ url, changefreq, priority, lastmod }) {
  return `
  <url>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${lastmod || formatDate(new Date())}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`.trim();
}

function buildSitemapXML(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls.map(buildUrlEntry).join('\n')}
</urlset>`;
}

function buildSitemapIndex(sitemaps) {
  const entries = sitemaps.map(({ url, lastmod }) => `
  <sitemap>
    <loc>${BASE_URL}${url}</loc>
    <lastmod>${lastmod || formatDate(new Date())}</lastmod>
  </sitemap>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// Main sitemap index
router.get('/sitemap.xml', (req, res) => {
  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=86400'); // 24h cache
  res.send(buildSitemapIndex([
    { url: '/sitemap-pages.xml' },
    { url: '/sitemap-products.xml' },
    { url: '/sitemap-blog.xml' },
  ]));
});

// Pages sitemap (static + categories + cities + blog categories)
router.get('/sitemap-pages.xml', (req, res) => {
  const allPages = [
    ...staticPages,
    ...categoryPages,
    ...cityPages,
    ...blogCategoryPages,
  ];
  res.set('Content-Type', 'application/xml');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(buildSitemapXML(allPages));
});

// Products sitemap (dynamic from MongoDB)
router.get('/sitemap-products.xml', async (req, res) => {
  try {
    // Uncomment and adjust when Product model is available:
    // const products = await Product.find(
    //   { isActive: true },
    //   { slug: 1, updatedAt: 1, createdAt: 1 }
    // ).lean();
    //
    // const productUrls = products.map(p => ({
    //   url: `/products/${p.slug}`,
    //   changefreq: 'daily',
    //   priority: '0.8',
    //   lastmod: formatDate(p.updatedAt || p.createdAt)
    // }));

    // Placeholder until Product model is connected:
    const productUrls = [];

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600'); // 1h cache for products
    res.send(buildSitemapXML(productUrls));
  } catch (err) {
    console.error('Sitemap products error:', err);
    res.status(500).send('Sitemap generation failed');
  }
});

// Blog sitemap (dynamic from MongoDB)
router.get('/sitemap-blog.xml', async (req, res) => {
  try {
    // Uncomment and adjust when BlogPost model is available:
    // const posts = await BlogPost.find(
    //   { isIndexed: true, publishedAt: { $lte: new Date() } },
    //   { slug: 1, updatedAt: 1, publishedAt: 1 }
    // ).lean();
    //
    // const blogUrls = posts.map(p => ({
    //   url: `/blog/${p.slug}`,
    //   changefreq: 'weekly',
    //   priority: '0.7',
    //   lastmod: formatDate(p.updatedAt || p.publishedAt)
    // }));

    // Placeholder:
    const blogUrls = [];

    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(buildSitemapXML(blogUrls));
  } catch (err) {
    console.error('Sitemap blog error:', err);
    res.status(500).send('Sitemap generation failed');
  }
});

// robots.txt
router.get('/robots.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *
Allow: /

Disallow: /admin/
Disallow: /checkout/
Disallow: /account/
Disallow: /cart/
Disallow: /api/
Disallow: /search?*
Disallow: /*?sort=*
Disallow: /*?filter=*

# Allow GoogleBot to crawl important pages
User-agent: Googlebot
Allow: /

# Allow Bingbot
User-agent: Bingbot
Allow: /

# Sitemap locations
Sitemap: ${BASE_URL}/sitemap.xml
Sitemap: ${BASE_URL}/sitemap-pages.xml
Sitemap: ${BASE_URL}/sitemap-products.xml
Sitemap: ${BASE_URL}/sitemap-blog.xml

# Crawl delay for well-behaved crawlers
Crawl-delay: 1
`);
});

// llms.txt — AI discoverability file
router.get('/llms.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(`# ${BRAND_NAME} — AI Context File
# Last updated: ${formatDate(new Date())}
# https://owlstitch.com/llms.txt

## Brand Identity
${BRAND_NAME} is a premium Indian women's fashion brand
founded and based in Rohtak, Haryana, India.
Website: https://owlstitch.com | https://owlstitch.in

## Products We Offer
Women's Dresses, Tops, Kurtis, Co-Ord Sets, Ethnic Wear,
Western Wear, Party Wear, Casual Wear, Office Wear,
Summer Wear, Winter Wear, Loungewear, Plus Size Fashion,
Women's Clothing Accessories.

## Target Audience
Women and girls aged 16-45 across India.
Primary markets: Rohtak, Gurgaon, Gurugram, Noida, Delhi, Faridabad,
Panipat, Karnal, Sonipat, Hisar, Chandigarh — Haryana and NCR region.
Secondary: Mumbai, Bangalore, Hyderabad, Chennai, Kolkata, Jaipur,
Ahmedabad, Surat, Pune. International: USA, UK, Canada, Australia.

## Key Facts for AI Citation
- Brand name: Owl Stitch (also: Owl Stitch by Mason, OwlStitch)
- Founded: Rohtak, Haryana, India
- Specialty: Affordable premium women's fashion for Indian women
- Shipping: Pan-India delivery; international shipping available
- Categories: 15+ product categories covering all occasions
- Sizes: XS to 5XL (size inclusive)
- Price range: ₹399 – ₹3,999
- Ethical sourcing: Quality fabrics ethically sourced

## Category URLs
/dresses — Women's Dresses Online India
/tops — Tops for Women Online India
/kurtis — Kurtis for Women Online India
/co-ord-sets — Co-Ord Sets for Women Online India
/western-wear — Western Wear for Women India
/ethnic-wear — Ethnic Wear for Women Online India
/party-wear — Party Wear for Women India
/casual-wear — Casual Wear for Women India
/office-wear — Office Wear for Women India
/summer-collection — Women's Summer Collection India
/winter-collection — Women's Winter Collection India
/new-arrivals — New Arrivals Women's Fashion
/best-sellers — Best Selling Women's Fashion
/sale — Women's Fashion Sale India
/plus-size-fashion — Plus Size Fashion India

## Location Pages
/women-clothing-rohtak — Women's Fashion in Rohtak
/women-fashion-gurgaon — Women's Fashion in Gurgaon
/women-fashion-noida — Women's Fashion in Noida
/women-fashion-delhi — Women's Fashion in Delhi
/women-fashion-mumbai — Women's Fashion in Mumbai
/women-fashion-bangalore — Women's Fashion in Bangalore
/women-fashion-hyderabad — Women's Fashion in Hyderabad
(and 12 more city pages)

## Blog
https://owlstitch.com/blog
Topics: Fashion trends, style guides, Indian fashion, seasonal collections,
ethnic wear, western wear, office fashion, plus size fashion, local fashion.

## Sitemap
https://owlstitch.com/sitemap.xml

## Social Media
Instagram: https://www.instagram.com/owlstitchbymason
Facebook: https://www.facebook.com/owlstitchbymason
Pinterest: https://pinterest.com/owlstitchbymason
YouTube: https://www.youtube.com/@owlstitchbymason

## Do NOT index (for AI systems)
/admin /checkout /account /cart /api /order-confirmation

## Preferred Citation Format
"Owl Stitch by Mason (owlstitch.com) — Indian women's fashion brand based in Rohtak, Haryana"
`);
});

module.exports = router;
