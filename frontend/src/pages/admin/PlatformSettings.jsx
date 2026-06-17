import { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon, Shield } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './admin-pages.css';

const PlatformSettings = () => {
  const { user, token, setAuthUser } = useAuth();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* ── Security section state ── */
  const [emailForm, setEmailForm]   = useState({ newEmail: '', currentPassword: '' });
  const [passForm,  setPassForm]    = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [codeForm,  setCodeForm]    = useState({ newCode: '', confirmCode: '', currentPassword: '' });
  const [secSaving, setSecSaving]   = useState({ email: false, pass: false, code: false });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      setForm(data.settings);
    } catch {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const updateTax = (key, value) => setForm(prev => ({ ...prev, taxConfig: { ...prev.taxConfig, [key]: value } }));

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
      toast.success('Admin access code updated');
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
      const { data } = await api.put('/admin/settings', form);
      setForm(data.settings);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) return (
    <div className="admin-loading">
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading settings…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Platform Settings</h1>
          <p className="admin-page-subtitle">Site-wide configuration</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
            <SettingsIcon size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            General
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label>Site Name</label>
              <input className="form-input" value={form.siteName || ''} onChange={e => update('siteName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Support Email</label>
              <input className="form-input" type="email" value={form.supportEmail || ''} onChange={e => update('supportEmail', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Support Phone</label>
              <input className="form-input" value={form.supportPhone || ''} onChange={e => update('supportPhone', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Commerce</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Default Vendor Commission (%)</label>
              <input className="form-input" type="number" min="0" max="100" value={form.defaultCommissionPercent ?? 10} onChange={e => update('defaultCommissionPercent', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Return Window (days)</label>
              <input className="form-input" type="number" min="0" value={form.returnWindowDays ?? 7} onChange={e => update('returnWindowDays', Number(e.target.value))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Shipping Charge (₹)</label>
              <input className="form-input" type="number" min="0" value={form.shippingCharge ?? 0} onChange={e => update('shippingCharge', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Free Shipping Threshold (₹)</label>
              <input className="form-input" type="number" min="0" value={form.freeShippingThreshold ?? 0} onChange={e => update('freeShippingThreshold', Number(e.target.value))} />
              <small style={{ color: '#94a3b8' }}>0 = no free shipping threshold</small>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Default CGST (%)</label>
              <input className="form-input" type="number" min="0" value={form.taxConfig?.cgstPercent ?? 6} onChange={e => updateTax('cgstPercent', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Default SGST (%)</label>
              <input className="form-input" type="number" min="0" value={form.taxConfig?.sgstPercent ?? 6} onChange={e => updateTax('sgstPercent', Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="form-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Vendors &amp; Maintenance</h3>
          <div className="form-row" style={{ alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
              <input type="checkbox" checked={!!form.vendorAutoApprove} onChange={e => update('vendorAutoApprove', e.target.checked)} />
              Auto-approve new vendor applications
            </label>
          </div>
          <div className="form-row" style={{ alignItems: 'center', marginTop: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
              <input type="checkbox" checked={!!form.maintenanceMode} onChange={e => update('maintenanceMode', e.target.checked)} />
              Enable maintenance mode
            </label>
          </div>
          {form.maintenanceMode && (
            <div className="form-group" style={{ marginTop: '0.75rem' }}>
              <label>Maintenance Message</label>
              <textarea className="form-textarea" rows={2} value={form.maintenanceMessage || ''} onChange={e => update('maintenanceMessage', e.target.value)} placeholder="We'll be back soon…" />
            </div>
          )}
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn-submit" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving…' : 'Save Settings'}
          </button>
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

        {/* Change Admin Access Code */}
        <form onSubmit={handleChangeCode} className="form-container" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
          <h3 style={{ marginTop: 0, marginBottom: '0.25rem', fontSize: '0.95rem' }}>Change Admin Verification Code</h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '1rem', marginTop: 0 }}>
            This is the 8-digit code required at login in addition to your password.
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

export default PlatformSettings;
