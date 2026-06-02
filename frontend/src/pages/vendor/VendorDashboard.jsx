import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';
import api from '../../utils/api';
import '../admin/admin-pages.css';

const VendorDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/orders/stats');
        setStats({
          totalOrders: data.totalOrders,
          pendingOrders: data.totalPending,
          shippedOrders: data.totalShipped || 0,
          deliveredOrders: data.totalDelivered
        });
      } catch (err) {
        console.error('Error fetching vendor stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="admin-loading"><div className="spinner"></div></div>;
  }

  const statCards = [
    { title: 'Total Orders', value: stats.totalOrders, icon: <Package size={24} />, color: 'var(--ink)' },
    { title: 'Pending', value: stats.pendingOrders, icon: <Clock size={24} />, color: '#d97706' },
    { title: 'Shipped', value: stats.shippedOrders, icon: <Truck size={24} />, color: '#2563eb' },
    { title: 'Delivered', value: stats.deliveredOrders, icon: <CheckCircle size={24} />, color: '#16a34a' }
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Vendor Dashboard</h1>
        <p>Overview of your fulfillment performance</p>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((stat, index) => (
          <div key={index} className="admin-stat-card">
            <div className="stat-info">
              <h3>{stat.title}</h3>
              <p className="stat-value">{stat.value}</p>
            </div>
            <div className="stat-icon" style={{ color: stat.color, backgroundColor: `${stat.color}15` }}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>
      
      <div className="admin-welcome-card" style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--champagne)' }}>
        <h2>Welcome to the Vendor Portal</h2>
        <p style={{ color: 'var(--ink-muted)', marginTop: '0.5rem', lineHeight: '1.6' }}>
          Here you can view all incoming customer orders, update their fulfillment status, and add tracking information.
          Navigate to the <strong>Orders</strong> tab on the left to start fulfilling orders.
        </p>
      </div>
    </div>
  );
};

export default VendorDashboard;
