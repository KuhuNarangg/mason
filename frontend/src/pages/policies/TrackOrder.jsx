import { useState } from 'react';
import api from '../../utils/api';
import './PolicyPage.css';

const TrackOrder = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrderData(null);
    try {
      const { data } = await api.post('/orders/track', { orderId, email });
      setOrderData(data.order);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to find order. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'processing': return '#8b5cf6';
      case 'shipped': return '#0ea5e9';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      case 'returned': return '#64748b';
      default: return '#6b7280';
    }
  };

  return (
    <div className="policy-page fade-in">
      <div className="container policy-container">
        <h1 className="policy-title">Track Your Order</h1>
        <div className="policy-content">
          <p style={{ textAlign: 'center' }}>Enter your order ID and email address to track the status of your shipment.</p>
          
          <form className="policy-form" onSubmit={handleTrack} style={{ maxWidth: '400px', margin: '2rem auto' }}>
            <input 
              type="text" 
              placeholder="Order ID (e.g. ORD12345)" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required 
            />
            <input 
              type="email" 
              placeholder="Billing Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? 'Tracking...' : 'Track Order'}
            </button>
            {error && <div style={{ color: 'var(--color-danger)', textAlign: 'center', marginTop: '0.5rem', fontWeight: 500 }}>{error}</div>}
          </form>

          {orderData && (
            <div style={{ marginTop: '3rem', padding: '2rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-alt)' }}>
              <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Order: {orderData.orderNumber}</span>
                <span style={{ 
                  fontSize: '0.9rem', 
                  padding: '0.4rem 1rem', 
                  borderRadius: '999px', 
                  background: `${getStatusColor(orderData.status)}20`, 
                  color: getStatusColor(orderData.status),
                  textTransform: 'uppercase',
                  fontWeight: 700
                }}>
                  {orderData.status}
                </span>
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Date Placed</h4>
                  <p style={{ fontWeight: 500 }}>{new Date(orderData.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</h4>
                  <p style={{ fontWeight: 500 }}>₹{orderData.totalAmount}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Status</h4>
                  <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{orderData.paymentStatus}</p>
                </div>
              </div>

              {orderData.statusHistory && orderData.statusHistory.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--color-secondary)' }}>Tracking History</h4>
                  <div style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid var(--color-primary-light)' }}>
                    {orderData.statusHistory.map((history, idx) => (
                      <div key={idx} style={{ position: 'relative', marginBottom: idx === orderData.statusHistory.length - 1 ? 0 : '1.5rem' }}>
                        <div style={{ position: 'absolute', left: '-29px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--color-primary)' }}></div>
                        <p style={{ margin: 0, fontWeight: 600, textTransform: 'capitalize', color: 'var(--color-text)' }}>{history.status}</p>
                        <p style={{ margin: '0.25rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{history.note || 'Status updated'}</p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-light)' }}>
                          {new Date(history.timestamp).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
            <p>If you don't know your order ID, please check the confirmation email sent to you after your purchase, or login to your account and visit the Orders section.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
