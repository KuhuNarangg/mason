import { NavLink, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Boxes, ShoppingBag, Wallet, UserCog, LogOut, Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/inventory', label: 'Inventory', icon: Boxes },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/earnings', label: 'Earnings', icon: Wallet },
  { to: '/profile', label: 'Profile', icon: UserCog },
];

export default function Layout() {
  const { vendor, logout, loading } = useAuth();

  if (loading) return <div className="page-loading">Loading…</div>;
  if (!vendor) return <Navigate to="/login" replace />;
  if (vendor.vendorStatus !== 'approved') return <Navigate to="/pending" replace />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Store size={22} />
          <span>Vendor Panel</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sidebar-logout" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">{vendor.vendorProfile?.businessName || vendor.name}</div>
          <div className="topbar-user">{vendor.name}</div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
