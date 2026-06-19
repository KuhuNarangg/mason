/**
 * Owl Stitch by Mason — Complete JSON-LD Schema Implementation
 * For MERN Stack (React frontend with react-helmet-async)
 *
 * Install: npm install react-helmet-async
 * Wrap your App in <HelmetProvider> (see bottom of file)
 *
 * Usage:
 *   import { OrganizationSchema, ProductSchema, BlogSchema, ... } from './schema-implementation';
 *   // Then render <OrganizationSchema /> on any page
 */

// ─── GLOBAL SCHEMAS (inject on every page) ────────────────────────────────────

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://owlstitch.com/#organization",
  "name": "Owl Stitch by Mason",
  "alternateName": ["Owl Stitch", "OwlStitch"],
  "url": "https://owlstitch.com",
  "logo": {
    "@type": "ImageObject",
    "url": "https://owlstitch.com/images/logo.png",
    "width": 300,
    "height": 100
  },
  "description": "Owl Stitch by Mason is a premium Indian women's fashion brand based in Rohtak, Haryana. We offer dresses, tops, kurtis, co-ord sets, ethnic wear, western wear, party wear, and more — delivered pan-India.",
  "foundingLocation": {
    "@type": "Place",
    "name": "Rohtak, Haryana, India"
  },
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Rohtak",
    "addressRegion": "Haryana",
    "addressCountry": "IN",
    "postalCode": "124001"
  },
  "contactPoint": [
    {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "areaServed": ["IN", "US", "GB", "CA", "AU"],
      "availableLanguage": ["English", "Hindi"],
      "url": "https://owlstitch.com/contact"
    }
  ],
  "sameAs": [
    "https://www.instagram.com/owlstitchbymason",
    "https://www.facebook.com/owlstitchbymason",
    "https://pinterest.com/owlstitchbymason",
    "https://www.youtube.com/@owlstitchbymason",
    "https://twitter.com/owlstitchbymason"
  ],
  "areaServed": {
    "@type": "Country",
    "name": "India"
  }
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://owlstitch.com/#website",
  "url": "https://owlstitch.com",
  "name": "Owl Stitch by Mason",
  "description": "Premium women's fashion brand from Rohtak, India. Shop dresses, kurtis, co-ord sets, ethnic wear and more.",
  "publisher": {
    "@id": "https://owlstitch.com/#organization"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://owlstitch.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
};

export const brandSchema = {
  "@context": "https://schema.org",
  "@type": "Brand",
  "@id": "https://owlstitch.com/#brand",
  "name": "Owl Stitch by Mason",
  "url": "https://owlstitch.com",
  "logo": "https://owlstitch.com/images/logo.png",
  "description": "Owl Stitch by Mason is a women's fashion brand founded in Rohtak, Haryana, India.",
  "sameAs": [
    "https://www.instagram.com/owlstitchbymason",
    "https://www.facebook.com/owlstitchbymason"
  ]
};

// ─── PRODUCT SCHEMA GENERATOR ────────────────────────────────────────────────

/**
 * Generate Product JSON-LD schema for a product page
 * @param {Object} product - Product data from MongoDB
 * @returns {Object} JSON-LD schema object
 */
