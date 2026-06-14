import { useState, useEffect } from 'react';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const COLORS = ['#C08A74', '#A36B56', '#E8C4B0', '#7C9885', '#D4A574', '#9B8AA6', '#6B9BC3', '#E0A458', '#8B5A6B', '#5C8A8A'];

const RANGE_OPTIONS = [
  { key: 7, label: '7 Days' },
  { key: 30, label: '30 Days' },
  { key: 90, label: '90 Days' },
  { key: 365, label: '1 Year' },
];

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => { fetchAnalytics(); }, [days]);

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/admin/analytics', { params: { days } });
      setData(data);
    } catch {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return (
    <div className="admin-loading">
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading analytics…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const { revenueTrend, orderStatusBreakdown, categoryBreakdown, vendorPerformance, paymentMethodBreakdown, totals } = data;

  const revenueChartData = {
    labels: revenueTrend.map(d => new Date(d._id).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: revenueTrend.map(d => d.revenue),
        borderColor: '#C08A74',
        backgroundColor: 'rgba(192,138,116,0.15)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'Orders',
        data: revenueTrend.map(d => d.orders),
        borderColor: '#7C9885',
        backgroundColor: 'rgba(124,152,133,0.15)',
        fill: true,
        tension: 0.3,
        yAxisID: 'y1',
      },
    ],
  };

  const statusChartData = {
    labels: orderStatusBreakdown.map(s => s._id),
    datasets: [{
      data: orderStatusBreakdown.map(s => s.count),
      backgroundColor: COLORS,
    }],
  };

  const categoryChartData = {
    labels: categoryBreakdown.map(c => c._id),
    datasets: [{
      label: 'Revenue (₹)',
      data: categoryBreakdown.map(c => c.revenue),
      backgroundColor: COLORS,
    }],
  };

  const paymentChartData = {
    labels: paymentMethodBreakdown.map(p => p._id || 'Unknown'),
    datasets: [{
      data: paymentMethodBreakdown.map(p => p.count),
      backgroundColor: COLORS,
    }],
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Platform Analytics</h1>
          <p className="admin-page-subtitle">Insights for the last {days} days</p>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="filter-tabs">
          {RANGE_OPTIONS.map((r) => (
            <button key={r.key} className={`filter-tab${days === r.key ? ' active' : ''}`} onClick={() => setDays(r.key)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-stat-card">
          <div className="stat-info"><h3>Total Orders</h3><p className="stat-value">{totals.totalOrders}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-info"><h3>Total Revenue</h3><p className="stat-value">₹{Number(totals.totalRevenue || 0).toFixed(2)}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-info"><h3>Avg Order Value</h3><p className="stat-value">₹{Number(totals.avgOrderValue || 0).toFixed(2)}</p></div>
        </div>
      </div>

      <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Revenue &amp; Orders Trend</h3>
        <div style={{ height: 320 }}>
          <Line
            data={revenueChartData}
            options={{
              responsive: true, maintainAspectRatio: false,
              scales: {
                y: { type: 'linear', position: 'left', title: { display: true, text: 'Revenue (₹)' } },
                y1: { type: 'linear', position: 'right', title: { display: true, text: 'Orders' }, grid: { drawOnChartArea: false } },
              },
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="form-container" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Orders by Status</h3>
          <div style={{ height: 280 }}>
            <Doughnut data={statusChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
        <div className="form-container" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Payment Methods</h3>
          <div style={{ height: 280 }}>
            <Doughnut data={paymentChartData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Revenue by Product Type</h3>
        <div style={{ height: 320 }}>
          <Bar data={categoryChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="form-container" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Top Vendors ({days} days)</h3>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>Commission</th>
                <th>Vendor Earning</th>
              </tr>
            </thead>
            <tbody>
              {vendorPerformance.length === 0 ? (
                <tr><td colSpan="5" className="no-data">No vendor sales in this period.</td></tr>
              ) : (
                vendorPerformance.map(v => (
                  <tr key={v._id}>
                    <td className="table-cell-primary">{v.name}</td>
                    <td>{v.unitsSold}</td>
                    <td>₹{Number(v.revenue || 0).toFixed(2)}</td>
                    <td>₹{Number(v.commission || 0).toFixed(2)}</td>
                    <td>₹{Number(v.vendorEarning || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
