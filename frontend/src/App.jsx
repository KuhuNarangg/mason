import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CategoryPage from './pages/CategoryPage';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Contact from './pages/policies/Contact';
import FAQ from './pages/policies/FAQ';
import TandC from './pages/policies/TandC';
import TermsOfUse from './pages/policies/TermsOfUse';
import TrackOrder from './pages/policies/TrackOrder';
import Shipping from './pages/policies/Shipping';
import Returns from './pages/policies/Returns';

// Contexts
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { NotificationProvider } from './context/NotificationContext';

function AdminRedirect() {
  useEffect(() => {
    window.location.href = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
  }, []);
  return <div style={{ padding: '5rem', textAlign: 'center', minHeight: '60vh', marginTop: '80px' }}>Redirecting to Admin Dashboard...</div>;
}

function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <CartProvider>
      <WishlistProvider>
        <NotificationProvider>
          <div className="app-container">
            <ScrollToTop />
            <Navbar />
            <main className={!isHome ? 'pt-navbar' : ''}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/category/:gender" element={<CategoryPage />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/orders/:orderId" element={<Orders />} />
                <Route path="/admin" element={<AdminRedirect />} />
                
                {/* Policy Pages */}
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/t-and-c" element={<TandC />} />
                <Route path="/terms-of-use" element={<TermsOfUse />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/shipping" element={<Shipping />} />
                <Route path="/returns" element={<Returns />} />
              </Routes>
            </main>
            <Footer />
            <MobileBottomNav />
          </div>
        </NotificationProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
