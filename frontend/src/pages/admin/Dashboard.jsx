import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, Package, Users, ArrowRight,
  AlertTriangle, Eye, X, IndianRupee, Tags, Ticket,
  PlusCircle, Store,
} from 'lucide-react';
import api from '../../utils/api';
import './admin-pages.css';

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

/* ── Revenue Sparkline ─────────────────────────────────── */
const RevenueChart = ({ data }) => {
  const W = 100, H = 100;
  const padding = { top: 8, right: 2, bottom: 20, left: 6 };
  const values = data.map(d => d.revenue);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;
  const pts = values.map((v, i) => ({
    x: padding.left + (i / Math.max(values.length - 1, 1)) * (W - padding.left - padding.right),
    y: padding.top + (1 - (v - minVal) / range) * (H - padding.top - padding.bottom),
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = [
    `M ${pts[0]?.x.toFixed(1)} ${(H - padding.bottom).toFixed(1)}`,
    ...pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${pts[pts.length - 1]?.x.toFixed(1)} ${(H - padding.bottom).toFixed(1)}`,
    'Z',
  ].join(' ');
  const gridY = [0.25, 0.5, 0.75, 1].map(
    pct => (padding.top + (1 - pct) * (H - padding.top - padding.bottom)).toFixed(1)
  );
  const step = Math.ceil(data.length / 6);
  const labels = data.filter((_, i) => i % step === 0 || i === data.length - 1);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" preserveAspectRatio="none">
      {gridY.map((y, i) => (
        <line key={i} x1={padding.left} x2={W - padding.right} y1={y} y2={y} className="chart-grid-line" />
      ))}
      <path d={areaPath} className="chart-area" />
      <path d={linePath} className="chart-line" />
      {labels.map((d, i) => {
        const idx = data.indexOf(d);
        return (
          <text key={i} x={pts[idx]?.x.toFixed(1)} y={(H - 4).toFixed(1)}
            fontSize="5" fill="#94a3b8" textAnchor="middle">
            {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </text>
        );
      })}
    </svg>
  );
};

/* ── Stock Modal ───────────────────────────────────────── */
const StockModal = ({ product, onClose }) => {
  if (!product) return null;
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }} onClick={onClose}>
      <div style={{ background:'white', borderRadius:'14px', width:'100%', maxWidth:'480px', maxHeight:'85vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 20px 40px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>Stock Details</h3>
            <p style={{ margin:0, fontSize:'0.75rem', color:'#94a3b8', marginTop:'2px' }}>{product.name}</p>
          </div>
          <button onClick={onClose} className="btn-icon-sm"><X size={18} /></button>
        </div>
        <div style={{ overflowY:'auto', padding:'1.25rem 1.5rem' }}>
          <table className="admin-table" style={{ border:'none', boxShadow:'none' }}>
            <thead><tr><th>Size</th><th>Color</th><th style={{ textAlign:'right' }}>Stock</th></tr></thead>
            <tbody>
              {product.variants.map((v, i) => (
                <tr key={i}>
                  <td><span className="tag-badge">{v.size}</span></td>
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

/* ── Hub Section ───────────────────────────────────────── */
const HubSection = ({ title, children }) => (
  <div className="hub-section">
    <p className="hub-section-label">{title}</p>
    <div className="hub-section-btns">{children}</div>
  </div>
);

/* ── Dashboard ─────────────────────────────────────────── */
const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [stockModal, setStockModal] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setStats(res.data)).catch(console.error);
  }, []);

  const totalRevenue30 = useMemo(() => {
    if (!stats?.last30Days) return 0;
    return stats.last30Days.reduce((s, d) => s + d.revenue, 0);
  }, [stats]);

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Admin Console</h1>
          <p className="admin-page-subtitle">Manage your store from one place.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="btn-outline-sm">
          <Store size={14} /> View Store
        </a>
      </div>

      {/* ── Return Requests Alert ── */}
      {stats?.returnRequestsCount > 0 && (
        <div className="admin-alert warning" style={{ marginBottom: '1.5rem' }}>
          <div className="admin-alert-left">
            <AlertTriangle size={18} color="#f97316" />
            <span className="admin-alert-count">{stats.returnRequestsCount}</span>
            <span className="admin-alert-text">
              {stats.returnRequestsCount === 1
                ? '1 pending return request needs your approval'
                : `${stats.returnRequestsCount} pending return requests need your approval`}
            </span>
          </div>
          <Link to="/admin/orders?status=return_requested"
            style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.8rem', fontWeight:600, color:'#f97316', textDecoration:'none', whiteSpace:'nowrap' }}>
            Review Now <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ── Hub Panel ── */}
      <div className="hub-panel">

        <HubSection title="Products & Inventory">
          <HubBtn to="/admin/products"            label="Manage Products"   icon={Package} />
          <HubBtn to="/admin/products?add=true"   label="Add New Product"   icon={PlusCircle} />
          <HubBtn to="/admin/categories"          label="Manage Categories" icon={Tags} />
        </HubSection>

        <HubSection title="Orders">
          <HubBtn to="/admin/orders"                        label="All Orders"      icon={ShoppingCart} />
          <HubBtn to="/admin/orders?status=pending"         label="Pending Orders"  icon={ShoppingCart} />
          <HubBtn to="/admin/orders?status=return_requested" label="Return Requests" icon={ShoppingCart} />
        </HubSection>

        <HubSection title="Customers">
          <HubBtn to="/admin/users" label="All Customers" icon={Users} />
        </HubSection>

        <HubSection title="Finance">
          <HubBtn to="/admin/coupons" label="Manage Coupons" icon={Ticket} />
        </HubSection>

      </div>

      {/* ── KPI Stats ── */}
      {stats && (
        <>
          <div className="hub-stats-row">
            <div className="hub-stat-card">
              <IndianRupee size={18} strokeWidth={1.5} className="hub-stat-icon" />
              <div>
                <div className="hub-stat-value">₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}</div>
                <div className="hub-stat-label">Total Revenue</div>
              </div>
            </div>
            <div className="hub-stat-card">
              <ShoppingCart size={18} strokeWidth={1.5} className="hub-stat-icon" />
              <div>
                <div className="hub-stat-value">{stats.totalOrders}</div>
                <div className="hub-stat-label">Orders</div>
              </div>
            </div>
            <div className="hub-stat-card">
              <Package size={18} strokeWidth={1.5} className="hub-stat-icon" />
              <div>
                <div className="hub-stat-value">{stats.totalProducts}</div>
                <div className="hub-stat-label">Products</div>
              </div>
            </div>
            <div className="hub-stat-card">
              <Users size={18} strokeWidth={1.5} className="hub-stat-icon" />
              <div>
                <div className="hub-stat-value">{stats.totalUsers}</div>
                <div className="hub-stat-label">Customers</div>
              </div>
            </div>
          </div>

          {/* ── Charts + Tables ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:'1.25rem', marginBottom:'1.25rem' }}>
            {stats.last30Days?.length > 0 && (
              <div className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <div className="admin-card-title">Revenue — Last 30 Days</div>
                    <div className="admin-card-subtitle">Daily order revenue</div>
                  </div>
                  <div style={{ fontSize:'1.25rem', fontWeight:700, color:'#0f172a' }}>
                    ₹{totalRevenue30.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="admin-card-body" style={{ paddingTop:'0.75rem' }}>
                  <div className="chart-wrap"><RevenueChart data={stats.last30Days} /></div>
                </div>
              </div>
            )}
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Top Products</div>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>#</th><th>Product</th><th style={{ textAlign:'right' }}>Sold</th></tr></thead>
                  <tbody>
                    {(stats.topProducts || []).length === 0 ? (
                      <tr><td colSpan="3" className="no-data">No data yet</td></tr>
                    ) : (
                      stats.topProducts.map((p, i) => (
                        <tr key={p._id}>
                          <td><div className={`rank-badge rank-${i < 3 ? i+1 : 'other'}`}>{i + 1}</div></td>
                          <td><div className="table-cell-primary" style={{ fontSize:'0.8rem', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div></td>
                          <td style={{ textAlign:'right', fontWeight:600, color:'#C08A74' }}>{p.totalSold}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Recent Orders + Low Stock ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem' }}>
            <div className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-title">Recent Orders</div>
                <Link to="/admin/orders" style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.78rem', color:'#C08A74', textDecoration:'none', fontWeight:600 }}>
                  See all <ArrowRight size={13} />
                </Link>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {(stats.recentOrders || []).length === 0 ? (
                      <tr><td colSpan="4" className="no-data">No orders yet</td></tr>
                    ) : (
                      stats.recentOrders.map(o => (
                        <tr key={o._id}>
                          <td>
                            <Link to="/admin/orders" style={{ color:'#C08A74', fontWeight:600, fontSize:'0.8rem', textDecoration:'none' }}>
                              #{o.orderNumber?.replace('ORD-','') || o._id.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td style={{ fontSize:'0.8rem', color:'#374151' }}>{o.user?.name?.split(' ')[0] || '—'}</td>
                          <td style={{ fontWeight:600, fontSize:'0.8rem' }}>₹{Number(o.totalAmount).toLocaleString('en-IN')}</td>
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

            <div className="admin-card">
              <div className="admin-card-header">
                <div>
                  <div className="admin-card-title">Low Stock Alerts</div>
                  <div className="admin-card-subtitle">Products with ≤ 5 units in any variant</div>
                </div>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table className="admin-table">
                  <thead><tr><th>Product</th><th>Variants</th><th></th></tr></thead>
                  <tbody>
                    {(stats.lowStockProducts || []).length === 0 ? (
                      <tr><td colSpan="3" className="no-data"><span style={{ color:'#16a34a', fontWeight:600 }}>✓</span> All stock levels healthy</td></tr>
                    ) : (
                      stats.lowStockProducts.map(p => {
                        const lowCount = p.variants.filter(v => v.stock <= 5).length;
                        const critCount = p.variants.filter(v => v.stock === 0).length;
                        return (
                          <tr key={p._id}>
                            <td><div className="table-cell-primary" style={{ fontSize:'0.8rem', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div></td>
                            <td>
                              <span className={`status-badge ${critCount > 0 ? 'badge-critical' : 'badge-low-stock'}`}>
                                {critCount > 0 ? `${critCount} out of stock` : `${lowCount} low`}
                              </span>
                            </td>
                            <td>
                              <button onClick={() => setStockModal(p)} className="btn-icon-sm view" title="View stock details">
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
        </>
      )}

      {/* Loading state (only for stats section) */}
      {!stats && (
        <div className="admin-loading">
          <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          Loading stats…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      <StockModal product={stockModal} onClose={() => setStockModal(null)} />
    </div>
  );
};

export default Dashboard;