export function generateProductSchema(product) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `https://owlstitch.com/products/${product.slug}#product`,
    "name": product.name,
    "description": product.description,
    "image": Array.isArray(product.images)
      ? product.images.map(img => typeof img === 'string' ? img : img.url)
      : [product.image || product.imageUrl],
    "sku": product.sku || product._id.toString(),
    "mpn": product.sku || product._id.toString(),
    "brand": {
      "@type": "Brand",
      "name": "Owl Stitch by Mason",
      "@id": "https://owlstitch.com/#brand"
    },
    "url": `https://owlstitch.com/products/${product.slug}`,
    "offers": {
      "@type": "Offer",
      "url": `https://owlstitch.com/products/${product.slug}`,
      "priceCurrency": "INR",
      "price": product.price,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "availability": product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition",
      "seller": {
        "@type": "Organization",
        "name": "Owl Stitch by Mason",
        "@id": "https://owlstitch.com/#organization"
      },
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": product.price >= 999 ? "0" : "49",
          "currency": "INR"
        },
        "shippingDestination": {
          "@type": "DefinedRegion",
          "addressCountry": "IN"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "handlingTime": {
            "@type": "QuantitativeValue",
            "minValue": 1,
            "maxValue": 2,
            "unitCode": "d"
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": 2,
            "maxValue": 5,
            "unitCode": "d"
          }
        }
      }
    }
  };

  // Add aggregate rating if reviews exist
  if (product.reviewCount > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": product.avgRating || "4.5",
      "reviewCount": product.reviewCount,
      "bestRating": "5",
      "worstRating": "1"
    };
  }

  // Add size variants if available
  if (product.sizes && product.sizes.length > 0) {
    schema.size = product.sizes.join(", ");
  }

  // Add color if available
  if (product.color) {
    schema.color = product.color;
  }

  // Add material/fabric
  if (product.fabric || product.material) {
    schema.material = product.fabric || product.material;
  }

  // Add category
  if (product.category) {
    schema.category = product.category;
  }

  // Add individual reviews
  if (product.reviews && product.reviews.length > 0) {
    schema.review = product.reviews.slice(0, 5).map(review => ({
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating,
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": review.authorName || "Verified Customer"
      },
      "reviewBody": review.comment,
      "datePublished": new Date(review.createdAt).toISOString().split('T')[0]
    }));
  }

  return schema;
}

// ─── BREADCRUMB SCHEMA GENERATOR ────────────────────────────────────────────

/**
 * Generate BreadcrumbList schema
 * @param {Array} breadcrumbs - Array of {name, url} objects
 * @returns {Object} JSON-LD schema object
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url.startsWith('http')
        ? crumb.url
        : `https://owlstitch.com${crumb.url}`
    }))
  };
}

// Example usage:
// generateBreadcrumbSchema([
//   { name: "Home", url: "/" },
//   { name: "Dresses", url: "/dresses" },
//   { name: "Floral Maxi Dress", url: "/products/floral-maxi-dress" }
// ])

// ─── FAQPAGE SCHEMA GENERATOR ────────────────────────────────────────────────

/**
 * Generate FAQPage schema from array of Q&A pairs
 * @param {Array} faqs - Array of {question, answer} objects
 * @returns {Object} JSON-LD schema object
 */
