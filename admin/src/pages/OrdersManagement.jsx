import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get(`/orders?status=${filter}&limit=50`);
      setOrders(data.orders);
    } catch {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    let note = '';
    
    if (status === 'return_rejected') {
      note = window.prompt("Please provide a reason for rejecting this return:");
      if (note === null) return;
      if (note.trim() === '') note = 'Return request rejected';
    } else {
      note = window.prompt(`Add a note for this status update to '${status}' (optional):`) || `Order is now ${status}`;
    }

    try {
      await api.put(`/orders/${orderId}/status`, { status, note });
      toast.success('Order status updated');
      fetchOrders();
    } catch {
      toast.error('Failed to update order');
    }
  };

  const handleCancellation = async (orderId, action) => {
    const adminNote = window.prompt(`Please provide a note for ${action === 'approve' ? 'approving' : 'rejecting'} this cancellation (optional):`) || '';
    try {
      await api.put(`/orders/${orderId}/cancel-handle`, { action, adminNote });
      toast.success(`Cancellation request ${action}ed`);
      fetchOrders();
    } catch {
      toast.error('Failed to process cancellation');
    }
  };

  const handleItemReturnAction = async (orderId, itemId, action) => {
    const adminNote = window.prompt(`Note for ${action === 'approve' ? 'approving' : 'rejecting'} this item return (optional):`) || '';
    try {
      await api.put(`/orders/${orderId}/return-item-handle`, { itemId, action, adminNote });
      toast.success(`Item return ${action}d successfully`);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process item return');
    }
  };

  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'cancel_requested', 'return_requested', 'return_rejected', 'returned'];

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Orders Management</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancel_requested', 'return_requested'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                background: filter === status ? '#2563eb' : '#e5e7eb',
                color: filter === status ? 'white' : '#333',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
              }}
            >
              {status || 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi-card" style={{ display: 'block' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', background: '#f9fafb' }}>
              <th style={{ padding: '1rem 0' }}>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem 0' }}>
                  <button
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                    style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer' }}
                  >
                    {order.orderNumber || order._id.substring(0, 8)}
                  </button>
                </td>
                <td>{order.user?.name}</td>
                <td>₹{order.totalAmount}</td>
                <td>
                  <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: order.paymentStatus === 'paid' ? '#d1fae5' : '#fed7aa', color: order.paymentStatus === 'paid' ? '#065f46' : '#92400e' }}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ddd' }}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {expandedId === order._id ? '▼' : '▶'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {expandedId && (
        <div style={{ marginTop: '2rem', background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem' }}>
          {orders
            .filter((o) => o._id === expandedId)
            .map((order) => (
              <div key={order._id}>
                <h3>Order Details - {order.orderNumber}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
                  <div>
                    <h4>Items</h4>
                    {order.items.map((item, idx) => {
                      const rStatus = item.returnStatus || 'none';
                      const statusColors = { none: '#6b7280', requested: '#f59e0b', approved: '#10b981', rejected: '#ef4444', completed: '#3b82f6' };
                      return (
                      <div key={idx} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '0.5rem', border: '1px solid #eee' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span><strong>{item.name}</strong> x {item.quantity} @ ₹{item.price}</span>
                          <span style={{ fontSize: '0.7rem', color: '#888' }}>{item.variantSize} / {item.variantColor}</span>
                        </div>
                        {rStatus !== 'none' && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                              background: rStatus === 'requested' ? '#fef3c7' : rStatus === 'approved' ? '#d1fae5' : '#fee2e2',
                              color: statusColors[rStatus],
                            }}>
                              Return: {rStatus.charAt(0).toUpperCase() + rStatus.slice(1)}
                            </span>
                            {item.returnReason && <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#666' }}>Reason: {item.returnReason}</p>}
                            {item.returnAdminNote && <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>Admin: {item.returnAdminNote}</p>}
                            {rStatus === 'requested' && (
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button onClick={() => handleItemReturnAction(order._id, item._id, 'approve')} style={{ padding: '4px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                  ✓ Approve Return
                                </button>
                                <button onClick={() => handleItemReturnAction(order._id, item._id, 'reject')} style={{ padding: '4px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                  ✕ Reject Return
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })}
                  </div>
                  <div>
                    <h4>Shipping Address</h4>
                    <p>{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.line1}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
                    </p>
                  </div>
                </div>

                {order.status === 'cancel_requested' && (
                  <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '0.5rem' }}>
                    <h4 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Cancellation Request</h4>
                    <p style={{ margin: '0.25rem 0' }}><strong>Reason:</strong> {order.cancellationRequest?.reason}</p>
                    <p style={{ margin: '0.25rem 0' }}><strong>Requested At:</strong> {new Date(order.cancellationRequest?.requestedAt).toLocaleString()}</p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button onClick={() => handleCancellation(order._id, 'approve')} style={{ padding: '0.5rem 1.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Approve Cancellation (Refund)
                      </button>
                      <button onClick={() => handleCancellation(order._id, 'reject')} style={{ padding: '0.5rem 1.5rem', background: '#4b5563', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Reject Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;
