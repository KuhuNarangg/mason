import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import '../admin/admin-pages.css';

const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'returns', label: 'Returns' },
];

// admin-pages.css doesn't define a 'packed' badge class, reuse 'processing' styling for it
const badgeClass = (status) => (status === 'packed' ? 'processing' : status);

const VendorOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (filter === 'returns') {
        params.returnStatus = 'requested';
      } else if (filter) {
        params.itemStatus = filter;
      }
      const { data } = await api.get('/vendor/orders', { params });
      setOrders(data.orders);
    } catch {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Orders</h1>
      </div>

      <div className="filter-bar">
        <div className="filter-tabs">
          {FILTER_TABS.map((t) => (
            <button key={t.key} className={`filter-tab${filter === t.key ? ' active' : ''}`} onClick={() => setFilter(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>S.No</th>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>My Items</th>
              <th>Item Status</th>
              <th>Payment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan="8" className="no-data">No orders found.</td></tr>
            ) : (
              orders.map((o, idx) => {
                const statuses = [...new Set(o.items.map((i) => i.itemStatus))];
                return (
                  <tr key={o._id}>
                    <td>{idx + 1}</td>
                    <td className="table-cell-primary">#{o.orderNumber}</td>
                    <td>{o.user?.name || '—'}</td>
                    <td className="table-cell-secondary">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>{o.items.length}</td>
                    <td>
                      {statuses.map((s) => (
                        <span key={s} className={`status-badge badge-${badgeClass(s)}`} style={{ marginRight: '0.25rem' }}>
                          {s}
                        </span>
                      ))}
                      {o.items.some((i) => i.returnStatus === 'requested') && (
                        <span className="status-badge badge-low-stock" style={{ marginRight: '0.25rem' }}>
                          ↩ Return Requested
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge badge-${o.paymentStatus === 'paid' ? 'paid' : 'unpaid'}`}>{o.paymentStatus}</span>
                    </td>
                    <td>
                      <button className="btn-small" onClick={() => navigate(`/vendor/orders/${o._id}`)} title="View" style={{ color: '#C08A74', borderColor: '#C08A74' }}>
                        <Eye size={16} />
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
  );
};

export default VendorOrders;
