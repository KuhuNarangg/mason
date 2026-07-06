import { useState, useEffect } from 'react';
import { Navigate, NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, ShoppingCart, LogOut,
  Tags, Ticket, Store, Menu, X, Scissors,
  Award, RotateCcw, Star, BarChart3, Wallet, Settings as SettingsIcon,
  Boxes, UserCog, Film
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/admin/admin-pages.css';

const navItems = [
  { name: 'Dashboard',  path: '/admin',            icon: LayoutDashboard, end: true },
  { name: 'Orders',     path: '/admin/orders',      icon: ShoppingCart },
  { name: 'Products',   path: '/admin/products',    icon: Package },
  { name: 'Categories', path: '/admin/categories',  icon: Tags },
  { name: 'Brands',     path: '/admin/brands',      icon: Award },
  { name: 'Coupons',    path: '/admin/coupons',      icon: Ticket },
  { name: 'Returns',    path: '/admin/returns',      icon: RotateCcw },
  { name: 'Reviews',    path: '/admin/reviews',      icon: Star },
  { name: 'Customers',  path: '/admin/users',        icon: Users },
  { name: 'Vendors',    path: '/admin/vendors',      icon: Store },
  { name: 'Settlements', path: '/admin/settlements', icon: Wallet },
  { name: 'Analytics',  path: '/admin/analytics',    icon: BarChart3 },
  { name: 'Customs',    path: '/admin/customizations', icon: Scissors },
  { name: 'Cinematic',  path: '/admin/homemedia',    icon: Film },
  { name: 'Settings',   path: '/admin/settings',     icon: SettingsIcon },
];

const AdminLayout = () => {
  const { isAuth, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
    return <Navigate to="/login" replace />;
  }

  const displayNavItems = navItems;

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';


  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
      isActive
        ? 'bg-[#C08A74]/15 text-[#C08A74]'
        : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
    }`;

  const renderItem = ({ name, path, icon: Icon, end }) => (
    <NavLink key={name} to={path} end={end} className={navLinkClass} title={name}>
      <Icon size={18} strokeWidth={1.75} />
      <span>{name}</span>
    </NavLink>
  );

  const renderMobileItem = ({ name, path, icon: Icon, end }) => (
    <NavLink
      key={name}
      to={path}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? 'bg-[#C08A74]/15 text-[#C08A74]'
            : 'text-slate-300 hover:text-slate-100 hover:bg-white/5'
        }`
      }
    >
      <Icon size={18} strokeWidth={1.75} />
      <span>{name}</span>
    </NavLink>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans">

      {/* ── Single navbar ── */}
      <header className="h-16 shrink-0 bg-[#0f172a] flex items-center justify-between gap-2 px-3 md:px-6 sticky top-0 z-[200] border-b border-white/10">
        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-200 hover:bg-white/10 shrink-0"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide flex-1 min-w-0">
          {displayNavItems.map(renderItem)}
        </nav>

        {/* User / logout */}
        <div className="flex items-center gap-2 md:gap-3 ml-auto md:ml-0 px-1 md:px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C08A74] to-[#A36B56] flex items-center justify-center text-white font-semibold text-xs shrink-0">
            {initials}
          </div>
          <div className="hidden lg:flex flex-col leading-tight">
            <span className="text-slate-100 text-sm font-semibold">{user?.name || 'Admin'}</span>
            <span className="text-slate-400 text-xs capitalize">{user?.role}</span>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            title="Logout"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* ── Mobile dropdown menu ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[300] flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <nav className="relative w-72 max-w-[80%] h-full bg-[#0f172a] border-r border-white/10 flex flex-col gap-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-sm tracking-wider">MASON</span>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-lg text-slate-300 hover:bg-white/10"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>
            {displayNavItems.map(renderMobileItem)}
            <button
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="flex items-center gap-3 px-4 py-3 mt-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <LogOut size={18} strokeWidth={1.75} />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
