import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import '../admin/admin-pages.css';

const ITEM_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const badgeClass = (status) => (status === 'packed' ? 'processing' : status);

const VendorOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({});

  const [orderTrackingUrl, setOrderTrackingUrl] = useState('');
  const [uploadingBill, setUploadingBill] = useState(false);
  const [orderBillUrl, setOrderBillUrl] = useState('');

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/vendor/orders/${id}`);
      setOrder(data.order);
      setOrderTrackingUrl(data.order.trackingUrl || '');
      setOrderBillUrl(data.order.billUrl || '');
      const t = {};
      data.order.items.forEach((it) => {
        t[it._id] = { trackingNumber: it.trackingNumber || '', shippingCarrier: it.shippingCarrier || '' };
      });
      setTracking(t);
    } catch {
      toast.error('Failed to load order');
      navigate('/vendor/orders');
    } finally {
      setLoading(false);
    }
  };

  const saveOrderTracking = async () => {
    try {
      await api.put(`/orders/${id}/tracking`, { trackingUrl: orderTrackingUrl });
      toast.success('Order tracking URL updated');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order tracking URL');
    }
  };

  const handleBillUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingBill(true);
    try {
      const { data: uploadData } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await api.put(`/vendor/orders/${id}/bill`, { billUrl: uploadData.url });
      toast.success('Bill / Invoice uploaded successfully');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload bill');
    } finally {
      setUploadingBill(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!confirm('Are you sure you want to remove the bill for this order?')) return;
    try {
      await api.put(`/vendor/orders/${id}/bill`, { billUrl: '' });
      toast.success('Bill removed successfully');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove bill');
    }
  };

  const updateStatus = async (itemId, status) => {
    const note = prompt(`Add a note for transitioning to "${status}" (optional):`) || '';
    try {
      await api.put(`/vendor/orders/${id}/items/${itemId}/status`, { status, note });
      toast.success(`Item status updated to ${status}`);
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const saveTracking = async (itemId) => {
    const { trackingNumber, shippingCarrier } = tracking[itemId] || {};
    try {
      await api.put(`/vendor/orders/${id}/items/${itemId}/tracking`, { trackingNumber, shippingCarrier });
      toast.success('Tracking info saved');
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save tracking');
    }
  };

  const handleReturnAction = async (itemId, action) => {
    const adminNote = prompt(`Enter a note for this return ${action} (optional):`) || '';
    try {
      await api.put(`/orders/${id}/return-item-handle`, { itemId, action, adminNote });
      toast.success(`Return request ${action}ed successfully`);
      fetchOrder();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update return status');
    }
  };

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;
  if (!order) return null;

  return (
    <div>
      <div className="page-header">
        <button onClick={() => navigate('/vendor/orders')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#C08A74', fontWeight: 'bold', fontSize: '1rem' }}>
          <ArrowLeft size={20} /> Back to Orders
        </button>
      </div>

      <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Order #{order.orderNumber}</h2>
        <div className="stat-row"><span className="stat-label">Customer</span><span className="stat-value">{order.user?.name} ({order.user?.email})</span></div>
        <div className="stat-row"><span className="stat-label">Placed On</span><span className="stat-value">{new Date(order.createdAt).toLocaleString()}</span></div>
        <div className="stat-row"><span className="stat-label">Payment Status</span><span className={`status-badge badge-${order.paymentStatus === 'paid' ? 'paid' : 'unpaid'}`}>{order.paymentStatus}</span></div>
        {order.shippingAddress && (
          <div className="stat-row">
            <span className="stat-label">Shipping Address</span>
            <span className="stat-value">
              {[order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Fulfilment & Billing</h3>
        <div className="form-row" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 280 }}>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.9rem' }}>Order Tracking Link</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                value={orderTrackingUrl}
                onChange={(e) => setOrderTrackingUrl(e.target.value)}
                placeholder="e.g. https://track.delhivery.com/..."
              />
              <button className="btn-primary" style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem' }} onClick={saveOrderTracking}>Save Link</button>
            </div>
            {order.trackingUrl && (
              <div style={{ marginTop: '0.375rem', fontSize: '0.825rem' }}>
                Active Link: <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#C08A74', fontWeight: 600 }}>Track Order ↗</a>
              </div>
            )}
          </div>
          
          <div className="form-group" style={{ flex: 1, minWidth: 280 }}>
            <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.9rem' }}>Order Bill / Invoice</label>
            {orderBillUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '0.5rem', borderRadius: '4px', border: '1px dashed #cbd5e1', height: '38px', boxSizing: 'border-box' }}>
                <a href={orderBillUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#C08A74', fontWeight: 600, fontSize: '0.9rem' }}>
                  View Uploaded Bill ↗
                </a>
                <button
                  onClick={handleDeleteBill}
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Delete
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  id="bill-upload-input"
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={handleBillUpload}
                  disabled={uploadingBill}
                />
                <button
                  className="btn-small"
                  onClick={() => document.getElementById('bill-upload-input').click()}
                  disabled={uploadingBill}
                  style={{ width: '100%', padding: '0.5rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#475569', height: '38px', fontWeight: 500 }}
                >
                  {uploadingBill ? 'Uploading...' : '📁 Upload Bill (Image)'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Your Items</h3>
      {order.items.map((item) => {
        const allowed = ITEM_TRANSITIONS[item.itemStatus] || [];
        return (
          <div key={item._id} className="order-item-card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <img src={item.image || 'https://placehold.co/60?text=No+Image'} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid #e0d5ce' }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600 }}>{item.name}</div>
                <div className="table-cell-secondary">Size: {item.variantSize} · Color: {item.variantColor} · Qty: {item.quantity}</div>
                <div className="table-cell-secondary">Price: ₹{item.price} · Your Earning: ₹{item.vendorEarning?.toFixed?.(2) ?? item.vendorEarning}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <span className={`status-badge badge-${badgeClass(item.itemStatus)}`}>{item.itemStatus}</span>
                {allowed.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {allowed.map((s) => (
                      <button key={s} className="btn-small" onClick={() => updateStatus(item._id, s)}>
                        Mark {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Tracking */}
            <div className="form-row" style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label>Tracking Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={tracking[item._id]?.trackingNumber || ''}
                  onChange={(e) => setTracking({ ...tracking, [item._id]: { ...tracking[item._id], trackingNumber: e.target.value } })}
                  placeholder="Enter tracking number"
                />
              </div>
              <div className="form-group">
                <label>Shipping Carrier</label>
                <input
                  type="text"
                  className="form-input"
                  value={tracking[item._id]?.shippingCarrier || ''}
                  onChange={(e) => setTracking({ ...tracking, [item._id]: { ...tracking[item._id], shippingCarrier: e.target.value } })}
                  placeholder="e.g. Delhivery, BlueDart"
                />
              </div>
              <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                <label>&nbsp;</label>
                <button className="btn-primary" onClick={() => saveTracking(item._id)}>Save Tracking</button>
              </div>
            </div>

            {/* Return Request / Status */}
            {item.returnStatus === 'requested' && (
              <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#fffbeb', border: '1px dashed #d97706', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      ↩ Return Requested
                    </div>
                    {item.returnReason && (
                      <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '0.25rem' }}>
                        Reason: {item.returnReason}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-small"
                      onClick={() => handleReturnAction(item._id, 'approve')}
                      style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Approve Return
                    </button>
                    <button
                      className="btn-small"
                      onClick={() => handleReturnAction(item._id, 'reject')}
                      style={{ background: '#ef4444', color: 'white', border: 'none', padding: '0.4rem 1rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reject Return
                    </button>
                  </div>
                </div>
              </div>
            )}

            {item.returnStatus && item.returnStatus !== 'none' && item.returnStatus !== 'requested' && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: item.returnStatus === 'approved' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${item.returnStatus === 'approved' ? '#bcf0da' : '#fbcfe8'}`, borderRadius: '6px' }}>
                <div style={{ fontSize: '0.8rem', color: item.returnStatus === 'approved' ? '#03543f' : '#981b1b', fontWeight: 500 }}>
                  <strong>Return {item.returnStatus.charAt(0).toUpperCase() + item.returnStatus.slice(1)}:</strong> {item.returnAdminNote || 'No notes added.'}
                  {item.refundAmount > 0 && ` Refund of ₹${item.refundAmount} initiated.`}
                </div>
              </div>
            )}

            {/* History */}
            {item.itemStatusHistory?.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <div className="stat-label" style={{ marginBottom: '0.4rem' }}>Status History</div>
                {item.itemStatusHistory.map((h, idx) => (
                  <div key={idx} className="table-cell-secondary" style={{ fontSize: '0.8rem' }}>
                    {new Date(h.timestamp).toLocaleString()} — <strong>{h.status}</strong>{h.note ? ` (${h.note})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VendorOrderDetail;
