import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const STATUSES = ['all', 'pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    api.get('/vendor/orders', { params: { status: status === 'all' ? undefined : status, page } })
      .then(({ data }) => { setOrders(data.orders); setPages(data.pages || 1); })
      .finally(() => setLoading(false));
  }, [status, page]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p>Orders containing your products.</p>
        </div>
      </div>

      <div className="filter-bar">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${status === s ? 'btn-primary' : ''}`}
            onClick={() => { setStatus(s); setPage(1); }}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">No orders found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order #</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const myItems = o.items || [];
                  const total = myItems.reduce((s, i) => s + (i.price * i.quantity), 0);
                  const statuses = [...new Set(myItems.map((i) => i.itemStatus))];
                  return (
                    <tr key={o._id}>
                      <td>{o.orderNumber || o._id.slice(-8)}</td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td>{o.user?.name || o.shippingAddress?.fullName || '—'}</td>
                      <td>{myItems.reduce((s, i) => s + i.quantity, 0)}</td>
                      <td>{formatPrice(total)}</td>
                      <td>
                        {statuses.map((s) => <span key={s} className={`badge badge-${s}`} style={{ marginRight: 4 }}>{s}</span>)}
                      </td>
                      <td><Link to={`/orders/${o._id}`} className="btn btn-sm">View</Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
