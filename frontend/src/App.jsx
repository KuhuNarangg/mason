import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import VendorRegister from './pages/VendorRegister';
import CategoryPage from './pages/CategoryPage';
import StorePage from './pages/StorePage';
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
import Catalogue from './pages/Catalogue';

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
const VendorsManagement = lazy(() => import('./pages/admin/VendorsManagement'));
const VendorDetail = lazy(() => import('./pages/admin/VendorDetail'));
const CouponsManagement = lazy(() => import('./pages/admin/CouponsManagement'));
const CustomizationsManagement = lazy(() => import('./pages/admin/CustomizationsManagement'));
const BrandsManagement = lazy(() => import('./pages/admin/BrandsManagement'));
const ReturnsManagement = lazy(() => import('./pages/admin/ReturnsManagement'));
const ReviewsManagement = lazy(() => import('./pages/admin/ReviewsManagement'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const VendorSettlements = lazy(() => import('./pages/admin/VendorSettlements'));
const PlatformSettings = lazy(() => import('./pages/admin/PlatformSettings'));
const HomeMediaManagement = lazy(() => import('./pages/admin/HomeMediaManagement'));
const RestockAlerts = lazy(() => import('./pages/admin/RestockAlerts'));

const VendorLayout = lazy(() => import('./components/VendorLayout'));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'));
const VendorPending = lazy(() => import('./pages/vendor/VendorPending'));
const VendorSetPassword = lazy(() => import('./pages/vendor/VendorSetPassword'));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'));
const VendorProductForm = lazy(() => import('./pages/vendor/VendorProductForm'));
const VendorInventory = lazy(() => import('./pages/vendor/VendorInventory'));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'));
const VendorOrderDetail = lazy(() => import('./pages/vendor/VendorOrderDetail'));
const VendorEarnings = lazy(() => import('./pages/vendor/VendorEarnings'));
const VendorProfile = lazy(() => import('./pages/vendor/VendorProfile'));

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
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/vendor-register" element={<VendorRegister />} />
          <Route path="/vendor-pending" element={
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
              <VendorPending />
            </Suspense>
          } />
          <Route path="/vendor-set-password/:token" element={
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
              <VendorSetPassword />
            </Suspense>
          } />
          <Route path="/category/:gender" element={<CategoryPage />} />
          <Route path="/store/:slug" element={<StorePage />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<Orders />} />
          <Route path="/customisation" element={<Customization />} />
          <Route path="/customized-dresses" element={<Customization />} />
          <Route path="/custom-couple-tshirts" element={<Customization />} />
          <Route path="/custom-hoodies" element={<Customization />} />
          <Route path="/custom-tshirts" element={<Customization />} />
          
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
                  <Route path="" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="products" element={<ProductsManagement />} />
                    <Route path="products/new" element={<ProductEdit />} />
                    <Route path="products/edit/:id" element={<ProductEdit />} />
                    <Route path="orders" element={<OrdersManagement />} />
                    <Route path="categories" element={<CategoriesManagement />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="users/:id" element={<UserDetail />} />
                    <Route path="vendors" element={<VendorsManagement />} />
                    <Route path="vendors/:id" element={<VendorDetail />} />
                    <Route path="coupons" element={<CouponsManagement />} />
                    <Route path="customizations" element={<CustomizationsManagement />} />
                    <Route path="brands" element={<BrandsManagement />} />
                    <Route path="returns" element={<ReturnsManagement />} />
                    <Route path="reviews" element={<ReviewsManagement />} />
                    <Route path="restock-alerts" element={<RestockAlerts />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="settlements" element={<VendorSettlements />} />
                    <Route path="settings" element={<PlatformSettings />} />
                    <Route path="homemedia" element={<HomeMediaManagement />} />
                  </Route>
                </Routes>
              </Suspense>
            } />

            {/* Vendor Routes */}
            <Route path="/vendor/*" element={
              <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading Vendor...</div>}>
                <Routes>
                  <Route path="" element={<VendorLayout />}>
                    <Route index element={<VendorDashboard />} />
                    <Route path="products" element={<VendorProducts />} />
                    <Route path="products/new" element={<VendorProductForm />} />
                    <Route path="products/edit/:id" element={<VendorProductForm />} />
                    <Route path="orders" element={<VendorOrders />} />
                    <Route path="orders/:id" element={<VendorOrderDetail />} />
                    <Route path="inventory" element={<VendorInventory />} />
                    <Route path="customizations" element={<CustomizationsManagement />} />
                    <Route path="earnings" element={<VendorEarnings />} />
                    <Route path="profile" element={<VendorProfile />} />
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
