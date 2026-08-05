export const generateOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Owl Stitch by Mason",
    "url": "https://www.owlstitch.com",
    "logo": "https://www.owlstitch.com/logofinalnobg.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+91-816-8776809",
      "contactType": "customer service",
      "email": "customercare@owlstitch.com"
    },
    "sameAs": [
      "https://www.instagram.com/owlstitchofficial?igsh=ZjgyeHZ0ajdxN2tr&utm_source=qr",
      "https://www.facebook.com/share/1BiAuAZoDx/?mibextid=wwXIfr",
      "https://www.linkedin.com/company/owl-stitch/"
    ]
  };
};

export const generateProductSchema = (product) => {
  const url = `https://www.owlstitch.com/product/${product._id}`;
  const image = product.images?.[0] ? `https://www.owlstitch.com${product.images[0]}` : "https://www.owlstitch.com/og-image.jpg";
  
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": image,
    "description": product.description || product.seoDescription,
    "sku": product.sku || product._id,
    "mpn": product.sku || product._id,
    "brand": {
      "@type": "Brand",
      "name": "Owl Stitch"
    },
    "offers": {
      "@type": "Offer",
      "url": url,
      "priceCurrency": "INR",
      "price": product.salePrice || product.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "INR"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "businessDays": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
              "https://schema.org/Monday",
              "https://schema.org/Tuesday",
              "https://schema.org/Wednesday",
              "https://schema.org/Thursday",
              "https://schema.org/Friday"
            ]
          },
          "transitTime": {
            "@type": "QuantitativeValue",
            "minValue": "3",
            "maxValue": "7",
            "unitCode": "d"
          }
        }
      },
      "hasMerchantReturnPolicy": {
        "@type": "MerchantReturnPolicy",
        "applicableCountry": "IN",
        "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
        "merchantReturnDays": "7",
        "returnMethod": "https://schema.org/ReturnByMail",
        "returnFees": "https://schema.org/FreeReturn"
      }
    },
    "aggregateRating": product.rating ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.numReviews || 1
    } : undefined
  };
};

export const generateBreadcrumbSchema = (crumbs) => {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `https://www.owlstitch.com${crumb.path}`
    }))
  };
};

export const generateCollectionSchema = (title, description, url, products) => {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": title,
    "description": description,
    "url": url,
    "mainEntity": {
      "@type": "ItemList",
      "itemListElement": products?.map((p, i) => ({
        "@type": "ListItem",
        "position": i + 1,
        "url": `https://www.owlstitch.com/product/${p._id}`
      })) || []
    }
  };
};

export const generateLocalBusinessSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Owl Stitch by Mason",
    "image": "https://www.owlstitch.com/logo-new.png",
    "@id": "https://www.owlstitch.com",
    "url": "https://www.owlstitch.com",
    "telephone": "+91-816-8776809",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Mall Road",
      "addressLocality": "Kanpur",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "208001",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 26.4499,
      "longitude": 80.3319
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ],
      "opens": "10:00",
      "closes": "21:00"
    }
  };
};

export const generateWebSiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Owl Stitch by Mason",
    "url": "https://www.owlstitch.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://www.owlstitch.com/catalogue?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };
};

export const generateFAQSchema = (faqs) => {
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
};

export const generateProductGroupSchema = (product) => {
  if (!product?.variants || product.variants.length === 0) return null;

  const prices = product.variants.map(v => v.price || product.price).filter(Boolean);
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);

  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    "name": product.name,
    "description": product.description || product.seoDescription,
    "url": `https://www.owlstitch.com/product/${product.slug || product._id}`,
    "brand": {
      "@type": "Brand",
      "name": product.brand || "Owl Stitch"
    },
    "productGroupID": product.sku || product._id,
    "vpiies": "color",
    "hasVariant": product.variants.map(v => ({
      "@type": "Product",
      "name": `${product.name} - ${v.size} / ${v.color}`,
      "color": v.color,
      "size": v.size,
      "sku": `${product.sku || product._id}-${v.size}-${v.color}`,
      "offers": {
        "@type": "Offer",
        "priceCurrency": "INR",
        "price": v.price || product.price,
        "availability": v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      }
    })),
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": lowPrice,
      "highPrice": highPrice,
      "priceCurrency": "INR",
      "offerCount": product.variants.length,
      "availability": product.variants.some(v => v.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };
};

export const generateImageObjectSchema = (product) => {
  if (!product?.images || product.images.length === 0) return null;

  return product.images.map(img => ({
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "contentUrl": img.startsWith('http') ? img : `https://www.owlstitch.com${img}`,
    "name": product.name,
    "description": `${product.name} by ${product.brand || 'Owl Stitch'}`,
    "representativeOfPage": false,
    "creator": {
      "@type": "Organization",
      "name": "Owl Stitch by Mason"
    }
  }));
};
