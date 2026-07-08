const { SitemapStream, streamToPromise } = require('sitemap');
const { create } = require('xmlbuilder2');
const Product = require('../models/Product');
const Category = require('../models/Category');

const FRONTEND_URL = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',')[0] : 'https://www.owlstitch.com';
const BACKEND_URL = process.env.BACKEND_URL || 'https://api.owlstitch.com';

exports.generateSitemapIndex = async (req, res, next) => {
  try {
    const smStream = new SitemapStream({ hostname: BACKEND_URL });
    smStream.write({ url: '/api/v1/seo/sitemap-products.xml' });
    smStream.write({ url: '/api/v1/seo/sitemap-collections.xml' });
    smStream.end();

    const sitemapOutput = await streamToPromise(smStream);
    res.header('Content-Type', 'application/xml');
    res.send(sitemapOutput.toString());
  } catch (err) {
    next(err);
  }
};

exports.generateProductSitemap = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).select('_id updatedAt images');
    
    const smStream = new SitemapStream({ hostname: FRONTEND_URL });
    
    products.forEach(product => {
      const urlItem = {
        url: `/product/${product._id}`,
        changefreq: 'daily',
        priority: 0.8,
        lastmod: product.updatedAt
      };
      
      if (product.images && product.images.length > 0) {
        urlItem.img = product.images.map(img => ({
          url: `${FRONTEND_URL}${img}`
        }));
      }
      
      smStream.write(urlItem);
    });
    
    smStream.end();
    
    const sitemapOutput = await streamToPromise(smStream);
    res.header('Content-Type', 'application/xml');
    res.send(sitemapOutput.toString());
  } catch (err) {
    next(err);
  }
};

exports.generateCollectionSitemap = async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).select('slug updatedAt');
    
    const smStream = new SitemapStream({ hostname: FRONTEND_URL });
    
    // Core pages
    const corePages = ['/', '/about', '/contact', '/shipping', '/returns', '/size-guide', '/care', '/customisation'];
    corePages.forEach(page => {
      smStream.write({ url: page, changefreq: 'weekly', priority: 1.0 });
    });

    categories.forEach(category => {
      smStream.write({
        url: `/category/${category.slug}`,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: category.updatedAt
      });
    });
    
    smStream.end();
    
    const sitemapOutput = await streamToPromise(smStream);
    res.header('Content-Type', 'application/xml');
    res.send(sitemapOutput.toString());
  } catch (err) {
    next(err);
  }
};

exports.generateGoogleMerchantFeed = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true }).populate('category');
    
    const feed = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('rss', { 'xmlns:g': 'http://base.google.com/ns/1.0', version: '2.0' })
        .ele('channel')
          .ele('title').txt('Owl Stitch by Mason Products').up()
          .ele('link').txt(FRONTEND_URL).up()
          .ele('description').txt('Premium Ethnic and Western wear').up();

    products.forEach(product => {
      const item = feed.ele('item');
      item.ele('g:id').txt(product._id.toString()).up();
      item.ele('g:title').txt(product.name).up();
      item.ele('g:description').txt(product.description || product.name).up();
      item.ele('g:link').txt(`${FRONTEND_URL}/product/${product._id}`).up();
      
      if (product.images && product.images[0]) {
        item.ele('g:image_link').txt(`${FRONTEND_URL}${product.images[0]}`).up();
      }
      
      item.ele('g:brand').txt('Owl Stitch').up();
      item.ele('g:condition').txt('new').up();
      item.ele('g:availability').txt(product.stock > 0 ? 'in stock' : 'out of stock').up();
      item.ele('g:price').txt(`${product.price} INR`).up();
      
      if (product.salePrice && product.salePrice < product.price) {
        item.ele('g:sale_price').txt(`${product.salePrice} INR`).up();
      }
      
      if (product.sku) {
        item.ele('g:gtin').txt(product.sku).up(); // or mpn
        item.ele('g:mpn').txt(product.sku).up();
      }
    });

    const xml = feed.end({ prettyPrint: true });
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    next(err);
  }
};
