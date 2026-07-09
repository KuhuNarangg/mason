import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const Sitemap = () => {
  return (
    <div className="container" style={{ padding: '4rem 1.5rem', minHeight: '60vh' }}>
      <SEO 
        title="HTML Sitemap" 
        description="Navigate Owl Stitch by Mason's complete directory of collections, products, customization options, and client care resources." 
        url="/sitemap"
      />
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Sitemap</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
        
        {/* Collections */}
        <div>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>The Collections</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8 }}>
            <li><Link to="/category/all" className="text-muted">Shop All</Link></li>
            <li><Link to="/category/women" className="text-muted">Women's Edit</Link></li>
            <li><Link to="/category/men" className="text-muted">Men's Edit</Link></li>
            <li><Link to="/category/all?type=ethnic" className="text-muted">The Heritage Edit (Ethnic)</Link></li>
            <li><Link to="/category/all?type=party-wear" className="text-muted">Evening Glamour (Party Wear)</Link></li>
            <li><Link to="/category/all?type=indo-western" className="text-muted">Modern Fusion (Indo-Western)</Link></li>
            <li><Link to="/catalogue" className="text-muted">Editorial Catalogue</Link></li>
          </ul>
        </div>

        {/* Customization */}
        <div>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Custom Creations</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8 }}>
            <li><Link to="/customisation" className="text-muted">Customization Studio</Link></li>
            <li><Link to="/customized-dresses" className="text-muted">Custom Dresses</Link></li>
            <li><Link to="/custom-couple-tshirts" className="text-muted">Custom Couple T-Shirts</Link></li>
            <li><Link to="/custom-hoodies" className="text-muted">Custom Hoodies</Link></li>
            <li><Link to="/custom-tshirts" className="text-muted">Custom T-Shirts</Link></li>
            <li><Link to="/customized-kurtis" className="text-muted">Customized Kurtis</Link></li>
            <li><Link to="/custom-tailoring" className="text-muted">Custom Tailoring</Link></li>
            <li><Link to="/personalized-outfits" className="text-muted">Personalized Outfits</Link></li>
          </ul>
        </div>

        {/* Client Care & Authority */}
        <div>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Client Care & Policies</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8 }}>
            <li><Link to="/about" className="text-muted">Our Story (About Us)</Link></li>
            <li><Link to="/contact" className="text-muted">Contact Us</Link></li>
            <li><Link to="/faq" className="text-muted">FAQs</Link></li>
            <li><Link to="/shipping" className="text-muted">Shipping & Delivery</Link></li>
            <li><Link to="/returns" className="text-muted">Returns & Exchanges</Link></li>
            <li><Link to="/size-guide" className="text-muted">Size Guide</Link></li>
            <li><Link to="/care" className="text-muted">Garment Care</Link></li>
            <li><Link to="/fabric-guide" className="text-muted">Fabric Guide</Link></li>
            <li><Link to="/customization-process" className="text-muted">Customization Process</Link></li>
            <li><Link to="/privacy" className="text-muted">Privacy Policy</Link></li>
            <li><Link to="/t-and-c" className="text-muted">Terms & Conditions</Link></li>
          </ul>
        </div>

        {/* User Account */}
        <div>
          <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Account & Services</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: 1.8 }}>
            <li><Link to="/login" className="text-muted">Sign In</Link></li>
            <li><Link to="/register" className="text-muted">Create Account</Link></li>
            <li><Link to="/cart" className="text-muted">Shopping Bag</Link></li>
            <li><Link to="/wishlist" className="text-muted">Wishlist</Link></li>
            <li><Link to="/track-order" className="text-muted">Track Order</Link></li>
            <li><Link to="/vendor-register" className="text-muted">Become a Partner</Link></li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Sitemap;