export function generateFAQSchema(faqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// ─── CATEGORY PAGE FAQ DATA ───────────────────────────────────────────────────

export const categoryFAQs = {
  "/dresses": [
    {
      question: "What types of dresses does Owl Stitch by Mason offer?",
      answer: "Owl Stitch offers casual dresses, party dresses, maxi dresses, A-line dresses, wrap dresses, summer dresses, and occasion dresses for women — available in cotton, rayon, georgette, and linen fabrics."
    },
    {
      question: "What is the price range for women's dresses at Owl Stitch?",
      answer: "Women's dresses at Owl Stitch by Mason are priced from ₹599 to ₹2,499, offering styles for every budget from everyday casual wear to special occasion dresses."
    },
    {
      question: "Do you offer free shipping on dresses?",
      answer: "Yes — Owl Stitch by Mason offers free shipping on orders above ₹999. Dresses are delivered pan-India typically within 3-7 business days."
    },
    {
      question: "Are women's dresses available in plus sizes at Owl Stitch?",
      answer: "Yes — Owl Stitch offers women's dresses in sizes from XS to 5XL, with dedicated plus size options designed specifically for larger body types."
    }
  ],
  "/kurtis": [
    {
      question: "What kurti styles does Owl Stitch by Mason offer?",
      answer: "Owl Stitch offers straight-cut kurtis, A-line kurtis, shirt-style kurtis, Anarkali kurtis, and asymmetric hem kurtis in cotton, linen, rayon, and georgette fabrics for daily, office, and festive wear."
    },
    {
      question: "Are kurtis at Owl Stitch suitable for office wear?",
      answer: "Yes — Owl Stitch has a dedicated range of office-appropriate kurtis in structured fabrics like linen and crepe, in professional colours and minimal embellishment designs ideal for Indian workplaces."
    },
    {
      question: "What is the return policy for kurtis?",
      answer: "Owl Stitch offers a 7-day return and exchange policy. If your kurti does not fit or you are not satisfied, you can return it for a full refund or exchange."
    },
    {
      question: "Do you sell kurtis with matching bottoms?",
      answer: "Yes — Owl Stitch offers kurti-palazzo sets, kurti-churidar sets, and ethnic co-ord sets that include a matching bottom. These are available in the Ethnic Wear and Co-Ord Sets collections."
    }
  ],
  "/co-ord-sets": [
    {
      question: "What occasions are co-ord sets from Owl Stitch suitable for?",
      answer: "Owl Stitch co-ord sets are designed for multiple occasions — casual daily wear, office (in structured fabrics), party and evening wear (in georgette or embellished designs), and festive occasions (in ethnic printed or embroidered styles)."
    },
    {
      question: "Can I wear co-ord set pieces separately?",
      answer: "Absolutely — Owl Stitch co-ord set tops and bottoms are designed to also work as separates. Wear the top with jeans or the trousers with a plain tee for completely different outfit combinations."
    },
    {
      question: "What sizes are available in co-ord sets?",
      answer: "Owl Stitch co-ord sets are available in sizes XS through 3XL. Plus size co-ord sets in sizes up to 5XL are available in select styles."
    }
  ]
  // Add FAQ data for remaining categories following the same pattern
};

// ─── BLOG / ARTICLE SCHEMA GENERATOR ─────────────────────────────────────────

/**
 * Generate Article/BlogPosting schema for blog posts
 * @param {Object} post - Blog post data from MongoDB
 * @returns {Object} JSON-LD schema object
 */
export function generateBlogPostSchema(post) {
  const baseUrl = "https://owlstitch.com";
  return {
    "@context": "https://schema.org",
    "@type": post.structuredDataType === "HowTo" ? "HowTo" : "BlogPosting",
    "@id": `${baseUrl}/blog/${post.slug}`,
    "headline": post.seoTitle || post.title,
    "name": post.title,
    "description": post.seoDescription || post.excerpt,
    "image": {
      "@type": "ImageObject",
      "url": post.ogImage ? `${baseUrl}${post.ogImage}` : `${baseUrl}/images/blog-default.jpg`,
      "width": 1200,
      "height": 630
    },
    "url": `${baseUrl}/blog/${post.slug}`,
    "datePublished": new Date(post.publishedAt).toISOString(),
    "dateModified": new Date(post.updatedAt || post.publishedAt).toISOString(),
    "author": {
      "@type": "Person",
      "name": post.authorName || "Owl Stitch Editorial Team",
      "url": `${baseUrl}/about`
    },
    "publisher": {
      "@type": "Organization",
      "name": "Owl Stitch by Mason",
      "@id": `${baseUrl}/#organization`,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/images/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${baseUrl}/blog/${post.slug}`
    },
    "keywords": [post.focusKeyword, ...(post.secondaryKeywords || [])].filter(Boolean).join(", "),
    "articleSection": post.category,
    "wordCount": post.wordCount || 1500,
    "inLanguage": "en-IN"
  };
}

// ─── LOCAL BUSINESS SCHEMA GENERATOR ─────────────────────────────────────────

/**
 * Generate LocalBusiness schema for city landing pages
 * @param {Object} city - City data object
 * @returns {Object} JSON-LD schema
 */
export function generateLocalBusinessSchema(city) {
  return {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "@id": `https://owlstitch.com/#localbusiness-${city.slug}`,
    "name": "Owl Stitch by Mason",
    "description": `Owl Stitch by Mason — women's fashion brand delivering to ${city.name}. Shop dresses, kurtis, co-ord sets, and more.`,
    "url": `https://owlstitch.com/${city.route}`,
    "telephone": "+91-XXXXXXXXXX",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Rohtak",
      "addressRegion": "Haryana",
      "addressCountry": "IN"
    },
    "areaServed": {
      "@type": "City",
      "name": city.name,
      "containedInPlace": {
        "@type": "State",
        "name": city.state
      }
    },
    "priceRange": "₹₹",
    "sameAs": [
      "https://owlstitch.com",
      "https://owlstitch.in"
    ]
  };
}

// ─── ITEMLIST SCHEMA (CATEGORY PAGE) ─────────────────────────────────────────

/**
 * Generate ItemList schema for category listing pages
 * @param {Array} products - Array of product objects
 * @param {string} categoryName - Category name
 * @param {string} categoryUrl - Category URL path
 * @returns {Object} JSON-LD schema
 */
export function generateItemListSchema(products, categoryName, categoryUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": categoryName,
    "url": `https://owlstitch.com${categoryUrl}`,
    "numberOfItems": products.length,
    "itemListElement": products.slice(0, 20).map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": `https://owlstitch.com/products/${product.slug}`,
      "name": product.name,
      "image": product.imageUrl || (product.images && product.images[0])
    }))
  };
}

