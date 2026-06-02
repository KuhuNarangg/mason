import { useState, useEffect } from 'react';
import { Navigate, NavLink, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingCart, LogOut,
  Tags, Ticket, TrendingUp, Store, Menu, X, Scissors
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/admin/admin-pages.css';

const navItems = [
  { name: 'Dashboard',  path: '/admin',            icon: LayoutDashboard, end: true },
  { name: 'Orders',     path: '/admin/orders',      icon: ShoppingCart },
  { name: 'Products',   path: '/admin/products',    icon: Package },
  { name: 'Categories', path: '/admin/categories',  icon: Tags },
  { name: 'Coupons',    path: '/admin/coupons',      icon: Ticket },
  { name: 'Customers',  path: '/admin/users',        icon: Users },
  { name: 'Customs',    path: '/admin/customizations', icon: Scissors },
];

const AdminLayout = () => {
  const { isAuth, user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar whenever the route changes (mobile nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  if (!isAuth || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div className="admin-layout">

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`admin-sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>

        {/* Mobile close button */}
        <button
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <TrendingUp size={18} color="white" strokeWidth={2} />
          </div>
          <div className="sidebar-logo-text-wrap">
            <div className="sidebar-logo-text">MASON</div>
            <div className="sidebar-logo-sub">Admin Console</div>
          </div>
        </div>

        {/* Section label */}
        <div className="sidebar-section-label">Main Menu</div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.map(({ name, path, icon: Icon, end }) => (
            <NavLink
              key={name}
              to={path}
              end={end}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
              title={name}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="nav-label">{name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Back to store */}
        <div style={{ padding: '0 1rem 0.5rem' }}>
          <a
            href="/"
            className="sidebar-nav-item"
            style={{ textDecoration: 'none' }}
            title="Back to Store"
          >
            <Store size={16} strokeWidth={1.75} />
            <span className="nav-label">Back to Store</span>
          </a>
        </div>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Admin'}</div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="sidebar-logout-btn"
              onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
              onMouseLeave={e => e.currentTarget.style.color = '#475569'}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="admin-main">

        {/* Mobile topbar */}
        <div className="admin-mobile-topbar">
          <button
            className="mobile-hamburger"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: 28, height: 28, background: 'linear-gradient(135deg,#C08A74,#A36B56)',
              borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={14} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a', letterSpacing: '1px' }}>
              MASON
            </span>
          </div>
          {/* right spacer to keep logo centred */}
          <div style={{ width: 38 }} />
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
