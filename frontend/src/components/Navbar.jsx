import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Search, Menu, X, Bell, Package, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import { useState, useEffect } from 'react';
import './Navbar.css';
import logoImg from '../assets/logo.png';
import api from '../utils/api';

const Navbar = () => {
  const { isAuth, user, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isHome = location.pathname === '/';
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setDbCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to fetch navbar categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const { data } = await api.get(`/products?search=${encodeURIComponent(searchTerm.trim())}&limit=5`);
        setSuggestions(data.products || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Failed to fetch search suggestions', err);
      }
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!isHome && window.scrollY > 0) {
      setScrolled(true);
    }

    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/category/all?search=${searchTerm.trim()}`);
      setSearchTerm('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className={`m-navbar ${scrolled ? 'is-scrolled' : ''} ${isHome ? 'is-home' : ''}`}>
        <div className="m-navbar__inner">
          
          {/* Left: Nav Links */}
          <div className="m-navbar__left">
            <button
              className="btn-icon mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} strokeWidth={1} /> : <Menu size={22} strokeWidth={1} />}
            </button>
            
            {/* Logo removed to keep only middle */}

            <nav className="m-navbar__nav desktop-only">
              <Link to="/catalogue" className="m-nav-link" style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Catalogue</Link>
              
              <div className="m-nav-dropdown-container">
                <button 
                  className="m-nav-link" 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    padding: 'var(--space-2) 0'
                  }}
                >
                  Categories <ChevronDown size={14} />
                </button>
                <div className="m-nav-dropdown-menu">
                  {dbCategories.map(cat => (
                    <Link key={cat._id} to={`/category/all?category=${cat._id}`} className="m-nav-dropdown-item">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
              
              <Link to="/customisation" className="m-nav-link">Customize</Link>
            </nav>
          </div>

          {/* Center: Brand Name */}
          <div className="m-navbar__center" style={{ overflow: 'visible' }}>
            <Link to="/" className="m-navbar__logo-text" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logofinalnobg.png" alt="Mason Logo" className="m-navbar__logo-img-center" style={{ width: 'auto', objectFit: 'contain' }} />
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.1 }}>
                <span className="m-logo-text-owl" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.65rem', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink)', textTransform: 'uppercase', display: 'block' }}>Owl</span>
                <span className="m-logo-text-stitch" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink)', textTransform: 'uppercase', display: 'block' }}>Stitch</span>
                <span className="m-logo-text-by" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.65rem', fontWeight: 300, fontStyle: 'italic', color: 'var(--ink)', opacity: 0.72, letterSpacing: '0.18em', display: 'block', marginTop: '2px', textTransform: 'none' }}>by Mason</span>
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="m-navbar__right">
            <div className="m-search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button className="btn-icon" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
                {searchOpen ? <X size={20} strokeWidth={1} /> : <Search size={20} strokeWidth={1} />}
              </button>
              
              {searchOpen && (
                <div className="m-search-dropdown-box" style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '10px',
                  background: 'var(--ivory, #f9f6f0)',
                  border: '1px solid var(--champagne, #e8dfd8)',
                  borderRadius: '4px',
                  boxShadow: '0 8px 24px rgba(44, 36, 33, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '280px',
                  zIndex: 9999
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}>
                    <input
                      type="text"
                      placeholder="Search for apparel..."
                      className="m-search-input-box"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        color: 'var(--ink, #2c2421)',
                        outline: 'none',
                        width: '100%',
                        padding: '4px 0'
                      }}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={handleSearch}
                      autoFocus
                    />
                    <button 
                      onClick={() => {
                        if (searchTerm.trim()) {
                          navigate(`/category/all?search=${encodeURIComponent(searchTerm.trim())}`);
                          setSearchOpen(false);
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--ink, #2c2421)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                    >
                      <Search size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                  
                  {/* Suggestions List */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--champagne, #e8dfd8)', maxHeight: '350px', overflowY: 'auto' }}>
                      {suggestions.map(item => (
                        <div 
                          key={item._id}
                          onClick={() => {
                            navigate(`/product/${item.slug}`);
                            setSearchOpen(false);
                            setSearchTerm('');
                            setShowSuggestions(false);
                          }}
                          style={{
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--champagne, #e8dfd8)',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--champagne, #e8dfd8)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <img 
                            src={item.thumbnail || (item.images && item.images[0]) || '/placeholder.png'} 
                            alt={item.name} 
                            style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--ink, #2c2421)' }}>
                              {item.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted, #737373)' }}>
                              ₹{item.price?.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div 
                        onClick={() => {
                          if (searchTerm.trim()) {
                            navigate(`/category/all?search=${encodeURIComponent(searchTerm.trim())}`);
                            setSearchOpen(false);
                          }
                        }}
                        style={{
                          padding: '12px',
                          textAlign: 'center',
                          fontSize: '0.85rem',
                          color: 'var(--ink, #2c2421)',
                          cursor: 'pointer',
                          fontWeight: 500,
                          background: 'var(--ivory, #f9f6f0)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                      >
                        See all results
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {isAuth && (
              <div className="m-dropdown-wrap desktop-only">
                <button className="btn-icon">
                  <Bell size={20} strokeWidth={1} />
                  {unreadCount > 0 && <span className="m-badge-dot" />}
                </button>
                <div className="m-dropdown m-dropdown--notif">
                  <div className="m-dropdown__head">
                    <span>Notifications</span>
                    {unreadCount > 0 && <button onClick={markAllRead} className="btn-ghost">Mark read</button>}
                  </div>
                  <div className="m-dropdown__body">
                    {notifications.length === 0 ? (
                      <p className="m-dropdown__empty">No notifications yet</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n._id} className={`m-notif-item ${!n.isRead ? 'unread' : ''}`} onClick={() => { markRead(n._id); if (n.link) navigate(n.link); }}>
                          <p className="m-notif-title">{n.title}</p>
                          <p className="m-notif-msg">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <Link to="/wishlist" className="btn-icon desktop-only" aria-label="Wishlist" style={{ position: 'relative' }}>
              <Heart size={20} strokeWidth={1} />
              {wishlist.length > 0 && (
                <span className="m-cart-count">{wishlist.length}</span>
              )}
            </Link>

            <Link to="/cart" className="btn-icon cart-icon" aria-label="Cart">
              <ShoppingBag size={20} strokeWidth={1} />
              {totalItems > 0 && <span className="m-cart-count">{totalItems}</span>}
            </Link>

            <div className="m-dropdown-wrap desktop-only">
              {isAuth ? (
                <>
                  <button className="btn-icon">
                    <User size={20} strokeWidth={1} />
                  </button>
                  <div className="m-dropdown">
                    {user?.role === 'admin' && (
                      <>
                        <Link to="/admin" className="m-dropdown__link" style={{ color: '#C08A74', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <LayoutDashboard size={14} /> Admin Panel
                        </Link>
                        <div className="m-dropdown__divider" />
                      </>
                    )}
                    {user?.role === 'vendor' && (
                      <>
                        <Link to="/vendor" className="m-dropdown__link" style={{ color: '#C08A74', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <LayoutDashboard size={14} /> Vendor Panel
                        </Link>
                        <div className="m-dropdown__divider" />
                      </>
                    )}
                    <Link to="/profile" className="m-dropdown__link">My Account</Link>
                    <Link to="/orders" className="m-dropdown__link">Orders</Link>
                    <Link to="/wishlist" className="m-dropdown__link">Wishlist</Link>
                    <div className="m-dropdown__divider" />
                    <button onClick={() => { logout(); navigate('/'); }} className="m-dropdown__link logout">
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <Link to="/login" className="btn-icon" aria-label="Login">
                  <User size={20} strokeWidth={1} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Full-screen minimal search overlay removed */}
      </header>

      {/* Mobile Menu */}
      <div className={`m-mobile-veil ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <aside className={`m-mobile-menu ${mobileMenuOpen ? 'show' : ''}`}>
        <div className="m-mobile-menu__head">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logofinalnobg.png" alt="Mason Logo" style={{ height: '88px', width: 'auto', objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', lineHeight: 1.1 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.65rem', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink)', textTransform: 'uppercase', display: 'block' }}>Owl</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontWeight: 600, letterSpacing: '0.18em', color: 'var(--ink)', textTransform: 'uppercase', display: 'block' }}>Stitch</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '0.65rem', fontWeight: 300, fontStyle: 'italic', color: 'var(--ink)', opacity: 0.72, letterSpacing: '0.18em', display: 'block', marginTop: '2px' }}>by Mason</span>
            </div>
          </Link>
          <button className="btn-icon" onClick={() => setMobileMenuOpen(false)}>
            <X size={24} strokeWidth={1} />
          </button>
        </div>
        <nav className="m-mobile-menu__nav">
          <Link to="/catalogue" className="m-mobile-link" onClick={() => setMobileMenuOpen(false)} style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Catalogue</Link>
          
          <div className="m-mobile-dropdown-section">
            <button 
              className="m-mobile-link" 
              onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
              style={{ 
                width: '100%', 
                textAlign: 'left', 
                background: 'none', 
                border: 'none', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <span>Categories</span>
              <ChevronDown 
                size={18} 
                style={{ 
                  transform: mobileCategoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                  transition: 'transform 0.4s var(--ease-expo)' 
                }} 
              />
            </button>
            
            <div className={`m-mobile-submenu ${mobileCategoriesOpen ? 'open' : ''}`}>
              <Link to="/catalogue" className="m-mobile-link sublink" onClick={() => setMobileMenuOpen(false)}>All Categories</Link>
              {dbCategories.map(cat => (
                <Link 
                  key={cat._id} 
                  to={`/category/all?category=${cat._id}`} 
                  className="m-mobile-link sublink" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <Link to="/customisation" className="m-mobile-link" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--rose-gold-dark)', fontWeight: 600 }}>Customise</Link>
        </nav>
        
        <div className="m-mobile-menu__footer">
          {isAuth ? (
            <>
              {user?.role === 'admin' && (
                <Link to="/admin" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)} style={{ color: '#C08A74', fontWeight: 700 }}>
                  <LayoutDashboard size={16} strokeWidth={1} /> Admin Panel
                </Link>
              )}
              {user?.role === 'vendor' && (
                <Link to="/vendor" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)} style={{ color: '#C08A74', fontWeight: 700 }}>
                  <LayoutDashboard size={16} strokeWidth={1} /> Vendor Panel
                </Link>
              )}
              <Link to="/orders" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                <Package size={16} strokeWidth={1} /> My Orders
              </Link>
              <Link to="/wishlist" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                <Heart size={16} strokeWidth={1} /> Wishlist
              </Link>
              <Link to="/profile" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                <User size={16} strokeWidth={1} /> Profile
              </Link>
              <button onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }} className="m-mobile-action">
                <LogOut size={16} strokeWidth={1} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/wishlist" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                <Heart size={16} strokeWidth={1} /> Wishlist
              </Link>
              <Link to="/login" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                <User size={16} strokeWidth={1} /> Sign In
              </Link>
            </>
          )}

          {/* Social Links Section */}
          <div className="m-mobile-social">
            <span className="m-mobile-social__title">Connect With Us</span>
            <div className="m-mobile-social__icons">
              <a 
                href="https://www.instagram.com/owlstitchofficial?igsh=ZjgyeHZ0ajdxN2tr&utm_source=qr" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram"
                className="m-mobile-social__btn m-mobile-social__btn--instagram"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a 
                href="https://www.facebook.com/share/1BiAuAZoDx/?mibextid=wwXIfr" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook"
                className="m-mobile-social__btn m-mobile-social__btn--facebook"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a 
                href="https://www.linkedin.com/company/owl-stitch/" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="LinkedIn"
                className="m-mobile-social__btn m-mobile-social__btn--linkedin"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                  <rect x="2" y="9" width="4" height="12"/>
                  <circle cx="4" cy="4" r="2"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/918168776809" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="WhatsApp"
                className="m-mobile-social__btn m-mobile-social__btn--whatsapp"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navbar;
