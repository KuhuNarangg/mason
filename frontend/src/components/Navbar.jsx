import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, User, Search, Menu, X, Bell, Package, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useNotifications } from '../context/NotificationContext';
import { useState, useEffect } from 'react';
import './Navbar.css';

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
  const [hideNav, setHideNav] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!isHome && window.scrollY > 0) {
      setScrolled(true);
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      if (currentScrollY > lastScrollY && currentScrollY > 300) {
        setHideNav(true);
      } else {
        setHideNav(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHome, lastScrollY]);

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
      <header className={`m-navbar ${scrolled ? 'is-scrolled' : ''} ${hideNav ? 'is-hidden' : ''} ${isHome ? 'is-home' : ''}`}>
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
            
            <nav className="m-navbar__nav desktop-only">
              <Link to="/category/all?type=dress" className="m-nav-link">Dresses</Link>
              <Link to="/category/all?type=top" className="m-nav-link">Tops</Link>
              <Link to="/category/all?type=trouser" className="m-nav-link">Trousers</Link>
              <Link to="/category/all?type=ethnic" className="m-nav-link">Ethnics</Link>
              <Link to="/category/all?type=westernwear" className="m-nav-link">Westernwear</Link>
            </nav>
          </div>

          {/* Center: Logo */}
          <Link to="/" className="m-navbar__logo-wrap">
            <span className="m-navbar__logo-text">MASON</span>
          </Link>

          {/* Right: Actions */}
          <div className="m-navbar__right">
            <button className="btn-icon" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
              <Search size={20} strokeWidth={1} />
            </button>

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

        {/* Full-screen minimal search overlay */}
        <div className={`m-search-bar ${searchOpen ? 'open' : ''}`}>
          <div className="container d-flex align-center justify-between h-100">
            <div className="d-flex align-center gap-4 w-100">
              <Search size={24} strokeWidth={1} className="text-muted" />
              <input
                type="text"
                placeholder="What are you looking for?"
                className="m-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                autoFocus={searchOpen}
              />
            </div>
            <button className="btn-icon" onClick={() => setSearchOpen(false)}>
              <X size={28} strokeWidth={1} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`m-mobile-veil ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />
      <aside className={`m-mobile-menu ${mobileMenuOpen ? 'show' : ''}`}>
        <div className="m-mobile-menu__head">
          <span className="m-mobile-menu__logo-text">MASON</span>
          <button className="btn-icon" onClick={() => setMobileMenuOpen(false)}>
            <X size={24} strokeWidth={1} />
          </button>
        </div>
        <nav className="m-mobile-menu__nav">
          <Link to="/category/all?type=dress" className="m-mobile-link" onClick={() => setMobileMenuOpen(false)}>Dresses</Link>
          <Link to="/category/all?type=top" className="m-mobile-link" onClick={() => setMobileMenuOpen(false)}>Tops</Link>
          <Link to="/category/all?type=trouser" className="m-mobile-link" onClick={() => setMobileMenuOpen(false)}>Trousers</Link>
          <Link to="/category/all?type=ethnic" className="m-mobile-link" onClick={() => setMobileMenuOpen(false)}>Ethnics</Link>
          <Link to="/category/all?type=westernwear" className="m-mobile-link" onClick={() => setMobileMenuOpen(false)}>Westernwear</Link>
        </nav>
        
        <div className="m-mobile-menu__footer">
          {isAuth ? (
            <>
              {user?.role === 'admin' && (
                <Link to="/admin" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)} style={{ color: '#C08A74', fontWeight: 700 }}>
                  <LayoutDashboard size={16} strokeWidth={1} /> Admin Panel
                </Link>
              )}
              <Link to="/orders" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                <Package size={16} strokeWidth={1} /> My Orders
              </Link>
              <Link to="/profile" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)}>
                <User size={16} strokeWidth={1} /> My Account
              </Link>
              <button onClick={() => { logout(); navigate('/'); setMobileMenuOpen(false); }} className="m-mobile-action">
                <LogOut size={16} strokeWidth={1} /> Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="m-mobile-action" onClick={() => setMobileMenuOpen(false)}>
              <User size={16} strokeWidth={1} /> Sign In
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navbar;