// ─── SCHEMA COMPONENT FOR REACT (using react-helmet-async) ───────────────────

/**
 * React component to inject multiple JSON-LD schemas at once
 *
 * Usage in React component:
 *
 * import { Helmet } from 'react-helmet-async';
 * import { SchemaInjector, organizationSchema, websiteSchema } from './schema-implementation';
 *
 * // In your component:
 * <Helmet>
 *   <script type="application/ld+json">
 *     {JSON.stringify(organizationSchema)}
 *   </script>
 *   <script type="application/ld+json">
 *     {JSON.stringify(websiteSchema)}
 *   </script>
 * </Helmet>
 */

// ─── GLOBAL SEO COMPONENT (inject on every page) ──────────────────────────────

/**
 * GlobalSEO — inject Organization + WebSite schema on every page
 * Add this to your root layout component
 *
 * import { Helmet } from 'react-helmet-async';
 *
 * export function GlobalSEO() {
 *   return (
 *     <Helmet>
 *       <script type="application/ld+json">
 *         {JSON.stringify(organizationSchema)}
 *       </script>
 *       <script type="application/ld+json">
 *         {JSON.stringify(websiteSchema)}
 *       </script>
 *     </Helmet>
 *   );
 * }
 */

// ─── PRODUCT PAGE SEO COMPONENT ───────────────────────────────────────────────

/**
 * Complete SEO meta + schema for a product page
 *
 * export function ProductPageSEO({ product, breadcrumbs }) {
 *   const productSchema = generateProductSchema(product);
 *   const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
 *
 *   return (
 *     <Helmet>
 *       <title>{product.seoTitle || `${product.name} | Owl Stitch by Mason`}</title>
 *       <meta name="description" content={product.seoDescription || product.description} />
 *       <link rel="canonical" href={`https://owlstitch.com/products/${product.slug}`} />
 *       <meta property="og:title" content={product.name} />
 *       <meta property="og:description" content={product.seoDescription || product.description} />
 *       <meta property="og:image" content={product.images?.[0] || product.imageUrl} />
 *       <meta property="og:url" content={`https://owlstitch.com/products/${product.slug}`} />
 *       <meta property="og:type" content="product" />
 *       <meta property="product:price:amount" content={product.price} />
 *       <meta property="product:price:currency" content="INR" />
 *       <meta name="twitter:card" content="summary_large_image" />
 *       <script type="application/ld+json">{JSON.stringify(productSchema)}</script>
 *       <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
 *     </Helmet>
 *   );
 * }
 */

// ─── BLOG POST SEO COMPONENT ──────────────────────────────────────────────────

/**
 * Complete SEO meta + schema for a blog post page
 *
 * export function BlogPostSEO({ post }) {
 *   const articleSchema = generateBlogPostSchema(post);
 *   const breadcrumbs = generateBreadcrumbSchema([
 *     { name: "Home", url: "/" },
 *     { name: "Blog", url: "/blog" },
 *     { name: post.category, url: `/blog/category/${post.category.toLowerCase().replace(/ /g, '-')}` },
 *     { name: post.title, url: `/blog/${post.slug}` }
 *   ]);
 *   const faqSchema = post.faqSchema?.length
 *     ? generateFAQSchema(post.faqSchema)
 *     : null;
 *
 *   return (
 *     <Helmet>
 *       <title>{post.seoTitle}</title>
 *       <meta name="description" content={post.seoDescription} />
 *       <link rel="canonical" href={`https://owlstitch.com/blog/${post.slug}`} />
 *       <meta property="og:title" content={post.seoTitle} />
 *       <meta property="og:description" content={post.seoDescription} />
 *       <meta property="og:image" content={`https://owlstitch.com${post.ogImage}`} />
 *       <meta property="og:type" content="article" />
 *       <meta name="twitter:card" content="summary_large_image" />
 *       <meta name="author" content={post.authorName || "Owl Stitch Editorial Team"} />
 *       <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
 *       <script type="application/ld+json">{JSON.stringify(breadcrumbs)}</script>
 *       {faqSchema && (
 *         <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
 *       )}
 *     </Helmet>
 *   );
 * }
 */

