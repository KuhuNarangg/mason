import { useState, useEffect } from 'react';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const PlatformSettings = () => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    </div>
  );
};

export default PlatformSettings;
