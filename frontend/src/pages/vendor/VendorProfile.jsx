import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import '../admin/admin-pages.css';

const VendorProfile = () => {
  const { user, setAuthUser, token } = useAuth();
  const [form, setForm] = useState(null);
  const [vendorMeta, setVendorMeta] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendor/profile').then(({ data }) => {
      const v = data.vendor;
      const p = v.vendorProfile || {};
      setVendorMeta(v);
      setForm({
        name: v.name || '',
        phone: v.phone || '',
        businessName: p.businessName || '',
        gstNumber: p.gstNumber || '',
        panNumber: p.panNumber || '',
        line1: p.address?.line1 || '',
        line2: p.address?.line2 || '',
        city: p.address?.city || '',
        state: p.address?.state || '',
        pincode: p.address?.pincode || '',
        accountHolder: p.bankDetails?.accountHolder || '',
        accountNumber: p.bankDetails?.accountNumber || '',
        ifsc: p.bankDetails?.ifsc || '',
        bankName: p.bankDetails?.bankName || '',
      });
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone,
        businessName: form.businessName,
        gstNumber: form.gstNumber,
        panNumber: form.panNumber,
        address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
        bankDetails: { accountHolder: form.accountHolder, accountNumber: form.accountNumber, ifsc: form.ifsc, bankName: form.bankName },
      };
      const { data } = await api.put('/vendor/profile', payload);
      setVendorMeta(data.vendor);
      setAuthUser(token, data.vendor);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Vendor Profile</h1>
      </div>

      <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div className="stat-row">
          <span className="stat-label">Account Status</span>
          <span className={`status-badge badge-${vendorMeta?.vendorStatus === 'approved' ? 'active' : vendorMeta?.vendorStatus === 'pending' ? 'pending' : 'inactive'}`}>
            {vendorMeta?.vendorStatus}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Commission Rate</span>
          <span className="stat-value">{vendorMeta?.vendorProfile?.commissionPercent ?? 10}%</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-container" style={{ padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Account Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Contact Name</label>
            <input name="name" className="form-input" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" className="form-input" value={form.phone} onChange={handleChange} />
          </div>
        </div>

        <h3 style={{ margin: '1.5rem 0 1rem' }}>Business Details</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Business / Brand Name</label>
            <input name="businessName" className="form-input" value={form.businessName} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>GST Number</label>
            <input name="gstNumber" className="form-input" value={form.gstNumber} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>PAN Number</label>
            <input name="panNumber" className="form-input" value={form.panNumber} onChange={handleChange} />
          </div>
        </div>

        <h3 style={{ margin: '1.5rem 0 1rem' }}>Business Address</h3>
        <div className="form-row">
          <div className="form-group"><label>Address Line 1</label><input name="line1" className="form-input" value={form.line1} onChange={handleChange} /></div>
          <div className="form-group"><label>Address Line 2</label><input name="line2" className="form-input" value={form.line2} onChange={handleChange} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>City</label><input name="city" className="form-input" value={form.city} onChange={handleChange} /></div>
          <div className="form-group"><label>State</label><input name="state" className="form-input" value={form.state} onChange={handleChange} /></div>
          <div className="form-group"><label>Pincode</label><input name="pincode" className="form-input" value={form.pincode} onChange={handleChange} /></div>
        </div>

        <h3 style={{ margin: '1.5rem 0 1rem' }}>Bank Details (for payouts)</h3>
        <div className="form-row">
          <div className="form-group"><label>Account Holder Name</label><input name="accountHolder" className="form-input" value={form.accountHolder} onChange={handleChange} /></div>
          <div className="form-group"><label>Account Number</label><input name="accountNumber" className="form-input" value={form.accountNumber} onChange={handleChange} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>IFSC Code</label><input name="ifsc" className="form-input" value={form.ifsc} onChange={handleChange} /></div>
          <div className="form-group"><label>Bank Name</label><input name="bankName" className="form-input" value={form.bankName} onChange={handleChange} /></div>
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  );
};

export default VendorProfile;
