import { useEffect, useState } from 'react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

export default function Earnings() {
  const [data, setData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/vendor/earnings', { params: { from: from || undefined, to: to || undefined } }),
      api.get('/vendor/earnings/invoices'),
    ])
      .then(([earningsRes, invoicesRes]) => {
        setData(earningsRes.data);
        setInvoices(invoicesRes.data.invoices || invoicesRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const handleFilter = (e) => {
    e.preventDefault();
    load();
  };

  if (loading && !data) return <div className="empty-state">Loading…</div>;

  const breakdown = data?.breakdown || data?.daily || [];
  const totals = data?.totals || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Earnings</h1>
          <p>Track your sales, commissions, and payouts.</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Units Sold</div>
          <div className="value">{totals.unitsSold || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Gross Revenue</div>
          <div className="value">{formatPrice(totals.grossRevenue)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Commission Deducted</div>
          <div className="value">{formatPrice(totals.commission)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Net Earning</div>
          <div className="value">{formatPrice(totals.earning)}</div>
        </div>
      </div>

      <form className="filter-bar" onSubmit={handleFilter}>
        <div className="form-group" style={{ margin: 0 }}>
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button className="btn" type="submit" style={{ alignSelf: 'flex-end' }}>Filter</button>
      </form>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Daily Breakdown</h3>
        {breakdown.length === 0 ? (
          <div className="empty-state">No sales in this period.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Units Sold</th><th>Gross Revenue</th><th>Commission</th><th>Your Earning</th></tr></thead>
              <tbody>
                {breakdown.map((row) => (
                  <tr key={row._id || row.date}>
                    <td>{row._id || row.date}</td>
                    <td>{row.unitsSold}</td>
                    <td>{formatPrice(row.grossRevenue)}</td>
                    <td>{formatPrice(row.commission)}</td>
                    <td>{formatPrice(row.earning)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Invoices (Paid Orders)</h3>
        {invoices.length === 0 ? (
          <div className="empty-state">No paid invoices yet.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Order #</th><th>Date</th><th>Subtotal</th><th>Commission</th><th>Your Earning</th><th>Payout Status</th></tr></thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.orderId || inv._id}>
                    <td>{inv.orderNumber}</td>
                    <td>{new Date(inv.date || inv.createdAt).toLocaleDateString()}</td>
                    <td>{formatPrice(inv.subtotal)}</td>
                    <td>{formatPrice(inv.commission)}</td>
                    <td>{formatPrice(inv.earning)}</td>
                    <td><span className={`badge ${inv.payoutStatus === 'paid' ? 'badge-active' : 'badge-pending'}`}>{inv.payoutStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
