import { Navigate, NavLink, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingCart, LogOut,
  Tags, Ticket, TrendingUp, Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/admin/admin-pages.css';

const navItems = [
  { name: 'Dashboard',   path: '/admin',            icon: LayoutDashboard, end: true },
  { name: 'Orders',      path: '/admin/orders',      icon: ShoppingCart },
  { name: 'Products',    path: '/admin/products',    icon: Package },
  { name: 'Categories',  path: '/admin/categories',  icon: Tags },
  { name: 'Coupons',     path: '/admin/coupons',     icon: Ticket },
  { name: 'Customers',   path: '/admin/users',       icon: Users },
];

const AdminLayout = () => {
  const { isAuth, user, logout } = useAuth();

  if (!isAuth || user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  return (
    <div className="admin-layout">
      {/* ── Sidebar ── */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">
            <TrendingUp size={18} color="white" strokeWidth={2} />
          </div>
          <div>
            <div className="sidebar-logo-text">MASON</div>
            <div className="sidebar-logo-sub">Admin Console</div>
          </div>
        </div>

        {/* Nav */}
        <div className="sidebar-section-label">Main Menu</div>
        <nav className="sidebar-nav">
          {navItems.map(({ name, path, icon: Icon, end }) => (
            <NavLink
              key={name}
              to={path}
              end={end}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <Icon size={18} strokeWidth={1.75} />
              {name}
            </NavLink>
          ))}
        </nav>

        {/* Back to store */}
        <div style={{ padding: '0 1rem 0.5rem' }}>
          <a
            href="/"
            className="sidebar-nav-item"
            style={{ textDecoration: 'none', fontSize: '0.8rem', color: '#475569' }}
          >
            <Store size={16} strokeWidth={1.75} />
            Back to Store
          </a>
        </div>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Admin'}
              </div>
              <div className="sidebar-user-role">{user?.role}</div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#475569', padding: '0.25rem', display: 'flex', alignItems: 'center',
                borderRadius: '4px', transition: 'color 0.15s',
              }}
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
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
