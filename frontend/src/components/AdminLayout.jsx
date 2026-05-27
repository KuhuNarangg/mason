import { Navigate, Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, Tags, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/admin/admin-pages.css';

const AdminLayout = () => {
  const { isAuth, user, logout } = useAuth();
  const location = useLocation();

  if (!isAuth || user?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const navs = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20}/> },
    { name: 'Products', path: '/admin/products', icon: <Package size={20}/> },
    { name: 'Orders', path: '/admin/orders', icon: <ShoppingCart size={20}/> },
    { name: 'Categories', path: '/admin/categories', icon: <Tags size={20}/> },
    { name: 'Coupons', path: '/admin/coupons', icon: <Ticket size={20}/> },
    { name: 'Users', path: '/admin/users', icon: <Users size={20}/> },
  ];

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', display: 'flex' }}>
      <aside className="admin-sidebar" style={{ width: '250px', background: '#1c1c1c', color: 'white' }}>
        <div className="sidebar-header" style={{ padding: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
          <span>MASON</span> ADMIN
        </div>
        <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
          {navs.map(nav => {
            const isActive = location.pathname === nav.path || (nav.path !== '/admin' && location.pathname.startsWith(nav.path));
            return (
              <Link 
                key={nav.name} 
                to={nav.path} 
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  color: isActive ? 'white' : '#9ca3af',
                  background: isActive ? '#374151' : 'transparent',
                }}
              >
                {nav.icon} {nav.name}
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
        <header className="admin-header" style={{ padding: '1rem 2rem', background: 'white', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid #eee' }}>
          <button 
            onClick={logout} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontWeight: 'bold' }}
          >
            <LogOut size={20}/> Logout
          </button>
        </header>
        <div className="admin-content" style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
