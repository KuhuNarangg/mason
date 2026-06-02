import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Package, ArrowLeft, Scissors } from 'lucide-react';
import "../pages/admin/admin-pages.css"; // Reuse admin styling for consistency

const VendorLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/vendor', icon: <LayoutDashboard size={20} /> },
    { name: 'Orders', path: '/vendor/orders', icon: <Package size={20} /> },
    { name: 'Customs', path: '/vendor/customizations', icon: <Scissors size={20} /> }
  ];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Vendor Portal</h2>
          <span className="admin-role-badge">Vendor</span>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">V</div>
            <div className="admin-user-details">
              <span className="admin-name">{user?.name || 'Vendor'}</span>
              <span className="admin-email">{user?.email || 'vendor@mason.com'}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <Link to="/" className="back-to-store">
              <ArrowLeft size={18} /> Back to Store
            </Link>
          </div>
          <div className="admin-topbar-right">
            <span>Welcome back, {user?.name}</span>
          </div>
        </header>

        <div className="admin-content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default VendorLayout;
