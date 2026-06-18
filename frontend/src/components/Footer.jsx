import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="m-footer">
      <div className="container">
        
        {/* Main Footer Grid */}
        <div className="m-footer__grid">
          
          {/* Column 1: Brand */}
          <div className="m-footer__col m-footer__col--brand">
            <Link to="/" className="m-footer__logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <img src="/logo-new.png" alt="Mason Logo" style={{ height: '68px', width: 'auto', objectFit: 'contain' }} />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.1 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.65rem', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink)', textTransform: 'uppercase', display: 'block' }}>Owl</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink)', textTransform: 'uppercase', display: 'block' }}>Stitch</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.65rem', fontWeight: 300, fontStyle: 'italic', color: 'var(--ink)', opacity: 0.55, letterSpacing: '0.18em', display: 'block', marginTop: '2px' }}>by Mason</span>
              </div>
            </Link>
            <p className="m-footer__desc">
              Where heritage meets contemporary grace. Uncompromising quality and elevated silhouettes designed for the modern woman.
            </p>
            <div className="m-footer__contact">
              <span><Mail size={16} strokeWidth={1.5} /> customercare@owlstitch.com</span>
              <span><Phone size={16} strokeWidth={1.5} /> +1 (800) 123-4567</span>
              <span><MapPin size={16} strokeWidth={1.5} /> 124 Luxury Ave, NY 10012</span>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="m-footer__col">
            <h4 className="m-footer__title">The Collections</h4>
            <nav className="m-footer__nav">
              <Link to="/category/women">Clothing Edit</Link>
              <Link to="/category/all?type=ethnic">The Heritage Edit</Link>
              <Link to="/category/all?type=party-wear">Evening Glamour</Link>
              <Link to="/category/all?type=indo-western">Modern Fusion</Link>
              <Link to="/category/all">Shop All</Link>
            </nav>
          </div>

          {/* Column 3: Care */}
          <div className="m-footer__col">
            <h4 className="m-footer__title">Client Care</h4>
            <nav className="m-footer__nav">
              <Link to="/faq">FAQ & Contact</Link>
              <Link to="/shipping">Shipping & Delivery</Link>
              <Link to="/returns">Returns & Exchanges</Link>
              <Link to="/size-guide">Size Guide</Link>
              <Link to="/care">Garment Care</Link>
            </nav>
          </div>

          {/* Column 4: About */}
          <div className="m-footer__col">
            <h4 className="m-footer__title">The House</h4>
            <nav className="m-footer__nav">
              <Link to="/about">Our Story</Link>
            </nav>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="m-footer__bottom">
          <p className="m-footer__copyright">&copy; {new Date().getFullYear()} Owl Stitch by Mason. All rights reserved.</p>
          
          <div className="m-footer__social">
            <a href="https://www.instagram.com/dimple.knp" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="#" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="#" aria-label="Pinterest">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </a>
          </div>

          <div className="m-footer__legal">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/t-and-c">Terms & Conditions</Link>
            <Link to="/returns">Return & Refund</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
