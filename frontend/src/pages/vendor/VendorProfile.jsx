import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
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

  /* ── Security section state ── */
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [passForm,  setPassForm]  = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [codeForm,  setCodeForm]  = useState({ newCode: '', confirmCode: '', currentPassword: '' });
  const [secSaving, setSecSaving] = useState({ email: false, pass: false, code: false });

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

  const handleChangeEmail = async (e) => {
    e.preventDefault();
    setSecSaving(s => ({ ...s, email: true }));
    try {
      const { data } = await api.put('/auth/change-email', emailForm);
      setAuthUser(token, data.user);
      setEmailForm({ newEmail: '', currentPassword: '' });
      toast.success('Email updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update email');
    } finally {
      setSecSaving(s => ({ ...s, email: false }));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New passwords do not match'); return;
    }
    setSecSaving(s => ({ ...s, pass: true }));
    try {
      await api.put('/auth/change-password', { oldPassword: passForm.oldPassword, newPassword: passForm.newPassword });
      setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSecSaving(s => ({ ...s, pass: false }));
    }
  };

  const handleChangeCode = async (e) => {
    e.preventDefault();
    if (codeForm.newCode !== codeForm.confirmCode) {
      toast.error('Codes do not match'); return;
    }
    setSecSaving(s => ({ ...s, code: true }));
    try {
      await api.put('/auth/change-access-code', { newCode: codeForm.newCode, currentPassword: codeForm.currentPassword });
      setCodeForm({ newCode: '', confirmCode: '', currentPassword: '' });
      toast.success('Vendor access code updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update access code');
    } finally {
      setSecSaving(s => ({ ...s, code: false }));
    }
  };

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

      {/* ── Account Security ── */}
      <div style={{ marginTop: '2rem' }}>
        <h2 className="admin-page-title" style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} /> Account Security
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem', marginTop: '-0.75rem' }}>
          Current login email: <strong>{user?.email}</strong>
        </p>

        {/* Change Email */}
        <form onSubmit={handleChangeEmail} className="form-container" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.95rem' }}>Change Login Email</h3>
          <div className="form-row">
            <div className="form-group">
              <label>New Email Address</label>
              <input className="form-input" type="email" required
                value={emailForm.newEmail}
                onChange={e => setEmailForm(f => ({ ...f, newEmail: e.target.value }))}
                placeholder="Enter new email" />
            </div>
            <div className="form-group">
              <label>Current Password (to confirm)</label>
              <input className="form-input" type="password" required
                value={emailForm.currentPassword}
                onChange={e => setEmailForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Enter current password" />
            </div>
          </div>
          <div className="form-buttons" style={{ paddingTop: 0 }}>
            <button type="submit" className="btn-submit" disabled={secSaving.email}>
              {secSaving.email ? 'Updating…' : 'Update Email'}
            </button>
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="form-container" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '0.95rem' }}>Change Password</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Current Password</label>
              <input className="form-input" type="password" required
                value={passForm.oldPassword}
                onChange={e => setPassForm(f => ({ ...f, oldPassword: e.target.value }))}
                placeholder="Enter current password" />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input className="form-input" type="password" required minLength={6}
                value={passForm.newPassword}
                onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))}
                placeholder="Enter new password" />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input className="form-input" type="password" required
                value={passForm.confirmPassword}
                onChange={e => setPassForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Confirm new password" />
            </div>
          </div>
          <div className="form-buttons" style={{ paddingTop: 0 }}>
            <button type="submit" className="btn-submit" disabled={secSaving.pass}>
              {secSaving.pass ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>

        {/* Change Vendor Access Code */}
        <form onSubmit={handleChangeCode} className="form-container" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '0.95rem' }}>Change Vendor Verification Code</h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1rem', marginTop: 0 }}>
            This is the code required at login in addition to your password.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label>New Access Code</label>
              <input className="form-input" type="password" required minLength={4}
                value={codeForm.newCode}
                onChange={e => setCodeForm(f => ({ ...f, newCode: e.target.value }))}
                placeholder="Enter new code" autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Confirm New Code</label>
              <input className="form-input" type="password" required
                value={codeForm.confirmCode}
                onChange={e => setCodeForm(f => ({ ...f, confirmCode: e.target.value }))}
                placeholder="Confirm new code" autoComplete="off" />
            </div>
            <div className="form-group">
              <label>Current Password (to confirm)</label>
              <input className="form-input" type="password" required
                value={codeForm.currentPassword}
                onChange={e => setCodeForm(f => ({ ...f, currentPassword: e.target.value }))}
                placeholder="Enter current password" />
            </div>
          </div>
          <div className="form-buttons" style={{ paddingTop: 0 }}>
            <button type="submit" className="btn-submit" disabled={secSaving.code}>
              {secSaving.code ? 'Updating…' : 'Update Access Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorProfile;
