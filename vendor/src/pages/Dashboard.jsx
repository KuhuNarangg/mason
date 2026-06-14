import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, ShoppingBag, Wallet, Clock, Truck } from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { vendor } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendor/dashboard')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty-state">Loading dashboard…</div>;
  if (!data) return <div className="empty-state">Could not load dashboard data.</div>;

  const sc = data.statusCounts || {};
  const pendingCount = sc.pending?.count || 0;
  const shippedCount = sc.shipped?.count || 0;
  const deliveredCount = sc.delivered?.count || 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Welcome back, {vendor?.vendorProfile?.businessName || vendor?.name}</h1>
          <p>Here's how your store is performing.</p>
        </div>
        <Link to="/products/new" className="btn btn-primary">+ Add Product</Link>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label"><Package size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Total Products</div>
          <div className="value">{data.products}</div>
        </div>
        <div className="stat-card">
          <div className="label"><AlertTriangle size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Low Stock Items</div>
          <div className="value" style={{ color: data.lowStockCount > 0 ? '#dc2626' : undefined }}>{data.lowStockCount}</div>
          {data.lowStockCount > 0 && <Link to="/inventory" className="sub">View inventory →</Link>}
        </div>
        <div className="stat-card">
          <div className="label"><Clock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Pending Orders</div>
          <div className="value">{pendingCount}</div>
        </div>
        <div className="stat-card">
          <div className="label"><Truck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Shipped</div>
          <div className="value">{shippedCount}</div>
        </div>
        <div className="stat-card">
          <div className="label"><ShoppingBag size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Delivered</div>
          <div className="value">{deliveredCount}</div>
        </div>
        <div className="stat-card">
          <div className="label"><Wallet size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Pending Payout</div>
          <div className="value">{formatPrice(data.earnings?.pending)}</div>
          <div className="sub">Paid out: {formatPrice(data.earnings?.paid)}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Order Status Breakdown</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Status</th><th>Items</th><th>Revenue</th><th>Your Earning</th></tr>
            </thead>
            <tbody>
              {['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((s) => (
                <tr key={s}>
                  <td><span className={`badge badge-${s}`}>{s}</span></td>
                  <td>{sc[s]?.count || 0}</td>
                  <td>{formatPrice(sc[s]?.revenue)}</td>
                  <td>{formatPrice(sc[s]?.earning)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Commission</h3>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>
          Platform commission rate: <strong>{data.commissionPercent}%</strong> — applied automatically to each order.
        </p>
      </div>
    </div>
  );
}