// ─── CATEGORY PAGE SEO COMPONENT ─────────────────────────────────────────────

/**
 * The categoryMetadata object — import into your category page components
 */
export const categoryMetadata = {
  "/dresses": {
    seoTitle: "Women's Dresses Online India | Shop Stylish Dresses - Owl Stitch",
    seoDescription: "Shop the latest women's dresses online in India. From casual day dresses to elegant party wear — flat shipping, easy returns. Owl Stitch by Mason.",
    h1: "Women's Dresses Online India",
    canonical: "https://owlstitch.com/dresses",
    ogImage: "/images/categories/dresses.jpg"
  },
  "/tops": {
    seoTitle: "Tops for Women Online India | Trendy Women's Tops - Owl Stitch",
    seoDescription: "Explore trendy tops for women online — crop tops, shirts, blouses, and more. Free delivery across India. Shop Owl Stitch by Mason.",
    h1: "Tops for Women Online India",
    canonical: "https://owlstitch.com/tops",
    ogImage: "/images/categories/tops.jpg"
  },
  "/kurtis": {
    seoTitle: "Kurtis for Women Online India | Cotton & Designer Kurtis - Owl Stitch",
    seoDescription: "Buy stylish kurtis for women online — cotton kurtis, designer kurtis, office kurtis & more. Best prices in India. Owl Stitch by Mason.",
    h1: "Kurtis for Women Online India",
    canonical: "https://owlstitch.com/kurtis",
    ogImage: "/images/categories/kurtis.jpg"
  },
  "/co-ord-sets": {
    seoTitle: "Co-Ord Sets for Women Online India | Matching Sets - Owl Stitch",
    seoDescription: "Shop co-ord sets for women — casual, party, and ethnic coordinated sets delivered across India. Owl Stitch by Mason.",
    h1: "Co-Ord Sets for Women Online India",
    canonical: "https://owlstitch.com/co-ord-sets",
    ogImage: "/images/categories/coord-sets.jpg"
  },
  "/western-wear": {
    seoTitle: "Western Wear for Women India | Jeans, Tops & More - Owl Stitch",
    seoDescription: "Explore western wear for women — jeans, tops, jackets, dresses, and more. Trendy fashion delivered across India. Owl Stitch by Mason.",
    h1: "Western Wear for Women India",
    canonical: "https://owlstitch.com/western-wear",
    ogImage: "/images/categories/western-wear.jpg"
  },
  "/ethnic-wear": {
    seoTitle: "Ethnic Wear for Women Online India | Salwar Suits, Kurtis - Owl Stitch",
    seoDescription: "Shop ethnic wear for women — salwar suits, kurtis, ethnic dresses, anarkalis and more. Delivered across India. Owl Stitch by Mason.",
    h1: "Ethnic Wear for Women Online India",
    canonical: "https://owlstitch.com/ethnic-wear",
    ogImage: "/images/categories/ethnic-wear.jpg"
  },
  "/party-wear": {
    seoTitle: "Party Wear for Women India | Party Dresses & Outfits - Owl Stitch",
    seoDescription: "Shop glamorous party wear for women — sequin dresses, off-shoulder tops, party co-ords. Free delivery. Owl Stitch by Mason.",
    h1: "Party Wear for Women India",
    canonical: "https://owlstitch.com/party-wear",
    ogImage: "/images/categories/party-wear.jpg"
  },
  "/casual-wear": {
    seoTitle: "Casual Wear for Women India | Everyday Fashion - Owl Stitch",
    seoDescription: "Discover casual wear for women — comfortable everyday outfits, casual tops, dresses and more. Shop Owl Stitch by Mason.",
    h1: "Casual Wear for Women India",
    canonical: "https://owlstitch.com/casual-wear",
    ogImage: "/images/categories/casual-wear.jpg"
  },
  "/office-wear": {
    seoTitle: "Office Wear for Women India | Professional Women's Clothing - Owl Stitch",
    seoDescription: "Shop professional office wear for women — formals, smart casuals, kurtis for work and more. Owl Stitch by Mason.",
    h1: "Office Wear for Women India",
    canonical: "https://owlstitch.com/office-wear",
    ogImage: "/images/categories/office-wear.jpg"
  },
  "/summer-collection": {
    seoTitle: "Women's Summer Collection India 2026 | Summer Fashion - Owl Stitch",
    seoDescription: "Beat the heat with Owl Stitch's summer collection for women — breezy dresses, cotton tops, shorts and more. Shop India.",
    h1: "Women's Summer Collection 2026",
    canonical: "https://owlstitch.com/summer-collection",
    ogImage: "/images/categories/summer.jpg"
  },
  "/winter-collection": {
    seoTitle: "Women's Winter Collection India 2026 | Winter Fashion - Owl Stitch",
    seoDescription: "Shop Owl Stitch's winter collection for women — coats, sweaters, warm dresses, and layering essentials for India.",
    h1: "Women's Winter Collection 2026",
    canonical: "https://owlstitch.com/winter-collection",
    ogImage: "/images/categories/winter.jpg"
  },
  "/new-arrivals": {
    seoTitle: "New Arrivals in Women's Fashion | Latest Styles - Owl Stitch",
    seoDescription: "Explore the latest new arrivals in women's fashion at Owl Stitch by Mason. Fresh styles added weekly. Shop now.",
    h1: "New Arrivals: Women's Fashion",
    canonical: "https://owlstitch.com/new-arrivals",
    ogImage: "/images/categories/new-arrivals.jpg"
  },
  "/best-sellers": {
    seoTitle: "Best Sellers | Most Popular Women's Fashion - Owl Stitch",
    seoDescription: "Shop the best-selling women's fashion at Owl Stitch — the most loved dresses, tops, kurtis, and co-ord sets in India.",
    h1: "Best Sellers: Women's Fashion",
    canonical: "https://owlstitch.com/best-sellers",
    ogImage: "/images/categories/best-sellers.jpg"
  },
  "/sale": {
    seoTitle: "Women's Fashion Sale India | Up to 70% Off - Owl Stitch",
    seoDescription: "Shop the Owl Stitch sale for women's fashion — up to 70% off on dresses, tops, kurtis, co-ord sets and more. Limited time.",
    h1: "Women's Fashion Sale: Up to 70% Off",
    canonical: "https://owlstitch.com/sale",
    ogImage: "/images/categories/sale.jpg"
  },
  "/plus-size-fashion": {
    seoTitle: "Plus Size Fashion for Women India | Size-Inclusive Clothing - Owl Stitch",
    seoDescription: "Shop plus size fashion for women in India — stylish dresses, tops, kurtis, and co-ord sets in all sizes. Owl Stitch by Mason.",
    h1: "Plus Size Fashion for Women India",
    canonical: "https://owlstitch.com/plus-size-fashion",
    ogImage: "/images/categories/plus-size.jpg"
  }
};

