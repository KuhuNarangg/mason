import { useState, useEffect } from 'react';
import { Trash2, Plus, X, Ticket } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import '../pages/admin-pages.css';

const CouponsManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '0',
    expiryDate: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/coupons');
      setCoupons(data.coupons);
    } catch {
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', form);
      toast.success('Coupon created successfully');
      setForm({ code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '0', expiryDate: '' });
      setShowForm(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      try {
        await api.delete(`/coupons/${id}`);
        toast.success('Coupon deleted');
        fetchCoupons();
      } catch {
        toast.error('Failed to delete coupon');
      }
    }
  };

  if (loading) return <div className="admin-page-title">Loading...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="admin-page-title" style={{ margin: 0 }}>Coupons Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={20} /> Create New Coupon
        </button>
      </div>

      {showForm && (
        <div className="form-container" style={{ marginBottom: '2rem', animation: 'slideDown 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>Add New Coupon</h2>
            <button onClick={() => setShowForm(false)} className="btn-icon"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Coupon Code (e.g., WELCOME10)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={form.code} 
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
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
                <label>Discount Value</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={form.discountValue} 
                  onChange={e => setForm({ ...form, discountValue: e.target.value })} 
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
                  required 
                />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={form.expiryDate} 
                  onChange={e => setForm({ ...form, expiryDate: e.target.value })} 
                  required 
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn-submit">Create Coupon</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Min Order</th>
              <th>Expires</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr><td colSpan="6" className="no-data">No coupons found</td></tr>
            ) : (
              coupons.map(coupon => (
                <tr key={coupon._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      <Ticket size={16} /> {coupon.code}
                    </div>
                  </td>
                  <td>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                  <td>₹{coupon.minOrderAmount}</td>
                  <td>{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      background: new Date(coupon.expiryDate) > new Date() ? '#e8f5e9' : '#ffebee',
                      color: new Date(coupon.expiryDate) > new Date() ? '#2e7d32' : '#c62828'
                    }}>
                      {new Date(coupon.expiryDate) > new Date() ? 'Active' : 'Expired'}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(coupon._id)} className="btn-icon btn-danger" title="Delete">
                      <Trash2 size={18} />
                    </button>
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

export default CouponsManagement;
