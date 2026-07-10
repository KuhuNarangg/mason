import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  name = "Owl Stitch", 
  type = "website", 
  image = "/og-image.jpg", 
  url, 
  schema, 
  canonical,
  product,
  noindex = false,
  prevPage,
  nextPage
}) => {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.owlstitch.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : fullUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title ? `${title} | ${name}` : name}</title>
      <meta name='description' content={description} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Faceted navigation: noindex filtered/parameterized pages */}
      {noindex && <meta name="robots" content="noindex, follow" />}
      
      {/* Pagination SEO: rel=prev / rel=next */}
      {prevPage && <link rel="prev" href={`${siteUrl}${prevPage}`} />}
      {nextPage && <link rel="next" href={`${siteUrl}${nextPage}`} />}
      
      {/* Hreflang Tags for international SEO strategy */}
      <link rel="alternate" hreflang="en-IN" href={`https://www.owlstitch.in${url || ''}`} />
      <link rel="alternate" hreflang="en-US" href={`https://www.owlstitch.com${url || ''}`} />
      <link rel="alternate" hreflang="x-default" href={`https://www.owlstitch.com${url || ''}`} />

      {/* OpenGraph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title ? `${title} | ${name}` : name} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:site_name" content={name} />

      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title ? `${title} | ${name}` : name} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Pinterest Rich Pins (Product) */}
      {type === 'product' && product && (
        <>
          <meta property="product:price:amount" content={product.salePrice || product.price} />
          <meta property="product:price:currency" content="INR" />
          <meta property="product:brand" content={product.brand || 'Owl Stitch'} />
          <meta property="product:availability" content={product.stock > 0 ? 'in stock' : 'out of stock'} />
        </>
      )}

      {/* Schema.org JSON-LD — supports single schema or an array */}
      {schema && (Array.isArray(schema)
        ? schema.filter(Boolean).map((s, i) => (
            <script key={i} type="application/ld+json">
              {JSON.stringify(s)}
            </script>
          ))
        : (
            <script type="application/ld+json">
              {JSON.stringify(schema)}
            </script>
          )
      )}
    </Helmet>
  );
};

export default SEO;
