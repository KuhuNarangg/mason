import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

// Common Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import ScrollToTop from './components/ScrollToTop';

// Store Pages
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
import About from './pages/About';
import SizeGuide from './pages/policies/SizeGuide';
import GarmentCare from './pages/policies/GarmentCare';

// Admin Components
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import ProductsManagement from './pages/admin/ProductsManagement';
import ProductEdit from './pages/admin/ProductEdit';
import OrdersManagement from './pages/admin/OrdersManagement';
import CategoriesManagement from './pages/admin/CategoriesManagement';
import UsersManagement from './pages/admin/UsersManagement';
import UserDetail from './pages/admin/UserDetail';
import CouponsManagement from './pages/admin/CouponsManagement';
import AdminLogin from './pages/admin/AdminLogin';

// Contexts
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { NotificationProvider } from './context/NotificationContext';

const StorefrontLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-container">
      <Navbar />
      <main className="pt-navbar">
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
          
          {/* Policy Pages */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/t-and-c" element={<TandC />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/about" element={<About />} />
          <Route path="/size-guide" element={<SizeGuide />} />
          <Route path="/care" element={<GarmentCare />} />
        </Routes>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
};

function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <NotificationProvider>
          <ScrollToTop />
          <Routes>
            {/* Admin Login — outside the protected layout */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Portal — requires admin role */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="products/:id/edit" element={<ProductEdit />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="coupons" element={<CouponsManagement />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="users/:id" element={<UserDetail />} />
            </Route>

            {/* Main Storefront */}
            <Route path="/*" element={<StorefrontLayout />} />
          </Routes>
        </NotificationProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