/**
 * CategoryPageSEO component (paste this directly into your category page)
 *
 * import { Helmet } from 'react-helmet-async';
 * import { useLocation } from 'react-router-dom';
 * import { categoryMetadata, generateBreadcrumbSchema, generateFAQSchema, generateItemListSchema, categoryFAQs } from './schema-implementation';
 *
 * export function CategoryPageSEO({ products }) {
 *   const { pathname } = useLocation();
 *   const meta = categoryMetadata[pathname];
 *   if (!meta) return null;
 *
 *   const breadcrumbs = generateBreadcrumbSchema([
 *     { name: "Home", url: "/" },
 *     { name: meta.h1, url: pathname }
 *   ]);
 *   const faqSchema = categoryFAQs[pathname]
 *     ? generateFAQSchema(categoryFAQs[pathname])
 *     : null;
 *   const itemListSchema = products?.length
 *     ? generateItemListSchema(products, meta.h1, pathname)
 *     : null;
 *
 *   return (
 *     <Helmet>
 *       <title>{meta.seoTitle}</title>
 *       <meta name="description" content={meta.seoDescription} />
 *       <link rel="canonical" href={meta.canonical} />
 *       <meta property="og:title" content={meta.seoTitle} />
 *       <meta property="og:description" content={meta.seoDescription} />
 *       <meta property="og:image" content={`https://owlstitch.com${meta.ogImage}`} />
 *       <meta property="og:url" content={meta.canonical} />
 *       <script type="application/ld+json">{JSON.stringify(breadcrumbs)}</script>
 *       {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}
 *       {itemListSchema && <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>}
 *     </Helmet>
 *   );
 * }
 */
