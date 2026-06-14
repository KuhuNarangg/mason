import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Check, X, Ban, RotateCcw, Save,
  Package, ShoppingCart, IndianRupee, Tags, Ticket,
  Store, ShieldAlert, Trash2
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const STATUS_BADGE = {
  pending: 'pending',
  approved: 'active',
  rejected: 'cancelled',
  suspended: 'expired',
};

const VendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commission, setCommission] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchVendor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchVendor = async () => {
    try {
      const { data } = await api.get(`/admin/vendors/${id}`);
      setData(data);
      setCommission(String(data.vendor.vendorProfile?.commissionPercent ?? 10));
    } catch {
      toast.error('Failed to fetch vendor');
      navigate('/admin/vendors');
    } finally {
      setLoading(false);
    }
  };

  const approve = async () => {
    if (!confirm('Approve this vendor? They will receive an email to set their password.')) return;
    setBusy(true);
    try {
      await api.put(`/admin/vendors/${id}/approve`);
      toast.success('Vendor approved');
      fetchVendor();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a reason');
    setBusy(true);
    try {
      await api.put(`/admin/vendors/${id}/reject`, { reason: rejectReason.trim() });
      toast.success('Vendor rejected');
      setShowReject(false);
      fetchVendor();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setBusy(false);
    }
  };

  const suspend = async () => {
    if (!confirm('Suspend this vendor? Their products will be deactivated.')) return;
    setBusy(true);
    try {
      await api.put(`/admin/vendors/${id}/suspend`);
      toast.success('Vendor suspended');
      fetchVendor();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to suspend');
    } finally {
      setBusy(false);
    }
  };

  const reinstate = async () => {
    setBusy(true);
    try {
      await api.put(`/admin/vendors/${id}/reinstate`);
      toast.success('Vendor reinstated');
      fetchVendor();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reinstate');
    } finally {
      setBusy(false);
    }
  };

  const deleteVendor = async () => {
    const doubleConfirm = confirm(`⚠️ DANGER: Are you absolutely sure you want to PERMANENTLY delete this vendor "${data?.vendor?.vendorProfile?.businessName || data?.vendor?.name}"?\n\nThis will permanently delete:\n- Their vendor profile and user credentials\n- All of their products\n- All of their payout settlements\n\nThis action CANNOT be undone.`);
    if (!doubleConfirm) return;

    setBusy(true);
    try {
      await api.delete(`/admin/vendors/${id}`);
      toast.success('Vendor permanently deleted');
      navigate('/admin/vendors');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete vendor');
    } finally {
      setBusy(false);
    }
  };

  const saveCommission = async () => {
    const val = Number(commission);
    if (Number.isNaN(val) || val < 0 || val > 100) return toast.error('Enter a value between 0 and 100');
    setSaving(true);
    try {
      await api.put(`/admin/vendors/${id}/commission`, { commissionPercent: val });
      toast.success('Commission updated');
      fetchVendor();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update commission');
    } finally {
      setSaving(false);
    }
  };

  const metrics = useMemo(() => {
    if (!data) return [];
    const { productCount, stats } = data;
    return [
      {
        label: 'Active Products',
        value: productCount || 0,
        category: 'Inventory',
        icon: Package,
        themeColor: '#ec4899',
        themeRgb: '236, 72, 153',
        bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0.03) 100%)',
      },
      {
        label: 'Items Sold',
        value: stats.totalItems || 0,
        category: 'Sales',
        icon: ShoppingCart,
        themeColor: '#3b82f6',
        themeRgb: '59, 130, 246',
        bgGradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.03) 100%)',
      },
      {
        label: 'Total Revenue',
        value: `₹${Number(stats.revenue || 0).toLocaleString('en-IN')}`,
        category: 'Financial',
        icon: IndianRupee,
        themeColor: '#C08A74',
        themeRgb: '192, 138, 116',
        bgGradient: 'linear-gradient(135deg, rgba(192, 138, 116, 0.1) 0%, rgba(192, 138, 116, 0.03) 100%)',
      },
      {
        label: 'Commission Earned',
        value: `₹${Number(stats.commission || 0).toLocaleString('en-IN')}`,
        category: 'Financial',
        icon: Tags,
        themeColor: '#10b981',
        themeRgb: '16, 185, 129',
        bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.03) 100%)',
      },
      {
        label: 'Vendor Payout',
        value: `₹${Number(stats.earning || 0).toLocaleString('en-IN')}`,
        category: 'Financial',
        icon: Ticket,
        themeColor: '#8b5cf6',
        themeRgb: '139, 92, 246',
        bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.03) 100%)',
      },
    ];
  }, [data]);

  if (loading) return (
    <div className="admin-loading" style={{ margin: '3rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width:24, height:24, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Loading vendor record…</span>
    </div>
  );
  
  if (!data) return null;

  const { vendor, stats } = data;
  const p = vendor.vendorProfile || {};

  return (
    <div className="animate-fade-in-up">
      {/* ── Page Header ── */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-start' }}>
        <button onClick={() => navigate('/admin/vendors')} className="btn-icon-sm" style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="admin-page-title" style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{p.businessName || vendor.name}</h2>
          <span className={`status-badge badge-${STATUS_BADGE[vendor.vendorStatus] || 'pending'}`} style={{ marginTop: '0.3rem', textTransform: 'capitalize' }}>
            {vendor.vendorStatus}
          </span>
        </div>
      </div>

      {/* ── Status Banner / Moderation ── */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', borderLeft: `4px solid ${
        vendor.vendorStatus === 'approved' ? '#10b981' :
        vendor.vendorStatus === 'pending' ? '#f59e0b' :
        vendor.vendorStatus === 'suspended' ? '#ef4444' : '#64748b'
      }` }}>
        <div className="admin-card-header">
          <div className="premium-chart-title" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} color="#475569" />
            Account Status &amp; Moderation
          </div>
        </div>
        <div className="admin-card-body">
          {vendor.vendorStatus === 'pending' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 750, color: '#d97706' }}>Application Review Pending</p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Please verify the vendor's GSTIN, bank details, and business name before approving. Approving will email them details to set their password.</p>
            </div>
          )}
          {vendor.vendorStatus === 'approved' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 750, color: '#16a34a' }}>Approved &amp; Active</p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>This vendor account is active. They can list items, manage inventory, and receive customer payouts.</p>
            </div>
          )}
          {vendor.vendorStatus === 'suspended' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 750, color: '#dc2626' }}>Temporarily Suspended</p>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>This vendor account has been suspended. Their products are automatically hidden from customers and disabled.</p>
            </div>
          )}
          {vendor.vendorStatus === 'rejected' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.85rem', fontWeight: 750, color: '#475569' }}>Application Rejected</p>
              {p.rejectionReason && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  <strong>Rejection reason:</strong> {p.rejectionReason}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {vendor.vendorStatus === 'pending' && (
              <>
                <button className="btn-primary" disabled={busy} onClick={approve} style={{ background: '#16a34a', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Check size={15} /> 
                  <span>Approve Application</span>
                </button>
                <button className="btn-danger" disabled={busy} onClick={() => setShowReject(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <X size={15} /> 
                  <span>Reject Application</span>
                </button>
              </>
            )}
            {vendor.vendorStatus === 'approved' && (
              <button className="btn-danger" disabled={busy} onClick={suspend} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ban size={15} /> 
                <span>Suspend Vendor</span>
              </button>
            )}
            {vendor.vendorStatus === 'suspended' && (
              <button className="btn-primary" disabled={busy} onClick={reinstate} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <RotateCcw size={15} /> 
                <span>Reinstate Vendor</span>
              </button>
            )}
            <button className="btn-danger" disabled={busy} onClick={deleteVendor} style={{ background: '#dc2626', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <Trash2 size={15} /> 
              <span>Hard Delete Vendor</span>
            </button>
          </div>

          {showReject && (
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 750, color: '#475569' }}>Specify Rejection Reason</label>
                <textarea className="form-textarea" rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. GSTIN details do not match the business registry records." style={{ marginTop: '0.35rem' }} autoFocus />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button className="btn-cancel" onClick={() => setShowReject(false)}>Cancel</button>
                <button className="btn-danger" disabled={busy} onClick={reject}>
                  {busy ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats KPI Cards ── */}
      <div className="premium-kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="premium-kpi-card"
              style={{
                '--kpi-theme-color': metric.themeColor,
                '--kpi-theme-rgb': metric.themeRgb,
                '--kpi-bg-gradient': metric.bgGradient,
                cursor: 'default'
              }}
            >
              <div className="premium-kpi-header">
                <div className="premium-kpi-icon-wrap" style={{ width: 42, height: 42, borderRadius: '10px' }}>
                  <Icon size={18} />
                </div>
                <span className="premium-kpi-category-badge" style={{ fontSize: '0.6rem' }}>{metric.category}</span>
              </div>
              <div className="premium-kpi-body">
                <div className="premium-kpi-value" style={{ fontSize: '1.5rem' }}>{metric.value}</div>
                <div className="premium-kpi-label" style={{ fontSize: '0.75rem' }}>{metric.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Commission settings ── */}
      <div className="admin-card" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-card-header">
          <div className="premium-chart-title" style={{ fontSize: '0.95rem' }}>Platform Settlement Settings</div>
        </div>
        <div className="admin-card-body">
          <p style={{ margin: '0 0 1rem 0', fontSize: '0.78rem', color: '#64748b' }}>Set the platform fee commission rate for this vendor. This percentage will be deducted from their total sales revenue before calculating settlements.</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', maxWidth: '380px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 750, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Platform Commission %</label>
              <div style={{ position: 'relative', marginTop: '0.35rem' }}>
                <input type="number" className="form-input" min="0" max="100" value={commission} onChange={(e) => setCommission(e.target.value)} style={{ paddingRight: '2rem' }} />
                <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>%</span>
              </div>
            </div>
            <button className="btn-primary" disabled={saving} onClick={saveCommission} style={{ height: '42px', padding: '0 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={15} /> 
              <span>{saving ? 'Saving…' : 'Save Rate'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-Column Profile Grid ── */}
      <div className="premium-dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        {/* Left: General & Tax Info */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div className="premium-chart-title" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Store size={16} color="#C08A74" />
              Business Profile &amp; Contact
            </div>
          </div>
          <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="stat-row"><span className="stat-label">Business Name</span><span className="stat-value">{p.businessName || '—'}</span></div>
            <div className="stat-row"><span className="stat-label">Contact Name</span><span className="stat-value">{vendor.name}</span></div>
            <div className="stat-row"><span className="stat-label">Email Address</span><span className="stat-value">{vendor.email}</span></div>
            <div className="stat-row"><span className="stat-label">Phone Number</span><span className="stat-value">{vendor.phone || '—'}</span></div>
            <div className="stat-row"><span className="stat-label">GSTIN Number</span><span className="stat-value" style={{ fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: '0.5px' }}>{p.gstNumber || '—'}</span></div>
            <div className="stat-row"><span className="stat-label">PAN Card Number</span><span className="stat-value" style={{ fontFamily: 'monospace', fontSize: '0.9rem', letterSpacing: '0.5px' }}>{p.panNumber || '—'}</span></div>
            <div className="stat-row" style={{ alignItems: 'flex-start' }}><span className="stat-label">Registered Address</span><span className="stat-value" style={{ textAlign: 'right', maxWidth: '60%', fontWeight: 500, color: '#334155' }}>
              {[p.address?.line1, p.address?.line2, p.address?.city, p.address?.state, p.address?.pincode].filter(Boolean).join(', ') || '—'}
            </span></div>
          </div>
        </div>

        {/* Right: Bank Details & Timestamps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="premium-chart-title" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Ticket size={16} color="#8b5cf6" />
                Settlement Bank Account
              </div>
            </div>
            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="stat-row"><span className="stat-label">Bank Name</span><span className="stat-value">{p.bankDetails?.bankName || '—'}</span></div>
              <div className="stat-row"><span className="stat-label">Account Holder</span><span className="stat-value">{p.bankDetails?.accountHolder || '—'}</span></div>
              <div className="stat-row"><span className="stat-label">Account Number</span><span className="stat-value" style={{ fontFamily: 'monospace' }}>{p.bankDetails?.accountNumber || '—'}</span></div>
              <div className="stat-row"><span className="stat-label">IFSC Code</span><span className="stat-value" style={{ fontFamily: 'monospace' }}>{p.bankDetails?.ifsc || '—'}</span></div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="premium-chart-title" style={{ fontSize: '0.95rem' }}>Application Status Logs</div>
            </div>
            <div className="admin-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="stat-row"><span className="stat-label">Applied Date</span><span className="stat-value">{new Date(vendor.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
              {vendor.vendorProfile?.approvedAt && (
                <div className="stat-row"><span className="stat-label">Approved Date</span><span className="stat-value">{new Date(vendor.vendorProfile.approvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetail;
