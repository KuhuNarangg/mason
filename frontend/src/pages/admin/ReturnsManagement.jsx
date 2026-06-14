import { useState, useEffect, useMemo } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'requested', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_BADGE = {
  requested: 'pending',
  approved: 'active',
  rejected: 'cancelled',
  completed: 'delivered',
};

const ReturnsManagement = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const [actionTarget, setActionTarget] = useState(null); // { item, action }
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    fetchReturns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/returns', { params: { status: filter || undefined } });
      setReturns(data.returns || []);
    } catch {
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  const counts = useMemo(() => {
    const c = { requested: 0, approved: 0, rejected: 0, completed: 0 };
    returns.forEach(r => { if (c[r.returnStatus] !== undefined) c[r.returnStatus]++; });
    return c;
  }, [returns]);

  const openAction = (item, action) => {
    setActionTarget({ item, action });
    setAdminNote('');
  };

  const submitAction = async () => {
    const { item, action } = actionTarget;
    const key = `${item.orderId}-${item.itemId}`;
    setBusyKey(key);
    try {
      await api.put(`/orders/${item.orderId}/return-item-handle`, {
        itemId: item.itemId,
        action,
        adminNote: adminNote.trim() || undefined,
      });
      toast.success(action === 'approve' ? 'Return approved & refund initiated' : 'Return rejected');
      setActionTarget(null);
      fetchReturns();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} return`);
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) return (
    <div className="admin-loading">
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading returns…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Returns</h1>
          <p className="admin-page-subtitle">{returns.length} return item{returns.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="admin-stats-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="admin-stat-card">
          <div className="stat-info"><h3>Pending Requests</h3><p className="stat-value">{counts.requested}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-info"><h3>Approved</h3><p className="stat-value">{counts.approved}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-info"><h3>Rejected</h3><p className="stat-value">{counts.rejected}</p></div>
        </div>
        <div className="admin-stat-card">
          <div className="stat-info"><h3>Completed</h3><p className="stat-value">{counts.completed}</p></div>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="filter-tabs">
          {FILTER_TABS.map((t) => (
            <button key={t.key} className={`filter-tab${filter === t.key ? ' active' : ''}`} onClick={() => setFilter(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Reason</th>
              <th>Refund</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No return requests found.</td></tr>
            ) : (
              returns.map((r) => {
                const key = `${r.orderId}-${r.itemId}`;
                return (
                  <tr key={key}>
                    <td className="table-cell-primary">#{r.orderNumber}</td>
                    <td>
                      <div className="table-cell-primary">{r.customer?.name}</div>
                      <div className="table-cell-secondary">{r.customer?.email}</div>
                    </td>
                    <td>
                      <div className="table-cell-primary">{r.product?.name}</div>
                      <div className="table-cell-secondary">{r.variantSize} / {r.variantColor} × {r.quantity}</div>
                    </td>
                    <td className="table-cell-secondary" style={{ maxWidth: 220 }}>{r.returnReason || '—'}</td>
                    <td>{r.refundAmount ? `₹${Number(r.refundAmount).toFixed(2)}` : '—'}</td>
                    <td>
                      <span className={`status-badge badge-${STATUS_BADGE[r.returnStatus] || 'pending'}`}>{r.returnStatus}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                        {r.returnStatus === 'requested' ? (
                          <>
                            <button className="btn-small" disabled={busyKey === key} title="Approve" onClick={() => openAction(r, 'approve')}>
                              <Check size={14} /> Approve
                            </button>
                            <button className="btn-small btn-danger" disabled={busyKey === key} title="Reject" onClick={() => openAction(r, 'reject')}>
                              <X size={14} /> Reject
                            </button>
                          </>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                            {r.returnAdminNote || '—'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Action modal */}
      {actionTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
              {actionTarget.action === 'approve' ? <><RotateCcw size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Approve Return</> : 'Reject Return'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 0, marginBottom: '1rem' }}>
              {actionTarget.action === 'approve'
                ? 'Stock will be restored and a refund will be initiated for this item.'
                : 'The customer will be notified that this return request was rejected.'}
            </p>
            <div className="form-group">
              <label>Note (optional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note for this decision…"
                autoFocus
              />
            </div>
            <div className="form-buttons">
              <button className="btn-cancel" onClick={() => setActionTarget(null)}>Cancel</button>
              <button className="btn-submit" disabled={!!busyKey} onClick={submitAction}>
                {busyKey ? 'Processing...' : (actionTarget.action === 'approve' ? 'Approve Return' : 'Reject Return')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsManagement;
