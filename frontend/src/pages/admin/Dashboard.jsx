import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Package, Users, ArrowRight,
  AlertTriangle, Eye, X, IndianRupee, Tags, Ticket,
  PlusCircle, Store, Clock, UserCheck, RotateCcw,
  TrendingUp, Sparkles, AlertCircle
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* ── Status helpers ─────────────────────────────────────── */
const statusClass = {
  pending: 'badge-pending', confirmed: 'badge-confirmed',
  processing: 'badge-processing', shipped: 'badge-shipped',
  delivered: 'badge-delivered', cancelled: 'badge-cancelled',
  cancel_requested: 'badge-cancel_requested',
  return_requested: 'badge-return_requested',
  returned: 'badge-returned', return_rejected: 'badge-return_rejected',
};

const statusLabel = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
  cancel_requested: 'Cancel Request', return_requested: 'Return Request',
  returned: 'Returned', return_rejected: 'Return Rejected',
};

/* ── Stock Modal ───────────────────────────────────────── */
const StockModal = ({ product, onClose }) => {
  if (!product) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:'16px', width:'100%', maxWidth:'480px', maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:800, color:'#0f172a' }}>Stock Details</h3>
            <p style={{ margin:0, fontSize:'0.78rem', color:'#94a3b8', marginTop:'2px' }}>{product.name}</p>
          </div>
          <button onClick={onClose} className="btn-icon-sm"><X size={18} /></button>
        </div>
        <div style={{ overflowY:'auto', padding:'1.25rem 1.5rem' }}>
          <table className="admin-table" style={{ border:'none', boxShadow:'none' }}>
            <thead>
              <tr>
                <th>Size</th>
                <th>Color</th>
                <th style={{ textAlign:'right' }}>Stock</th>
              </tr>
            </thead>
            <tbody>
              {product.variants.map((v, i) => (
                <tr key={i}>
                  <td><span className="tag-badge" style={{ background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>{v.size}</span></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      <div style={{ width:12, height:12, borderRadius:'50%', background: v.colorHex||'#000', border:'1px solid #e2e8f0', flexShrink:0 }} />
                      {v.color}
                    </div>
                  </td>
                  <td style={{ textAlign:'right' }}>
                    <span className={`status-badge ${v.stock === 0 ? 'badge-critical' : v.stock <= 3 ? 'badge-low-stock' : 'badge-ok'}`} style={{ float:'right' }}>
                      {v.stock}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} className="btn-cancel">Close</button>
        </div>
      </div>
    </div>
  );
};

/* ── Hub Button ────────────────────────────────────────── */
const HubBtn = ({ to, label, icon: Icon }) => (
  <Link to={to} className="hub-btn">
    {Icon && <Icon size={16} strokeWidth={2} />}
    <span>{label}</span>
    <ArrowRight size={14} strokeWidth={2} className="hub-btn-arrow" />
  </Link>
);

/* ── Dashboard Component ───────────────────────────────── */
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [stockModal, setStockModal] = useState(null);
  const [failedPayments, setFailedPayments] = useState([]);
  const [convertModal, setConvertModal] = useState(null); // order to manually confirm
  const [convertNote, setConvertNote] = useState('');
  const [convertPid, setConvertPid] = useState('');
  const [converting, setConverting] = useState(false);
  
  // Trend line chart toggle: 'revenue' | 'orders'
  const [trendMode, setTrendMode] = useState('revenue');

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setStats(res.data)).catch(console.error);
    api.get('/admin/failed-payments').then(res => setFailedPayments(res.data.orders || [])).catch(() => {});
  }, []);

  const totalRevenue30 = useMemo(() => {
    if (!stats?.last30Days) return 0;
    return stats.last30Days.reduce((s, d) => s + d.revenue, 0);
  }, [stats]);

  const totalOrders30 = useMemo(() => {
    if (!stats?.last30Days) return 0;
    return stats.last30Days.reduce((s, d) => s + (d.orders || 0), 0);
  }, [stats]);

  const handleManualConfirm = async () => {
    if (!convertModal) return;
    setConverting(true);
    try {
      await api.post(`/admin/orders/${convertModal._id}/manual-confirm`, {
        note: convertNote, paymentId: convertPid,
      });
      setFailedPayments(prev => prev.filter(o => o._id !== convertModal._id));
      setConvertModal(null); setConvertNote(''); setConvertPid('');
      toast.success('Order manually confirmed ✓');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm order');
    } finally {
      setConverting(false);
    }
  };

  // 8 KPI configuration
  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      {
        label: 'Total Revenue',
        value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`,
        category: 'Financial',
        icon: IndianRupee,
        themeColor: '#C08A74',
        themeRgb: '192, 138, 116',
        bgGradient: 'linear-gradient(135deg, rgba(192, 138, 116, 0.12) 0%, rgba(192, 138, 116, 0.04) 100%)',
        link: '/admin/analytics',
      },
      {
        label: 'Total Orders',
        value: stats.totalOrders || 0,
        category: 'Sales',
        icon: ShoppingCart,
        themeColor: '#3b82f6',
        themeRgb: '59, 130, 246',
        bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.04) 100%)',
        link: '/admin/orders',
      },
      {
        label: 'Total Customers',
        value: stats.totalUsers || 0,
        category: 'Customers',
        icon: Users,
        themeColor: '#10b981',
        themeRgb: '16, 185, 129',
        bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.04) 100%)',
        link: '/admin/users',
      },
      {
        label: 'Total Vendors',
        value: stats.totalVendors || 0,
        category: 'Vendors',
        icon: Store,
        themeColor: '#8b5cf6',
        themeRgb: '139, 92, 246',
        bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.04) 100%)',
        link: '/admin/vendors',
      },
      {
        label: 'Total Products',
        value: stats.totalProducts || 0,
        category: 'Inventory',
        icon: Package,
        themeColor: '#ec4899',
        themeRgb: '236, 72, 153',
        bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(236, 72, 153, 0.04) 100%)',
        link: '/admin/products',
      },
      {
        label: 'Pending Orders',
        value: stats.pendingOrders || 0,
        category: 'Sales',
        icon: Clock,
        themeColor: '#f59e0b',
        themeRgb: '245, 158, 11',
        bgGradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
        link: '/admin/orders?status=pending',
      },
      {
        label: 'Pending Vendors',
        value: stats.pendingVendorApprovals || 0,
        category: 'Moderation',
        icon: UserCheck,
        themeColor: '#06b6d4',
        themeRgb: '6, 182, 212',
        bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(6, 182, 212, 0.04) 100%)',
        link: '/admin/vendors?status=pending',
      },
      {
        label: 'Return Requests',
        value: stats.returnRequestsCount || 0,
        category: 'Moderation',
        icon: RotateCcw,
        themeColor: '#ef4444',
        themeRgb: '239, 68, 68',
        bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.04) 100%)',
        link: '/admin/orders?status=return_requested',
      },
    ];
  }, [stats]);

  // Chart data calculations
  const last30DaysSorted = useMemo(() => {
    if (!stats?.last30Days) return [];
    return [...stats.last30Days].sort((a, b) => (a._id || '').localeCompare(b._id || ''));
  }, [stats]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  const lineChartData = useMemo(() => {
    return {
      labels: last30DaysSorted.map(d => formatDate(d._id || d.date)),
      datasets: [
        {
          label: trendMode === 'revenue' ? 'Revenue (₹)' : 'Orders Count',
          data: last30DaysSorted.map(d => trendMode === 'revenue' ? d.revenue : (d.orders || 0)),
          borderColor: trendMode === 'revenue' ? '#C08A74' : '#3b82f6',
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            if (trendMode === 'revenue') {
              gradient.addColorStop(0, 'rgba(192, 138, 116, 0.35)');
              gradient.addColorStop(1, 'rgba(192, 138, 116, 0.01)');
            } else {
              gradient.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
              gradient.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
            }
            return gradient;
          },
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointBackgroundColor: trendMode === 'revenue' ? '#C08A74' : '#3b82f6',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: trendMode === 'revenue' ? '#C08A74' : '#3b82f6',
          pointRadius: 2,
          pointHoverRadius: 5,
        }
      ]
    };
  }, [last30DaysSorted, trendMode]);

  const lineChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#94a3b8',
          bodyColor: '#fff',
          padding: 10,
          borderRadius: 8,
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                if (trendMode === 'revenue') {
                  label += '₹' + context.parsed.y.toLocaleString('en-IN');
                } else {
                  label += context.parsed.y + ' orders';
                }
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748b', font: { size: 9 } }
        },
        y: {
          grid: { color: '#f1f5f9' },
          ticks: {
            color: '#64748b',
            font: { size: 9 },
            callback: (value) => {
              if (trendMode === 'revenue') {
                return '₹' + (value >= 1000 ? (value / 1000) + 'k' : value);
              }
              return value;
            }
          }
        }
      }
    };
  }, [trendMode]);

  const topProductsSorted = useMemo(() => {
    if (!stats?.topProducts) return [];
    return [...stats.topProducts].sort((a, b) => b.totalSold - a.totalSold);
  }, [stats]);

  const barChartData = useMemo(() => {
    return {
      labels: topProductsSorted.map(p => p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name),
      datasets: [
        {
          label: 'Units Sold',
          data: topProductsSorted.map(p => p.totalSold),
          backgroundColor: 'rgba(192, 138, 116, 0.85)',
          hoverBackgroundColor: '#C08A74',
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 14,
        }
      ]
    };
  }, [topProductsSorted]);

  const barChartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        padding: 10,
        borderRadius: 8,
      }
    },
    scales: {
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { color: '#64748b', font: { size: 9 } }
      },
      y: {
        grid: { display: false },
        ticks: { color: '#0f172a', font: { size: 9, weight: 600 } }
      }
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Welcome Admin, Mason</h1>
          <p className="admin-page-subtitle">Real-time overview and operations dashboard for Dimple Fashion.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="btn-outline-sm" style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', textDecoration:'none', color:'#475569', border:'1px solid #cbd5e1', padding:'0.5rem 1rem', borderRadius:'8px', background:'white', fontSize:'0.8rem', fontWeight:600 }}>
          <Store size={14} /> View Store
        </a>
      </div>

      {/* ── Return Requests Alert ── */}
      {stats?.returnRequestsCount > 0 && (
        <div className="admin-alert warning" style={{ marginBottom: '1.5rem', background: '#fffbeb', borderLeft: '4px solid #f59e0b', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="admin-alert-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={20} color="#d97706" />
            <span style={{ fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>
              {stats.returnRequestsCount === 1
                ? '1 pending return request needs admin moderation'
                : `${stats.returnRequestsCount} pending return requests need admin moderation`}
            </span>
          </div>
          <Link to="/admin/orders?status=return_requested"
            style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.825rem', fontWeight:700, color:'#b45309', textDecoration:'none', whiteSpace:'nowrap' }}>
            Review Returns <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Quick Action Banner ── */}
      <div className="quick-action-banner">
        <div className="quick-action-content">
          <div className="quick-action-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="quick-action-title">Operations Control Center</h3>
            <p className="quick-action-desc">Add new inventory, approve vendor profiles, review customer complaints, or customize pricing.</p>
          </div>
        </div>
        <Link to="/admin/products?add=true" className="quick-action-button">
          <PlusCircle size={16} />
          <span>Add New Product</span>
        </Link>
      </div>

      {/* ── KPI Stats Grid ── */}
      {stats ? (
        <div className="premium-kpi-grid">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={idx}
                to={kpi.link}
                className="premium-kpi-card"
                style={{
                  '--kpi-theme-color': kpi.themeColor,
                  '--kpi-theme-rgb': kpi.themeRgb,
                  '--kpi-bg-gradient': kpi.bgGradient,
                  textDecoration: 'none'
                }}
              >
                <div className="premium-kpi-header">
                  <div className="premium-kpi-icon-wrap">
                    <Icon size={20} />
                  </div>
                  <span className="premium-kpi-category-badge">{kpi.category}</span>
                </div>
                <div className="premium-kpi-body">
                  <div className="premium-kpi-value">{kpi.value}</div>
                  <div className="premium-kpi-label">{kpi.label}</div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="admin-loading" style={{ margin: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width:24, height:24, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Initializing system diagnostics…</span>
        </div>
      )}

      {/* ── Interactive Charts Grid ── */}
      {stats && (
        <div className="premium-dashboard-grid">
          {/* Daily Trend Line Chart */}
          <div className="premium-chart-card">
            <div className="premium-chart-header">
              <div>
                <h3 className="premium-chart-title">
                  <TrendingUp size={18} color="#C08A74" />
                  Sales &amp; Revenue trend
                </h3>
                <p className="premium-chart-subtitle">
                  Last 30 Days: {trendMode === 'revenue' 
                    ? `₹${totalRevenue30.toLocaleString('en-IN')} total revenue` 
                    : `${totalOrders30} total orders`}
                </p>
              </div>
              <div className="premium-chart-toggles">
                <button
                  onClick={() => setTrendMode('revenue')}
                  className={`premium-chart-toggle-btn ${trendMode === 'revenue' ? 'active' : ''}`}
                >
                  Revenue
                </button>
                <button
                  onClick={() => setTrendMode('orders')}
                  className={`premium-chart-toggle-btn ${trendMode === 'orders' ? 'active' : ''}`}
                >
                  Orders
                </button>
              </div>
            </div>
            <div className="premium-chart-body">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Top Selling Products Bar Chart */}
          <div className="premium-chart-card">
            <div className="premium-chart-header">
              <div>
                <h3 className="premium-chart-title">
                  <Package size={18} color="#ec4899" />
                  Top Selling Products
                </h3>
                <p className="premium-chart-subtitle">Highest volume sold</p>
              </div>
            </div>
            <div className="premium-chart-body">
              {topProductsSorted.length === 0 ? (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
                  No sales data recorded yet.
                </div>
              ) : (
                <Bar data={barChartData} options={barChartOptions} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Hub Quick Navigation Panel ── */}
      <div className="hub-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Tags size={16} color="#475569" />
          <h4 style={{ margin:0, fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Operational Modules Shortcuts</h4>
        </div>
        <div className="hub-section-btns">
          <HubBtn to="/admin/products" label="Manage Products" icon={Package} />
          <HubBtn to="/admin/categories" label="Manage Categories" icon={Tags} />
          <HubBtn to="/admin/orders" label="All Orders" icon={ShoppingCart} />
          <HubBtn to="/admin/orders?status=pending" label="Pending Orders" icon={ShoppingCart} />
          <HubBtn to="/admin/orders?status=return_requested" label="Return Requests" icon={ShoppingCart} />
          <HubBtn to="/admin/users" label="All Customers" icon={Users} />
          <HubBtn to="/admin/vendors" label="Manage Vendors" icon={Store} />
          <HubBtn to="/admin/coupons" label="Manage Coupons" icon={Ticket} />
        </div>
      </div>

      {/* ── Recent Orders + Low Stock Alerts ── */}
      {stats && (
        <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:'1.5rem', marginBottom: '1.5rem' }}>
          {/* Recent Orders */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="premium-chart-title" style={{ fontSize: '0.9rem' }}>Recent Orders</div>
              <Link to="/admin/orders" style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.78rem', color:'#C08A74', textDecoration:'none', fontWeight:700 }}>
                See all orders <ArrowRight size={13} />
              </Link>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentOrders || []).length === 0 ? (
                    <tr><td colSpan="4" className="no-data">No orders yet</td></tr>
                  ) : (
                    stats.recentOrders.map(o => (
                      <tr key={o._id}>
                        <td>
                          <Link to="/admin/orders" style={{ color:'#C08A74', fontWeight:700, fontSize:'0.8rem', textDecoration:'none' }}>
                            #{o.orderNumber?.replace('ORD-','') || o._id.slice(-6).toUpperCase()}
                          </Link>
                        </td>
                        <td style={{ fontSize:'0.8rem', color:'#374151', fontWeight: 500 }}>
                          {o.user?.name?.split(' ')[0] || 'Guest'}
                        </td>
                        <td style={{ fontWeight:700, fontSize:'0.8rem' }}>
                          ₹{Number(o.totalAmount).toLocaleString('en-IN')}
                        </td>
                        <td>
                          <span className={`status-badge ${statusClass[o.status] || 'badge-pending'}`}>
                            {statusLabel[o.status] || o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <div className="premium-chart-title" style={{ fontSize: '0.9rem' }}>Low Stock Alerts</div>
                <div className="admin-card-subtitle" style={{ marginTop: '2px' }}>Products with ≤ 5 units in any variant</div>
              </div>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Inventory Status</th>
                    <th style={{ textAlign:'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.lowStockProducts || []).length === 0 ? (
                    <tr>
                      <td colSpan="3" className="no-data" style={{ padding: '2rem 1.25rem' }}>
                        <span style={{ color:'#16a34a', fontWeight:700, marginRight:'0.3rem' }}>✓</span> 
                        All inventory levels healthy
                      </td>
                    </tr>
                  ) : (
                    stats.lowStockProducts.map(p => {
                      const lowCount = p.variants.filter(v => v.stock <= 5).length;
                      const critCount = p.variants.filter(v => v.stock === 0).length;
                      return (
                        <tr key={p._id}>
                          <td>
                            <div className="table-cell-primary" style={{ fontSize:'0.8rem', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {p.name}
                            </div>
                          </td>
                          <td>
                            <span className={`status-badge ${critCount > 0 ? 'badge-critical' : 'badge-low-stock'}`}>
                              {critCount > 0 ? `${critCount} variant out of stock` : `${lowCount} low`}
                            </span>
                          </td>
                          <td style={{ textAlign:'right' }}>
                            <button onClick={() => setStockModal(p)} className="btn-icon-sm view" title="View variant breakdown">
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Failed Payments Section ── */}
      {failedPayments.length > 0 && (
        <div className="admin-card" style={{ marginTop: '1.5rem', borderLeft: '4px solid #ef4444' }}>
          <div className="admin-card-header">
            <div>
              <div className="premium-chart-title" style={{ color: '#ef4444', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                <AlertCircle size={18} />
                Failed Payment Attempts ({failedPayments.length})
              </div>
              <div className="admin-card-subtitle" style={{ marginTop: '2px' }}>
                Payment attempts that failed. If the customer claims payment succeeded, verify and manually convert to a confirmed order.
              </div>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Info</th>
                  <th>Amount</th>
                  <th>Attempt Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {failedPayments.map(o => (
                  <tr key={o._id}>
                    <td style={{ color: '#C08A74', fontWeight: 700, fontSize: '0.85rem' }}>
                      #{o.orderNumber?.replace('ORD-','') || o._id.slice(-6).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>{o.user?.name || 'Guest'}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{o.user?.email}</div>
                    </td>
                    <td style={{ fontWeight: 800 }}>₹{Number(o.totalAmount).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {new Date(o.updatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <button
                        onClick={() => { setConvertModal(o); setConvertNote(''); setConvertPid(''); }}
                        style={{ padding: '0.45rem 1rem', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display:'inline-flex', alignItems:'center', gap:'0.25rem', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.target.style.background = '#15803d'}
                        onMouseOut={(e) => e.target.style.background = '#16a34a'}
                      >
                        ✓ Convert to Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Manual Confirm Modal ── */}
      {convertModal && createPortal(
        <div style={{ position:'fixed', inset:0, background:'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
          onClick={() => setConvertModal(null)}>
          <div style={{ background:'white', borderRadius:'16px', width:'100%', maxWidth:'440px', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9' }}>
              <h3 style={{ margin:0, fontSize:'1.1rem', fontWeight:850, color: '#0f172a' }}>Manually Confirm Order</h3>
              <p style={{ margin:'4px 0 0', fontSize:'0.78rem', color:'#94a3b8' }}>
                #{convertModal.orderNumber} · Amount: ₹{Number(convertModal.totalAmount).toLocaleString('en-IN')}
              </p>
            </div>
            <div style={{ padding:'1.25rem 1.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              <div>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#475569', marginBottom:'0.4rem' }}>
                  Razorpay / Transaction ID (optional)
                </label>
                <input className="form-input" value={convertPid} onChange={e => setConvertPid(e.target.value)}
                  placeholder="pay_XXXXXXXXXXXXXX" />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#475569', marginBottom:'0.4rem' }}>
                  Admin Verification Note
                </label>
                <textarea className="form-textarea" rows={3} value={convertNote} onChange={e => setConvertNote(e.target.value)}
                  placeholder="e.g. Payment verified via bank statement." />
              </div>
            </div>
            <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #f1f5f9', display:'flex', gap:'0.75rem', justifyContent:'flex-end', background:'#f8fafc' }}>
              <button onClick={() => setConvertModal(null)} className="btn-cancel">Cancel</button>
              <button onClick={handleManualConfirm} disabled={converting}
                style={{ padding:'0.55rem 1.25rem', background: converting ? '#94a3b8' : '#16a34a', color:'white', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'0.85rem', cursor: converting ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                {converting ? 'Confirming…' : '✓ Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Stock Breakdown Detail Modal */}
      {stockModal && createPortal(
        <StockModal product={stockModal} onClose={() => setStockModal(null)} />,
        document.body
      )}
    </div>
  );
};

export default Dashboard;
