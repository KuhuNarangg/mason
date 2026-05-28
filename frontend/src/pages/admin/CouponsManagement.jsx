import { useState, useEffect } from 'react';
import { Trash2, Plus, X, Ticket, Tag, Pencil } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const EMPTY_FORM = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '0',
  expiryDate: '',
};

const CouponsManagement = () => {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create mode, id = edit mode
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons');
      setCoupons(data.coupons || []);
    } catch {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (coupon) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderAmount: String(coupon.minOrderAmount),
      expiryDate: coupon.expiryDate ? coupon.expiryDate.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/coupons/${editingId}`, form);
        toast.success('Coupon updated');
      } else {
        await api.post('/coupons', form);
        toast.success('Coupon created');
      }
      closeForm();
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${editingId ? 'update' : 'create'} coupon`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  if (loading) return (
    <div className="admin-loading">
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const active  = coupons.filter(c => !isExpired(c.expiryDate));
  const expired = coupons.filter(c => isExpired(c.expiryDate));

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Coupons</h1>
          <p className="admin-page-subtitle">
            {active.length} active · {expired.length} expired
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="form-container">
          <div className="form-header">
            <h3 className="form-header-title">
              <Tag size={16} style={{ verticalAlign:'middle', marginRight:8 }} />
              {editingId ? 'Edit Coupon' : 'New Coupon'}
            </h3>
            <button onClick={closeForm} className="btn-icon-sm">
              <X size={18}/>
            </button>
          </div>
          <div className="form-body">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Coupon Code *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
                    placeholder="e.g. WELCOME20"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Discount Type</label>
                  <select
                    className="form-select"
                    value={form.discountType}
                    onChange={e => setForm({ ...form, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.discountValue}
                    onChange={e => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 200'}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Min Order Amount (₹)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.minOrderAmount}
                    onChange={e => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="0 = no minimum"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.expiryDate}
                    onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? (editingId ? 'Saving…' : 'Creating…') : (editingId ? 'Save Changes' : 'Create Coupon')}
                </button>
                <button type="button" onClick={closeForm} className="btn-cancel">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Expiry</th>
              <th>Status</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan="6" className="no-data">No coupons yet — create one above.</td></tr>
            ) : (
              coupons.map(coupon => {
                const expired = isExpired(coupon.expiryDate);
                return (
                  <tr key={coupon._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <Ticket size={14} color={expired ? '#94a3b8' : '#C08A74'} />
                        <span style={{ fontWeight:700, fontFamily:'monospace', fontSize:'0.9rem', color: expired ? '#94a3b8' : '#0f172a', letterSpacing:'0.5px' }}>
                          {coupon.code}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight:600, color:'#C08A74' }}>
                        {coupon.discountType === 'percentage'
                          ? `${coupon.discountValue}% off`
                          : `₹${coupon.discountValue} off`}
                      </span>
                    </td>
                    <td style={{ fontSize:'0.875rem', color:'#374151' }}>
                      {coupon.minOrderAmount > 0
                        ? `₹${coupon.minOrderAmount} min`
                        : <span style={{ color:'#94a3b8' }}>No minimum</span>}
                    </td>
                    <td style={{ fontSize:'0.875rem', color: expired ? '#ef4444' : '#374151' }}>
                      {new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </td>
                    <td>
                      <span className={`status-badge ${expired ? 'badge-expired' : 'badge-active'}`}>
                        {expired ? 'Expired' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.5rem' }}>
                        <button
                          onClick={() => openEdit(coupon)}
                          className="btn-icon-sm"
                          title="Edit Coupon"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="btn-icon-sm delete"
                          title="Delete Coupon"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouponsManagement;
