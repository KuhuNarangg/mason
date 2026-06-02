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
import Customization from './pages/Customization';
import Returns from './pages/policies/Returns';
import Privacy from './pages/policies/Privacy';
import About from './pages/About';
import SizeGuide from './pages/policies/SizeGuide';
import GarmentCare from './pages/policies/GarmentCare';

// Admin Components
import { Suspense, lazy } from 'react';

// Lazy load admin and vendor routes to prevent their CSS from leaking into the main app
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductsManagement = lazy(() => import('./pages/admin/ProductsManagement'));
const ProductEdit = lazy(() => import('./pages/admin/ProductEdit'));
const OrdersManagement = lazy(() => import('./pages/admin/OrdersManagement'));
const CategoriesManagement = lazy(() => import('./pages/admin/CategoriesManagement'));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'));
const UserDetail = lazy(() => import('./pages/admin/UserDetail'));
const CouponsManagement = lazy(() => import('./pages/admin/CouponsManagement'));
const CustomizationsManagement = lazy(() => import('./pages/admin/CustomizationsManagement'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));

const VendorLayout = lazy(() => import('./components/VendorLayout'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));

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
          <Route path="/customisation" element={<Customization />} />
          
          {/* Policy Pages */}
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/t-and-c" element={<TandC />} />
          <Route path="/terms-of-use" element={<TermsOfUse />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/privacy" element={<Privacy />} />
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
            {/* Admin Routes */}
            <Route path="/admin/*" element={
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading Admin...</div>}>
                <Routes>
                  <Route path="login" element={<AdminLogin />} />
                  <Route path="" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductsManagement />} />
                    <Route path="products/new" element={<ProductEdit />} />
                    <Route path="products/edit/:id" element={<ProductEdit />} />
                    <Route path="orders" element={<OrdersManagement />} />
                    <Route path="categories" element={<CategoriesManagement />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="users/:id" element={<UserDetail />} />
                    <Route path="coupons" element={<CouponsManagement />} />
                    <Route path="customizations" element={<CustomizationsManagement />} />
                  </Route>
                </Routes>
              </Suspense>
            } />

            {/* Vendor Routes */}
            <Route path="/vendor/*" element={
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading Vendor Portal...</div>}>
                <Routes>
                  <Route element={<VendorLayout />}>
                    <Route path="" element={<VendorDashboard />} />
                    <Route path="orders" element={<OrdersManagement />} />
                    <Route path="customizations" element={<CustomizationsManagement />} />
                  </Route>
                </Routes>
              </Suspense>
            } />

            {/* Main Storefront */}
            <Route path="/*" element={<StorefrontLayout />} />
          </Routes>
        </NotificationProvider>
      </WishlistProvider>
    </CartProvider>
  );
}

export default App;
