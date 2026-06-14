import { useState, useEffect } from 'react';
import { ArrowLeft, IndianRupee, CheckSquare, Square } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const VendorSettlements = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null); // { vendorId, name, pendingItems, history }
  const [detailLoading, setDetailLoading] = useState(false);
  const [selected, setSelected] = useState({}); // itemId -> true
  const [reference, setReference] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { fetchOverview(); }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/settlements/overview');
      setVendors(data.vendors || []);
    } catch {
      toast.error('Failed to fetch settlements overview');
    } finally {
      setLoading(false);
    }
  };

  const openVendor = async (vendor) => {
    setDetailLoading(true);
    setDetail({ vendorId: vendor._id, name: vendor.name, email: vendor.email });
    setSelected({});
    setReference(''); setNote('');
    try {
      const { data } = await api.get(`/admin/settlements/vendor/${vendor._id}`);
      setDetail(prev => ({ ...prev, pendingItems: data.pendingItems || [], history: data.history || [] }));
    } catch {
      toast.error('Failed to fetch vendor settlement details');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleItem = (item) => {
    const key = `${item.orderId}-${item.itemId}`;
    setSelected(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    if (!detail?.pendingItems) return;
    const allSelected = detail.pendingItems.every(i => selected[`${i.orderId}-${i.itemId}`]);
    const next = {};
    if (!allSelected) {
      detail.pendingItems.forEach(i => { next[`${i.orderId}-${i.itemId}`] = true; });
    }
    setSelected(next);
  };

  const selectedItems = detail?.pendingItems?.filter(i => selected[`${i.orderId}-${i.itemId}`]) || [];
  const selectedTotal = selectedItems.reduce((sum, i) => sum + (i.vendorEarning || 0), 0);

  const submitSettlement = async () => {
    if (selectedItems.length === 0) return toast.error('Select at least one item');
    setBusy(true);
    try {
      await api.post(`/admin/settlements/vendor/${detail.vendorId}/settle`, {
        items: selectedItems.map(i => ({ orderId: i.orderId, itemId: i.itemId })),
        method, reference: reference.trim(), note: note.trim(),
      });
      toast.success('Settlement recorded');
      fetchOverview();
      openVendor({ _id: detail.vendorId, name: detail.name, email: detail.email });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record settlement');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return (
    <div className="admin-loading">
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading settlements…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (detail) {
    return (
      <div>
        <div className="page-header" style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-start' }}>
          <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="admin-page-title" style={{ margin: 0 }}>{detail.name}</h2>
            <p className="admin-page-subtitle" style={{ margin: 0 }}>{detail.email}</p>
          </div>
        </div>

        {detailLoading ? (
          <div className="admin-loading"><div className="spinner"></div></div>
        ) : (
          <>
            <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0 }}>Pending Payout Items</h3>
                <button className="btn-small" onClick={toggleAll}>
                  {detail.pendingItems?.length && detail.pendingItems.every(i => selected[`${i.orderId}-${i.itemId}`])
                    ? <><CheckSquare size={14} /> Deselect All</>
                    : <><Square size={14} /> Select All</>}
                </button>
              </div>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Order</th>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Status</th>
                      <th>Earning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!detail.pendingItems || detail.pendingItems.length === 0) ? (
                      <tr><td colSpan="6" className="no-data">No pending payouts.</td></tr>
                    ) : (
                      detail.pendingItems.map(item => {
                        const key = `${item.orderId}-${item.itemId}`;
                        return (
                          <tr key={key}>
                            <td>
                              <input type="checkbox" checked={!!selected[key]} onChange={() => toggleItem(item)} />
                            </td>
                            <td className="table-cell-primary">#{item.orderNumber}</td>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td><span className="status-badge badge-pending">{item.itemStatus}</span></td>
                            <td>₹{Number(item.vendorEarning || 0).toFixed(2)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {detail.pendingItems?.length > 0 && (
                <div style={{ marginTop: '1.25rem' }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Payout Method</label>
                      <select className="form-select" value={method} onChange={e => setMethod(e.target.value)}>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="upi">UPI</option>
                        <option value="manual">Manual / Other</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Reference / UTR</label>
                      <input className="form-input" value={reference} onChange={e => setReference(e.target.value)} placeholder="Transaction reference" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Note (optional)</label>
                    <textarea className="form-textarea" rows={2} value={note} onChange={e => setNote(e.target.value)} />
                  </div>
                  <div className="form-buttons" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>
                      Selected total: ₹{selectedTotal.toFixed(2)} ({selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''})
                    </div>
                    <button className="btn-primary" disabled={busy || selectedItems.length === 0} onClick={submitSettlement}>
                      <IndianRupee size={14} /> {busy ? 'Recording...' : 'Mark as Paid'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-container" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Settlement History</h3>
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Items</th>
                      <th>Method</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!detail.history || detail.history.length === 0) ? (
                      <tr><td colSpan="5" className="no-data">No settlements recorded yet.</td></tr>
                    ) : (
                      detail.history.map(h => (
                        <tr key={h._id}>
                          <td className="table-cell-secondary">{new Date(h.createdAt).toLocaleString()}</td>
                          <td className="table-cell-primary">₹{Number(h.amount).toFixed(2)}</td>
                          <td>{h.itemCount}</td>
                          <td style={{ textTransform: 'capitalize' }}>{h.method?.replace('_', ' ')}</td>
                          <td className="table-cell-secondary">{h.reference || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Vendor Settlements</h1>
          <p className="admin-page-subtitle">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} with pending payouts</p>
        </div>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Pending Items</th>
              <th>Pending Amount</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 ? (
              <tr><td colSpan="4" className="no-data">No pending payouts. All vendors are settled up.</td></tr>
            ) : (
              vendors.map(v => (
                <tr key={v._id}>
                  <td>
                    <div className="table-cell-primary">{v.name}</div>
                    <div className="table-cell-secondary">{v.email}</div>
                  </td>
                  <td>{v.itemCount}</td>
                  <td className="table-cell-primary">₹{Number(v.pendingAmount || 0).toFixed(2)}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn-small" onClick={() => openVendor(v)}>View &amp; Settle</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VendorSettlements;
