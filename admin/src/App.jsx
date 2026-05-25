import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, LogOut, Tags, Ticket } from 'lucide-react';
import api from './utils/api';
import toast from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import ProductsManagement from './pages/ProductsManagement';
import ProductEdit from './pages/ProductEdit';
import OrdersManagement from './pages/OrdersManagement';
import CategoriesManagement from './pages/CategoriesManagement';
import UsersManagement from './pages/UsersManagement';
import CouponsManagement from './pages/CouponsManagement';

// Login Page
const Login = ({ setAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'admin') throw new Error('Access denied');
      localStorage.setItem('adminToken', data.token);
      setAuth(true);
      toast.success('Login successful');
    } catch (err) {
      toast.error('Invalid credentials or not an admin');
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 style={{textAlign: 'center', marginBottom: '2rem'}}>Admin Panel</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="form-input" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="form-input" required />
          </div>
          <button type="submit" className="btn">Login</button>
        </form>
      </div>
    </div>
  );
};

const App = () => {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('adminToken'));
  const location = useLocation();

  if (!isAuth) {
    return <Login setAuth={setIsAuth} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuth(false);
  };

  const navs = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20}/> },
    { name: 'Products', path: '/products', icon: <Package size={20}/> },
    { name: 'Orders', path: '/orders', icon: <ShoppingCart size={20}/> },
    { name: 'Categories', path: '/categories', icon: <Tags size={20}/> },
    { name: 'Coupons', path: '/coupons', icon: <Ticket size={20}/> },
    { name: 'Users', path: '/users', icon: <Users size={20}/> },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <span>DIMPLE</span>ADMIN
        </div>
        <nav className="sidebar-nav">
          {navs.map(nav => (
            <Link key={nav.name} to={nav.path} className={`nav-item ${location.pathname === nav.path ? 'active' : ''}`}>
              {nav.icon} {nav.name}
            </Link>
          ))}
        </nav>
      </aside>
      
      <main className="admin-main">
        <header className="admin-header">
          <button onClick={handleLogout} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontWeight: 'bold'}}>
            <LogOut size={20}/> Logout
          </button>
        </header>
        <div className="admin-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products/:id/edit" element={<ProductEdit />} />
            <Route path="/products" element={<ProductsManagement />} />
            <Route path="/orders" element={<OrdersManagement />} />
            <Route path="/categories" element={<CategoriesManagement />} />
            <Route path="/coupons" element={<CouponsManagement />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
