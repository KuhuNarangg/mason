import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

const ITEM_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState({});

  const load = () => {
    setLoading(true);
    api.get(`/vendor/orders/${id}`)
      .then(({ data }) => setOrder(data.order || data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (itemId, newStatus) => {
    try {
      await api.put(`/vendor/orders/${id}/items/${itemId}/status`, { status: newStatus });
      toast.success(`Item marked as ${newStatus}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const saveTracking = async (itemId) => {
    const t = tracking[itemId];
    if (!t) return;
    try {
      await api.put(`/vendor/orders/${id}/items/${itemId}/tracking`, {
        trackingNumber: t.trackingNumber || '',
        shippingCarrier: t.shippingCarrier || '',
        shippingLabelUrl: t.shippingLabelUrl || '',
      });
      toast.success('Tracking info saved');
      setTracking((tr) => { const next = { ...tr }; delete next[itemId]; return next; });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save tracking');
    }
  };

  if (loading) return <div className="empty-state">Loading…</div>;
  if (!order) return <div className="empty-state">Order not found.</div>;

  const items = order.items || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/orders" className="btn btn-sm" style={{ marginBottom: 10 }}><ArrowLeft size={14} /> Back</Link>
          <h1>Order #{order.orderNumber || order._id.slice(-8)}</h1>
          <p>Placed on {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Shipping Address</h3>
        <p style={{ margin: 0 }}>
          {order.shippingAddress?.fullName}<br />
          {order.shippingAddress?.line1}{order.shippingAddress?.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
          {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}<br />
          Phone: {order.shippingAddress?.phone}
        </p>
      </div>

      {items.map((item) => {
        const trackVal = tracking[item._id] || {
          trackingNumber: item.trackingNumber || '',
          shippingCarrier: item.shippingCarrier || '',
          shippingLabelUrl: item.shippingLabelUrl || '',
        };
        const nextOptions = ITEM_TRANSITIONS[item.itemStatus] || [];
        return (
          <div className="card" key={item._id}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <img src={item.image} alt="" className="thumb" style={{ width: 72, height: 72 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <strong>{item.name}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                  Size: {item.size} · Color: {item.color} · Qty: {item.quantity}
                </div>
                <div style={{ marginTop: 4 }}>
                  {formatPrice(item.price)} each · Your earning: {formatPrice(item.vendorEarning)} (commission {item.commissionPercent}%)
                </div>
              </div>
              <div>
                <span className={`badge badge-${item.itemStatus}`}>{item.itemStatus}</span>
              </div>
            </div>

            {nextOptions.length > 0 && (
              <div className="form-section-title">Update Status</div>
            )}
            {nextOptions.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {nextOptions.map((s) => (
                  <button
                    key={s}
                    className={`btn btn-sm ${s === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
                    onClick={() => updateStatus(item._id, s)}
                  >
                    Mark as {s}
                  </button>
                ))}
              </div>
            )}

            {!['delivered', 'cancelled'].includes(item.itemStatus) && (
              <>
                <div className="form-section-title">Shipping / Tracking</div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Carrier</label>
                    <input
                      value={trackVal.shippingCarrier}
                      onChange={(e) => setTracking((tr) => ({ ...tr, [item._id]: { ...trackVal, shippingCarrier: e.target.value } }))}
                      placeholder="e.g. Delhivery, BlueDart"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tracking Number</label>
                    <input
                      value={trackVal.trackingNumber}
                      onChange={(e) => setTracking((tr) => ({ ...tr, [item._id]: { ...trackVal, trackingNumber: e.target.value } }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Shipping Label URL</label>
                    <input
                      value={trackVal.shippingLabelUrl}
                      onChange={(e) => setTracking((tr) => ({ ...tr, [item._id]: { ...trackVal, shippingLabelUrl: e.target.value } }))}
                    />
                  </div>
                </div>
                <button className="btn btn-sm" onClick={() => saveTracking(item._id)}>Save Tracking</button>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
                  Adding a tracking number will automatically mark this item as shipped.
                </p>
              </>
            )}

            {item.itemStatusHistory?.length > 0 && (
              <>
                <div className="form-section-title">History</div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--text-muted)' }}>
                  {item.itemStatusHistory.map((h, idx) => (
                    <li key={idx}>{h.status} — {new Date(h.timestamp).toLocaleString()}{h.note ? ` (${h.note})` : ''}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
