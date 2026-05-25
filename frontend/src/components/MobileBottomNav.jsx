import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './MobileBottomNav.css';

const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = useCart();
  const { user } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setHidden(currentY > lastScrollY && currentY > 100);
      setLastScrollY(currentY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Don't show on checkout/login/register
  const hiddenPaths = ['/checkout', '/login', '/register', '/admin'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <>
      {/* Search Overlay */}
      {showSearch && (
        <div className="mobile-search-overlay" onClick={() => setShowSearch(false)}>
          <form className="mobile-search-bar" onClick={(e) => e.stopPropagation()} onSubmit={handleSearch}>
            <Search size={20} className="mobile-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for kurtas, shirts, dresses..."
              autoFocus
              className="mobile-search-input"
            />
            <button type="submit" className="mobile-search-submit">Go</button>
          </form>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className={`mobile-bottom-nav ${hidden ? 'nav-hidden' : ''}`}>
        <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
          <Home size={22} strokeWidth={isActive('/') ? 2.5 : 1.8} />
          <span>Home</span>
        </Link>

        <button className={`bottom-nav-item ${showSearch ? 'active' : ''}`} onClick={() => setShowSearch(true)}>
          <Search size={22} strokeWidth={1.8} />
          <span>Search</span>
        </button>

        <Link to="/wishlist" className={`bottom-nav-item ${isActive('/wishlist') ? 'active' : ''}`}>
          <Heart size={22} strokeWidth={isActive('/wishlist') ? 2.5 : 1.8} />
          <span>Wishlist</span>
        </Link>

        <Link to="/cart" className={`bottom-nav-item ${isActive('/cart') ? 'active' : ''}`}>
          <div className="bottom-nav-cart-wrap">
            <ShoppingBag size={22} strokeWidth={isActive('/cart') ? 2.5 : 1.8} />
            {cartCount > 0 && <span className="bottom-nav-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
          </div>
          <span>Cart</span>
        </Link>

        <Link 
          to={user ? '/profile' : '/login'} 
          className={`bottom-nav-item ${isActive('/profile') ? 'active' : ''}`}
        >
          <User size={22} strokeWidth={isActive('/profile') ? 2.5 : 1.8} />
          <span>{user ? 'Account' : 'Login'}</span>
        </Link>
      </nav>
    </>
  );
};

export default MobileBottomNav;
