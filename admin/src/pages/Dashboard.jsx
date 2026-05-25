import { useState, useEffect } from 'react';
import { ShoppingCart, LayoutDashboard, Package, Users, Eye, X } from 'lucide-react';
import api from '../utils/api';
import './admin-pages.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductStock, setSelectedProductStock] = useState(null);

  useEffect(() => {
    api.get('/admin/dashboard').then(res => setStats(res.data)).catch(console.error);
  }, []);

  if (!stats) return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Dashboard Overview</h1>
      </div>
      
      {stats.returnRequestsCount > 0 && (
        <div style={{ 
          background: '#fff7ed', 
          borderLeft: '4px solid #f97316', 
          padding: '1rem 1.5rem', 
          marginBottom: '2rem', 
          borderRadius: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#f97316', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 }}>
              {stats.returnRequestsCount}
            </div>
            <p style={{ margin: 0, fontWeight: 600, color: '#9a3412' }}>
              Action Required: You have {stats.returnRequestsCount === 1 ? '1 pending return request' : `${stats.returnRequestsCount} pending return requests`} that need your approval.
            </p>
          </div>
          <a href="/admin/orders" style={{ 
            padding: '0.5rem 1rem', 
            background: 'white', 
            color: '#f97316', 
            textDecoration: 'none', 
            borderRadius: '0.25rem', 
            fontWeight: 600,
            border: '1px solid #fed7aa',
            fontSize: '0.9rem'
          }}>
            Review Now
          </a>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><ShoppingCart size={24}/></div>
          <div className="kpi-info"><h3>Total Orders</h3><p>{stats.totalOrders}</p></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{backgroundColor: '#e8f5e9', color: '#2e7d32'}}><LayoutDashboard size={24}/></div>
          <div className="kpi-info"><h3>Total Revenue</h3><p>₹{stats.totalRevenue.toLocaleString()}</p></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{backgroundColor: '#e3f2fd', color: '#1565c0'}}><Package size={24}/></div>
          <div className="kpi-info"><h3>Products</h3><p>{stats.totalProducts}</p></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{backgroundColor: '#fff3e0', color: '#ef6c00'}}><Users size={24}/></div>
          <div className="kpi-info"><h3>Customers</h3><p>{stats.totalUsers}</p></div>
        </div>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem'}}>
        <div style={{ background: 'white', padding: '1.5rem', border: '1px solid #e0d5ce', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600}}>Recent Orders</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr><td colSpan="3" className="no-data">No orders yet</td></tr>
              ) : (
                stats.recentOrders.map(o => (
                  <tr key={o._id}>
                    <td>{o.orderNumber || o._id.substring(0, 8)}</td>
                    <td>₹{o.totalAmount}</td>
                    <td><span style={{padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: '#e3f2fd', color: '#1565c0', fontWeight: 600}}>{o.status}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div style={{ background: 'white', padding: '1.5rem', border: '1px solid #e0d5ce', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600}}>Low Stock Alerts</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Low Stock</th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStockProducts.length === 0 ? (
                <tr><td colSpan="2" className="no-data">All stock levels good!</td></tr>
              ) : (
                stats.lowStockProducts.map(p => (
                  <tr key={p._id}>
                    <td>{p.name.substring(0, 25)}</td>
                    <td>
                      <button 
                        onClick={() => { setSelectedProductStock(p); setShowStockModal(true); }}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#ef4444', 
                          fontWeight: 700, 
                          cursor: 'pointer', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.4rem',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#fef2f2'}
                        onMouseOut={(e) => e.target.style.background = 'none'}
                      >
                        <Eye size={14} /> 
                        {p.variants.filter(v => v.stock <= 5).length} {p.variants.filter(v => v.stock <= 5).length === 1 ? 'variant' : 'variants'} low
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Details Modal */}
      {showStockModal && selectedProductStock && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setShowStockModal(false)}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Stock Details</h3>
              <button onClick={() => setShowStockModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>{selectedProductStock.name}</p>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Variant Stock Breakdown</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Size</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Color</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProductStock.variants.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#111827' }}>{v.size}</td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#111827' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: v.colorHex || '#000', border: '1px solid #e5e7eb' }}></div>
                          {v.color}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '0.75rem', 
                        fontSize: '0.875rem', 
                        textAlign: 'right', 
                        fontWeight: v.stock <= 5 ? 700 : 500,
                        color: v.stock <= 5 ? '#ef4444' : '#111827'
                      }}>
                        {v.stock}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
              <button 
                onClick={() => setShowStockModal(false)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#374151',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
