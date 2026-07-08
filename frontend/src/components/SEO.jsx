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
  canonical 
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

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
