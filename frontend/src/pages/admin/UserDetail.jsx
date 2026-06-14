import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, User as UserIcon, ShoppingBag, DollarSign, 
  RotateCcw, Calendar, Mail, Phone, Shield, ArrowRight
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      const res = await api.get(`/admin/users/${id}`);
      setData(res.data);
    } catch {
      toast.error('Failed to fetch user details');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  const initials = (name) =>
    (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const kpis = useMemo(() => {
    if (!data) return [];
    const { stats } = data;
    return [
      {
        label: 'Total Orders',
        value: stats.totalOrders || 0,
        category: 'Sales',
        icon: ShoppingBag,
        themeColor: '#3b82f6',
        themeRgb: '59, 130, 246',
        bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.03) 100%)',
      },
      {
        label: 'Total Purchased',
        value: `₹${Number(stats.totalSpent || 0).toLocaleString('en-IN')}`,
        category: 'Financial',
        icon: DollarSign,
        themeColor: '#C08A74',
        themeRgb: '192, 138, 116',
        bgGradient: 'linear-gradient(135deg, rgba(192, 138, 116, 0.1) 0%, rgba(192, 138, 116, 0.03) 100%)',
      },
      {
        label: 'Active Returns',
        value: stats.returnRequests || 0,
        category: 'Moderation',
        icon: RotateCcw,
        themeColor: stats.returnRequests > 0 ? '#ef4444' : '#10b981',
        themeRgb: stats.returnRequests > 0 ? '239, 68, 68' : '16, 185, 129',
        bgGradient: stats.returnRequests > 0 
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.03) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.03) 100%)',
      },
    ];
  }, [data]);

  if (loading) return (
    <div className="admin-loading" style={{ margin: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width:24, height:24, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Retrieving customer profile…</span>
    </div>
  );

  if (!data) return null;

  const { user, orders } = data;

  return (
    <div className="animate-fade-in-up">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-start' }}>
        <button onClick={() => navigate('/admin/users')} className="btn-icon-sm" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="admin-page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Customer Details</h2>
          <p className="admin-page-subtitle">Granular account parameters and purchase history logs.</p>
        </div>
      </div>

      {/* ── Two Column Profile layout ── */}
      <div className="premium-dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left Column: Customer card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-card">
            <div className="admin-card-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1.5rem 1.5rem', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
              <div className="user-avatar" style={{ width: 64, height: 64, fontSize: '1.5rem', borderRadius: '50%', marginBottom: '1rem', background: 'linear-gradient(135deg, #C08A74, #A36B56)', color: 'white', fontWeight: 700 }}>
                {initials(user.name)}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{user.name}</h3>
              <span className="status-badge badge-active" style={{ marginTop: '0.5rem', textTransform: 'capitalize', fontSize: '0.65rem' }}>{user.role}</span>
            </div>
            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem 1.5rem' }}>
              <div className="stat-row" style={{ padding: '0.25rem 0' }}>
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> Email</span>
                <span className="stat-value" style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{user.email}</span>
              </div>
              <div className="stat-row" style={{ padding: '0.25rem 0' }}>
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> Phone</span>
                <span className="stat-value">{user.phone || <span style={{ color: '#cbd5e1', fontWeight: 500 }}>—</span>}</span>
              </div>
              <div className="stat-row" style={{ padding: '0.25rem 0' }}>
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={14} /> Joined</span>
                <span className="stat-value">{new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="stat-row" style={{ padding: '0.25rem 0', borderBottom: 'none' }}>
                <span className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Shield size={14} /> Account ID</span>
                <span className="stat-value" style={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{user._id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Statistics Grid & Order History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Stats metrics */}
          <div className="premium-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: 0 }}>
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="premium-kpi-card"
                  style={{
                    '--kpi-theme-color': kpi.themeColor,
                    '--kpi-theme-rgb': kpi.themeRgb,
                    '--kpi-bg-gradient': kpi.bgGradient,
                    cursor: 'default',
                    padding: '1.25rem'
                  }}
                >
                  <div className="premium-kpi-header" style={{ marginBottom: '0.75rem' }}>
                    <div className="premium-kpi-icon-wrap" style={{ width: 38, height: 38, borderRadius: '8px' }}>
                      <Icon size={18} />
                    </div>
                    <span className="premium-kpi-category-badge" style={{ fontSize: '0.58rem' }}>{kpi.category}</span>
                  </div>
                  <div className="premium-kpi-body">
                    <div className="premium-kpi-value" style={{ fontSize: '1.4rem' }}>{kpi.value}</div>
                    <div className="premium-kpi-label" style={{ fontSize: '0.72rem' }}>{kpi.label}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order history table */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="premium-chart-title" style={{ fontSize: '0.95rem' }}>Purchase Order History</div>
              <span className="admin-card-subtitle">{orders.length} transaction{orders.length !== 1 ? 's' : ''} found</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {orders.length === 0 ? (
                <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                  <ShoppingBag size={36} style={{ marginBottom: '0.5rem', strokeWidth: 1.5 }} />
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>This customer has not placed any orders yet.</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Order Date</th>
                      <th>Items Sold</th>
                      <th>Total Amount</th>
                      <th>Payment Status</th>
                      <th>Order Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const hasReturnReq = order.status === 'return_requested' || order.items.some(i => i.returnStatus === 'requested');
                      return (
                        <tr key={order._id} style={{ background: hasReturnReq ? '#fffbeb' : 'transparent' }}>
                          <td>
                            <Link to="/admin/orders" style={{ color: '#C08A74', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
                              #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#334155' }}>
                            {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                          </td>
                          <td style={{ fontWeight: 700, fontSize: '0.8rem' }}>
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td>
                            <span className={`status-badge ${order.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${
                              hasReturnReq ? 'badge-return_requested' :
                              order.status === 'delivered' ? 'badge-delivered' :
                              order.status === 'cancelled' ? 'badge-cancelled' : 'badge-processing'
                            }`}>
                              {hasReturnReq ? 'Return Requested' : order.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
