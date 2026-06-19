/**
 * Owl Stitch by Mason — Blog System SEO Upgrade
 * MERN Stack: MongoDB Model + Express Routes + Utility Functions
 *
 * This file contains:
 * 1. Updated Mongoose BlogPost schema (add SEO fields to existing model)
 * 2. Express API routes for blog (with SEO-aware responses)
 * 3. Reading time calculator
 * 4. Auto-slug generator
 * 5. Related posts query
 * 6. RSS feed route
 */

const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// ─── UPDATED BLOG POST SCHEMA ─────────────────────────────────────────────────
/**
 * Add these fields to your EXISTING BlogPost model.
 * DO NOT replace your current schema — add the SEO fields below to it.
 *
 * Example: In your current models/BlogPost.js, add the seoFields
 * to your existing schema definition.
 */

const seoFields = {
  // ── SEO Meta ──────────────────────────────────────────────────────────────
  seoTitle: {
    type: String,
    maxlength: 60,
    trim: true,
    // If empty, falls back to title in the API response
  },
  seoDescription: {
    type: String,
    maxlength: 160,
    trim: true,
    // If empty, falls back to first 160 chars of content
  },
  canonicalUrl: {
    type: String,
    trim: true,
    // Auto-generated if not set: https://owlstitch.com/blog/{slug}
  },
  ogImage: {
    type: String,
    trim: true,
    // e.g. "/blog/images/post-title.jpg"
  },
  ogImageAlt: {
    type: String,
    trim: true,
  },

  // ── Keyword Targeting ────────────────────────────────────────────────────
  focusKeyword: {
    type: String,
    trim: true,
    lowercase: true,
  },
  secondaryKeywords: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // ── Content Metadata ─────────────────────────────────────────────────────
  readingTimeMinutes: {
    type: Number,
    min: 1,
    // Auto-calculated from content if not set
  },
  wordCount: {
    type: Number,
    // Auto-calculated from content
  },
  excerpt: {
    type: String,
    maxlength: 300,
    trim: true,
    // Auto-generated from content if not set
  },

  // ── Structured Data ───────────────────────────────────────────────────────
  faqSchema: [{
    question: { type: String, required: true },
    answer: { type: String, required: true }
  }],
  structuredDataType: {
    type: String,
    enum: ['Article', 'BlogPosting', 'HowTo', 'FAQPage', 'NewsArticle'],
    default: 'BlogPosting',
  },

  // ── Taxonomy ──────────────────────────────────────────────────────────────
  category: {
    type: String,
    trim: true,
    index: true,
    enum: [
      'Fashion Trends',
      'Style Guides',
      'Outfit Ideas',
      'Seasonal Fashion',
      'Ethnic Wear',
      'Western Wear',
      'Office Fashion',
      'Plus Size Fashion',
      'Local Fashion',
      'Brand Stories',
    ],
    default: 'Fashion Trends',
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],

  // ── Author ────────────────────────────────────────────────────────────────
  authorName: {
    type: String,
    trim: true,
    default: 'Owl Stitch Editorial Team',
  },
  authorBio: {
    type: String,
    trim: true,
  },

  // ── Publishing ────────────────────────────────────────────────────────────
  publishedAt: {
    type: Date,
    index: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
    index: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true,
  },
  isIndexed: {
    type: Boolean,
    default: true,
    // Set to false to noindex a post without deleting it
  },

  // ── Internal Linking ──────────────────────────────────────────────────────
  relatedProductSlugs: [{
    type: String,
    // e.g. ["floral-maxi-dress", "cotton-co-ord-set"]
  }],
  relatedCategoryUrls: [{
    type: String,
    // e.g. ["/dresses", "/co-ord-sets"]
  }],
};

// ─── FULL SCHEMA DEFINITION ───────────────────────────────────────────────────
// If starting fresh OR refactoring your existing model:

const blogPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
    content: { type: String, required: true },  // HTML content
    featuredImage: { type: String, trim: true },

    ...seoFields,
  },
  {
    timestamps: true,  // adds createdAt and updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── VIRTUAL FIELDS ───────────────────────────────────────────────────────────
blogPostSchema.virtual('computedSeoTitle').get(function () {
  return this.seoTitle || `${this.title} | Owl Stitch by Mason`;
});

blogPostSchema.virtual('computedSeoDescription').get(function () {
  if (this.seoDescription) return this.seoDescription;
  if (this.excerpt) return this.excerpt.slice(0, 160);
  // Strip HTML tags and return first 160 chars
  const text = this.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.slice(0, 157) + '...';
});

blogPostSchema.virtual('computedCanonicalUrl').get(function () {
  return this.canonicalUrl || `https://owlstitch.com/blog/${this.slug}`;
});

blogPostSchema.virtual('computedOgImage').get(function () {
  return this.ogImage || this.featuredImage || '/images/blog-default.jpg';
});

// ─── PRE-SAVE MIDDLEWARE ──────────────────────────────────────────────────────
blogPostSchema.pre('save', function (next) {
  // Auto-calculate reading time and word count
  if (this.isModified('content')) {
    const text = this.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = text.split(' ').filter(w => w.length > 0);
    this.wordCount = words.length;
    this.readingTimeMinutes = Math.max(1, Math.ceil(words.length / 200));

    // Auto-excerpt
    if (!this.excerpt) {
      this.excerpt = text.slice(0, 297) + '...';
    }
  }

  // Auto-publishedAt
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// ─── INDEXES ──────────────────────────────────────────────────────────────────
blogPostSchema.index({ category: 1, publishedAt: -1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ isPublished: 1, isIndexed: 1, publishedAt: -1 });
blogPostSchema.index({ isFeatured: 1, isPublished: 1 });
blogPostSchema.index({ focusKeyword: 1 });

// Export the model
// const BlogPost = mongoose.model('BlogPost', blogPostSchema);
// module.exports = BlogPost;

// ─── BLOG API ROUTES ──────────────────────────────────────────────────────────

/**
 * GET /api/blog
 * Returns published blog posts with SEO fields
 * Query params: category, tag, page, limit, featured
 */
router.get('/api/blog', async (req, res) => {
  try {
    const { category, tag, page = 1, limit = 12, featured } = req.query;
    const query = { isPublished: true, publishedAt: { $lte: new Date() } };

    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (featured === 'true') query.isFeatured = true;

    const BlogPost = mongoose.model('BlogPost');
    const [posts, total] = await Promise.all([
      BlogPost.find(query, {
        title: 1, slug: 1, seoTitle: 1, seoDescription: 1, excerpt: 1,
        featuredImage: 1, ogImage: 1, category: 1, tags: 1,
        authorName: 1, publishedAt: 1, readingTimeMinutes: 1, isFeatured: 1
      })
        .sort({ publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean(),
      BlogPost.countDocuments(query)
    ]);

    res.json({
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

/**
 * GET /api/blog/:slug
 * Returns a single blog post with all SEO fields + related posts
 */
router.get('/api/blog/:slug', async (req, res) => {
  try {
    const BlogPost = mongoose.model('BlogPost');
    const post = await BlogPost.findOne({
      slug: req.params.slug,
      isPublished: true,
      publishedAt: { $lte: new Date() }
    }).lean();

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Compute virtual SEO fields
    post.computedSeoTitle = post.seoTitle || `${post.title} | Owl Stitch by Mason`;
    post.computedSeoDescription = post.seoDescription ||
      (post.excerpt ? post.excerpt.slice(0, 160) : '');
    post.computedCanonicalUrl = post.canonicalUrl ||
      `https://owlstitch.com/blog/${post.slug}`;
    post.computedOgImage = post.ogImage || post.featuredImage || '/images/blog-default.jpg';

    // Fetch related posts (same category, excluding current)
    const relatedPosts = await BlogPost.find(
      {
        category: post.category,
        slug: { $ne: post.slug },
        isPublished: true,
        publishedAt: { $lte: new Date() }
      },
      { title: 1, slug: 1, featuredImage: 1, ogImage: 1, excerpt: 1, readingTimeMinutes: 1 }
    )
      .sort({ publishedAt: -1 })
      .limit(3)
      .lean();

    res.json({ post, relatedPosts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

/**
 * GET /api/blog/categories
 * Returns available blog categories with post counts
 */
router.get('/api/blog/categories', async (req, res) => {
  try {
    const BlogPost = mongoose.model('BlogPost');
    const categories = await BlogPost.aggregate([
      { $match: { isPublished: true, publishedAt: { $lte: new Date() } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({ categories: categories.map(c => ({ name: c._id, count: c.count })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ─── RSS FEED ─────────────────────────────────────────────────────────────────
router.get('/feed.xml', async (req, res) => {
  try {
    const BlogPost = mongoose.model('BlogPost');
    const posts = await BlogPost.find(
      { isPublished: true, publishedAt: { $lte: new Date() } },
      { title: 1, slug: 1, seoDescription: 1, excerpt: 1, publishedAt: 1, authorName: 1, category: 1 }
    )
      .sort({ publishedAt: -1 })
      .limit(20)
      .lean();

    const items = posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://owlstitch.com/blog/${post.slug}</link>
      <guid isPermaLink="true">https://owlstitch.com/blog/${post.slug}</guid>
      <description><![CDATA[${post.seoDescription || post.excerpt || ''}]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <author>editorial@owlstitch.com (${post.authorName || 'Owl Stitch Editorial Team'})</author>
      <category>${post.category}</category>
    </item>`).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Owl Stitch by Mason — Women's Fashion Blog</title>
    <link>https://owlstitch.com</link>
    <description>Latest women's fashion trends, style guides, and outfit inspiration from Owl Stitch by Mason — India's premier women's fashion brand.</description>
    <language>en-in</language>
    <managingEditor>editorial@owlstitch.com (Owl Stitch Editorial Team)</managingEditor>
    <webMaster>tech@owlstitch.com (Owl Stitch Tech Team)</webMaster>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://owlstitch.com/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://owlstitch.com/images/logo.png</url>
      <title>Owl Stitch by Mason</title>
      <link>https://owlstitch.com</link>
    </image>
    ${items}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(rss);
  } catch (err) {
    res.status(500).send('RSS feed generation failed');
  }
});

module.exports = router;

// ─── UTILITY: Auto-generate slug from title ───────────────────────────────────
/**
 * generateSlug('Best Kurtis for Office Wear in India')
 * → 'best-kurtis-for-office-wear-in-india'
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

module.exports.generateSlug = generateSlug;
module.exports.seoFields = seoFields;
module.exports.blogPostSchema = blogPostSchema;
