import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { vendor, refreshProfile } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/vendor/profile').then(({ data }) => {
      const v = data.vendor || data;
      const p = v.vendorProfile || {};
      setForm({
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
    });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        businessName: form.businessName,
        gstNumber: form.gstNumber,
        panNumber: form.panNumber,
        address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
        bankDetails: { accountHolder: form.accountHolder, accountNumber: form.accountNumber, ifsc: form.ifsc, bankName: form.bankName },
      };
      await api.put('/vendor/profile', payload);
      await refreshProfile();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="empty-state">Loading…</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Vendor Profile</h1>
          <p>Manage your business and payout details.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p style={{ margin: 0 }}>
          Status: <span className={`badge badge-${vendor?.vendorStatus}`}>{vendor?.vendorStatus}</span>
          {' '}· Commission rate: <strong>{vendor?.vendorProfile?.commissionPercent ?? 10}%</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-section-title">Business Details</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Business / Brand Name</label>
            <input name="businessName" required value={form.businessName} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>GST Number</label>
            <input name="gstNumber" value={form.gstNumber} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>PAN Number</label>
            <input name="panNumber" value={form.panNumber} onChange={handleChange} />
          </div>
        </div>

        <div className="form-section-title">Business Address</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Address Line 1</label>
            <input name="line1" value={form.line1} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Address Line 2</label>
            <input name="line2" value={form.line2} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>City</label>
            <input name="city" value={form.city} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>State</label>
            <input name="state" value={form.state} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Pincode</label>
            <input name="pincode" value={form.pincode} onChange={handleChange} />
          </div>
        </div>

        <div className="form-section-title">Bank Details (for payouts)</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Account Holder Name</label>
            <input name="accountHolder" value={form.accountHolder} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Account Number</label>
            <input name="accountNumber" value={form.accountNumber} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>IFSC Code</label>
            <input name="ifsc" value={form.ifsc} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Bank Name</label>
            <input name="bankName" value={form.bankName} onChange={handleChange} />
          </div>
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
      </form>
    </div>
  );
}
