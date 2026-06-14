import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import '../admin/admin-pages.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VendorEarnings = () => {
  const [data, setData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchEarnings = async () => {
    const { data: earn } = await api.get('/vendor/earnings', { params: { from: from || undefined, to: to || undefined } });
    setData(earn);
  };

  const fetchInvoices = async () => {
    const { data: inv } = await api.get('/vendor/earnings/invoices', { params: { limit: 50 } });
    setInvoices(inv.invoices);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEarnings(), fetchInvoices()]);
    } catch {
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetchEarnings();
    } catch {
      toast.error('Failed to load earnings');
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!data || !data.daily || data.daily.length === 0) return null;
    const daily = [...data.daily].reverse();
    const labels = daily.map(d => {
      try {
        return new Date(d._id).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch {
        return d._id;
      }
    });
    const revenues = daily.map(d => d.grossRevenue);
    const netEarnings = daily.map(d => d.earning);

    return {
      labels,
      datasets: [
        {
          label: 'Gross Sales (₹)',
          data: revenues,
          borderColor: '#C08A74',
          backgroundColor: 'rgba(192, 138, 116, 0.08)',
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Net Earnings (₹)',
          data: netEarnings,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.04)',
          tension: 0.3,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [data]);

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  const totals = data?.totals || { unitsSold: 0, grossRevenue: 0, commission: 0, earning: 0 };

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Earnings</h1>
      </div>

      <form className="form-container" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }} onSubmit={applyFilter}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>From Date</label>
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>To Date</label>
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary" style={{ height: '38px', padding: '0 1.5rem', background: '#C08A74', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>Apply Filter</button>
      </form>

      <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-info"><h3>Units Sold</h3><p className="stat-value">{totals.unitsSold}</p></div>
        </div>
        <div className="admin-stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-info"><h3>Gross Revenue</h3><p className="stat-value">₹{totals.grossRevenue.toFixed(2)}</p></div>
        </div>
        <div className="admin-stat-card" style={{ padding: '1.25rem' }}>
          <div className="stat-info"><h3>Commission ({data?.commissionPercent ?? 10}%)</h3><p className="stat-value">₹{totals.commission.toFixed(2)}</p></div>
        </div>
        <div className="admin-stat-card" style={{ padding: '1.25rem', borderLeft: '3px solid #10b981' }}>
          <div className="stat-info"><h3>Your Earning</h3><p className="stat-value" style={{ color: '#10b981' }}>₹{totals.earning.toFixed(2)}</p></div>
        </div>
      </div>

      {/* Daily Sales Trend Chart */}
      {chartData && (
        <div className="form-container" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#0f172a' }}>Daily Earnings Trend</h3>
          <div style={{ height: 280 }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top', labels: { boxWidth: 12, font: { weight: 600 } } },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (value) => `₹${value}`,
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      <h3 style={{ marginBottom: '0.75rem', color: '#0f172a' }}>Daily Breakdown</h3>
      <div className="table-wrap" style={{ marginBottom: '2rem' }}>
        <table className="admin-table">
          <thead><tr><th>Date</th><th>Units Sold</th><th>Gross Revenue</th><th>Commission</th><th>Earning</th></tr></thead>
          <tbody>
            {(data?.daily || []).length === 0 ? (
              <tr><td colSpan="5" className="no-data">No sales in this period.</td></tr>
            ) : (
              data.daily.map((d) => (
                <tr key={d._id}>
                  <td className="table-cell-primary">{d._id}</td>
                  <td>{d.unitsSold}</td>
                  <td>₹{d.grossRevenue.toFixed(2)}</td>
                  <td>₹{d.commission.toFixed(2)}</td>
                  <td>₹{d.earning.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginBottom: '0.75rem', color: '#0f172a' }}>Invoices</h3>
      <div className="table-wrap">
        <table className="admin-table">
          <thead><tr><th>Order #</th><th>Date</th><th>Customer</th><th>Items</th><th>Subtotal</th><th>Commission</th><th>Earning</th></tr></thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No paid invoices yet.</td></tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.orderId}>
                  <td className="table-cell-primary">#{inv.orderNumber}</td>
                  <td className="table-cell-secondary">{new Date(inv.date).toLocaleDateString()}</td>
                  <td>{inv.customer}</td>
                  <td>{inv.items.length}</td>
                  <td>₹{inv.subtotal.toFixed(2)}</td>
                  <td>₹{inv.commission.toFixed(2)}</td>
                  <td>₹{inv.earning.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorEarnings;
