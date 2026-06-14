import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Truck, CheckCircle, Clock, Boxes, Wallet, AlertTriangle,
  TrendingUp, RotateCcw, Eye, ArrowRight, Settings, PlusCircle, Tag
} from 'lucide-react';
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

const VendorDashboard = () => {
  const [dashData, setDashData] = useState(null);
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/vendor/dashboard'),
      api.get('/vendor/earnings', { params: { limit: 30 } })
    ]).then(([{ data: dash }, { data: earn }]) => {
      setDashData(dash);
      setEarningsData(earn);
    }).catch((err) => console.error('Error loading vendor dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  const chartData = useMemo(() => {
    if (!earningsData || !earningsData.daily || earningsData.daily.length === 0) return null;
    const daily = [...earningsData.daily].reverse();
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
  }, [earningsData]);

  if (loading) {
    return <div className="admin-loading"><div className="spinner"></div></div>;
  }

  const sc = dashData?.statusCounts || {};
  const totalOrders = dashData?.totalOrderItems || 0;
  const pending = sc.pending?.count || 0;
  const shipped = sc.shipped?.count || 0;
  const delivered = sc.delivered?.count || 0;
  const products = dashData?.products || 0;
  const lowStock = dashData?.lowStockCount || 0;
  const pendingReturns = dashData?.pendingReturnsCount || 0;
  const pendingPayout = dashData?.earnings?.pending || 0;
  const paidOut = dashData?.earnings?.paid || 0;

  const statCards = [
    {
      title: 'Net Earnings',
      value: `₹${(earningsData?.totals?.earning || 0).toFixed(2)}`,
      icon: <Wallet size={22} />,
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)',
      border: '1px solid rgba(16, 185, 129, 0.15)',
    },
    {
      title: 'Gross Revenue',
      value: `₹${(earningsData?.totals?.grossRevenue || 0).toFixed(2)}`,
      icon: <TrendingUp size={22} />,
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%)',
      border: '1px solid rgba(59, 130, 246, 0.15)',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStock,
      icon: <AlertTriangle size={22} />,
      color: lowStock > 0 ? '#ef4444' : '#64748b',
      bgGradient: lowStock > 0 
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.02) 100%)' 
        : 'linear-gradient(135deg, rgba(100, 116, 139, 0.06) 0%, rgba(100, 116, 139, 0.01) 100%)',
      border: lowStock > 0 ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(100, 116, 139, 0.1)',
      subtitle: lowStock > 0 ? 'Action required soon' : 'All items in stock',
    },
    {
      title: 'Pending Returns',
      value: pendingReturns,
      icon: <RotateCcw size={22} />,
      color: pendingReturns > 0 ? '#f59e0b' : '#64748b',
      bgGradient: pendingReturns > 0 
        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.02) 100%)' 
        : 'linear-gradient(135deg, rgba(100, 116, 139, 0.06) 0%, rgba(100, 116, 139, 0.01) 100%)',
      border: pendingReturns > 0 ? '1px solid rgba(245, 158, 11, 0.15)' : '1px solid rgba(100, 116, 139, 0.1)',
      subtitle: pendingReturns > 0 ? 'Return approvals pending' : 'No pending returns',
    },
    {
      title: 'Total Products',
      value: products,
      icon: <Boxes size={22} />,
      color: '#6366f1',
      bgGradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(99, 102, 241, 0.02) 100%)',
      border: '1px solid rgba(99, 102, 241, 0.15)',
    },
    {
      title: 'Total Order Items',
      value: totalOrders,
      icon: <Package size={22} />,
      color: '#0f172a',
      bgGradient: 'linear-gradient(135deg, rgba(15, 23, 42, 0.06) 0%, rgba(15, 23, 42, 0.01) 100%)',
      border: '1px solid rgba(15, 23, 42, 0.1)',
    },
    {
      title: 'Pending Payout',
      value: `₹${pendingPayout.toFixed(2)}`,
      icon: <Wallet size={22} />,
      color: '#0d9488',
      bgGradient: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(13, 148, 136, 0.02) 100%)',
      border: '1px solid rgba(13, 148, 136, 0.15)',
    },
    {
      title: 'Paid Out',
      value: `₹${paidOut.toFixed(2)}`,
      icon: <Wallet size={22} />,
      color: '#06b6d4',
      bgGradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(6, 182, 212, 0.02) 100%)',
      border: '1px solid rgba(6, 182, 212, 0.15)',
    }
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1 className="admin-page-title">Vendor Dashboard</h1>
        <p className="admin-page-subtitle">Overview of your store performance, inventory, and settlements</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="admin-stats-grid">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="admin-stat-card"
            style={{
              background: stat.bgGradient,
              border: stat.border,
              padding: '1.25rem',
            }}
          >
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <p className="stat-value" style={{ fontSize: '1.5rem', marginTop: '0.4rem' }}>{stat.value}</p>
              {stat.subtitle && (
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
                  {stat.subtitle}
                </div>
              )}
            </div>
            <div className="stat-icon" style={{ color: stat.color, backgroundColor: `${stat.color}15` }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 2fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {/* Sales Trend Line Chart */}
        {chartData ? (
          <div className="form-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <TrendingUp size={18} style={{ color: '#C08A74' }} /> Sales &amp; Earnings Trend
            </h3>
            <div style={{ height: 280, flex: 1 }}>
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
        ) : (
          <div className="form-container" style={{ padding: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: '#64748b' }}>No recent sales to display charts.</p>
          </div>
        )}

        {/* Quick Actions Panel */}
        <div className="form-container" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: '#0f172a' }}>Quick Links &amp; Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, justifyContent: 'center' }}>
            <Link to="/vendor/products/new" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(192, 138, 116, 0.1)', color: '#C08A74' }}>
                    <PlusCircle size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>Add New Product</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>List new item on storefront</div>
                  </div>
                </div>
                <ArrowRight size={16} style={{ color: '#94a3b8' }} />
              </div>
            </Link>

            <Link to="/vendor/orders" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <Package size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>Manage Orders</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Check status and update tracking</div>
                  </div>
                </div>
                <ArrowRight size={16} style={{ color: '#94a3b8' }} />
              </div>
            </Link>

            <Link to="/vendor/inventory" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                    <AlertTriangle size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem' }}>Inventory Alerts</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Restock low variants immediately</div>
                  </div>
                </div>
                <ArrowRight size={16} style={{ color: '#94a3b8' }} />
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-welcome-card" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid rgba(192, 138, 116, 0.15)', background: 'linear-gradient(135deg, rgba(192, 138, 116, 0.04) 0%, rgba(192, 138, 116, 0.01) 100%)' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Tag size={20} style={{ color: '#C08A74' }} />
          Welcome to the Vendor Portal
        </h2>
        <p style={{ color: '#64748b', marginTop: '0.5rem', lineHeight: '1.6', fontSize: '0.875rem' }}>
          Your commission rate is set to <strong>{dashData?.commissionPercent ?? 10}%</strong>. Verify and edit your{' '}
          <Link to="/vendor/profile" style={{ color: '#C08A74', fontWeight: 600 }}>Store Profile</Link> details,
          monitor payouts in <Link to="/vendor/earnings" style={{ color: '#C08A74', fontWeight: 600 }}>Earnings</Link>, and review customer orders regularly.
        </p>
      </div>
    </div>
  );
};

export default VendorDashboard;
