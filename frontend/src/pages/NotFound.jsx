import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  return (
    <div className="not-found-page container text-center" style={{ padding: '6rem 1.5rem', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Helmet>
        <title>Page Not Found | Owl Stitch by Mason</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <h1 style={{ fontSize: '4rem', fontWeight: 300, color: 'var(--ink)' }}>404</h1>
      <h2 style={{ fontSize: '2rem', margin: '1rem 0' }}>The Art of Getting Lost</h2>
      <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
        We couldn't find the page you were looking for. It might have been moved, deleted, or perhaps it never existed.
      </p>
      
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary">Return Home</Link>
        <Link to="/catalogue" className="btn btn-outline">Explore Catalogue</Link>
        <Link to="/customisation" className="btn btn-outline">Custom Design</Link>
      </div>
    </div>
  );
};

export default NotFound;
