import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, ShoppingBag, DollarSign, RotateCcw, Calendar, Mail, Phone, Shield } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const fetchUserDetail = async () => {
    try {
      const res = await api.get(`/admin/users/${id}`);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to fetch user details');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading user details...</div>;
  if (!data) return null;

  const { user, stats, orders } = data;

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-start' }}>
        <button 
          onClick={() => navigate('/admin/users')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', padding: '0.5rem' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="admin-page-title" style={{ margin: 0 }}>User Details</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Profile Card */}
        <div className="kpi-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
            <div style={{ background: '#e0d5ce', padding: '1rem', borderRadius: '50%', color: '#a98478' }}>
              <UserIcon size={32} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#2d2d2d', fontSize: '1.25rem' }}>{user.name}</h3>
              <span className="tag-badge" style={{ marginTop: '0.25rem' }}>{user.role}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#555' }}>
              <Mail size={16} />
              <span style={{ fontSize: '0.95rem' }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#555' }}>
              <Phone size={16} />
              <span style={{ fontSize: '0.95rem' }}>{user.phone || 'No phone provided'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#555' }}>
              <Calendar size={16} />
              <span style={{ fontSize: '0.95rem' }}>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#555' }}>
              <Shield size={16} />
              <span style={{ fontSize: '0.95rem' }}>ID: {user._id}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', alignContent: 'start' }}>
          <div className="kpi-card">
            <div className="kpi-icon"><ShoppingBag size={24} /></div>
            <div className="kpi-info">
              <h3>{stats.totalOrders}</h3>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon"><DollarSign size={24} /></div>
            <div className="kpi-info">
              <h3>₹{stats.totalSpent.toLocaleString()}</h3>
              <p>Total Spent</p>
            </div>
          </div>
          <div className="kpi-card" style={{ borderLeft: stats.returnRequests > 0 ? '4px solid #ef4444' : 'none' }}>
            <div className="kpi-icon" style={{ color: stats.returnRequests > 0 ? '#ef4444' : '#a98478' }}>
              <RotateCcw size={24} />
            </div>
            <div className="kpi-info">
              <h3 style={{ color: stats.returnRequests > 0 ? '#ef4444' : 'inherit' }}>{stats.returnRequests}</h3>
              <p>Active Return Requests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order History */}
      <h3 style={{ marginBottom: '1rem', color: '#2d2d2d' }}>Order History</h3>
      <div className="kpi-card" style={{ display: 'block', padding: 0, overflow: 'hidden' }}>
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ShoppingBag size={48} color="#ccc" /></div>
            <p>This user hasn't placed any orders yet.</p>
          </div>
        ) : (
          <table className="admin-table" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment Status</th>
                <th>Order Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const hasReturnReq = order.status === 'return_requested' || order.items.some(i => i.returnStatus === 'requested');
                
                return (
                  <tr key={order._id} style={{ background: hasReturnReq ? '#fef2f2' : 'transparent' }}>
                    <td>
                      <span style={{ fontWeight: 600, color: '#2d2d2d' }}>{order.orderNumber}</span>
                    </td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>{order.items.reduce((acc, item) => acc + item.quantity, 0)} items</td>
                    <td>₹{order.totalAmount.toLocaleString()}</td>
                    <td>
                      <span className="tag-badge" style={{ 
                        background: order.paymentStatus === 'paid' ? '#dcfce7' : '#f3f4f6',
                        color: order.paymentStatus === 'paid' ? '#166534' : '#4b5563'
                      }}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className="tag-badge" style={{ 
                        background: hasReturnReq ? '#fee2e2' : 
                                    order.status === 'delivered' ? '#dcfce7' : 
                                    order.status === 'cancelled' ? '#f3f4f6' : '#e0e7ff',
                        color: hasReturnReq ? '#991b1b' : 
                               order.status === 'delivered' ? '#166534' : 
                               order.status === 'cancelled' ? '#4b5563' : '#3730a3',
                        fontWeight: hasReturnReq ? 600 : 500
                      }}>
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
  );
};

export default UserDetail;
