import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Search, Check, X, Ban, RotateCcw, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
];

const STATUS_BADGE = {
  pending: 'pending',
  approved: 'active',
  rejected: 'cancelled',
  suspended: 'expired',
};

const VendorsManagement = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null); // vendor being rejected
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    accessCode: '',
    businessName: '',
    gstNumber: '',
    panNumber: '',
    phone: '',
    commissionPercent: '10',
  });

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    setBusyId('create');
    try {
      await api.post('/admin/vendors', createForm);
      toast.success('Vendor created successfully');
      setShowCreateModal(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        accessCode: '',
        businessName: '',
        gstNumber: '',
        panNumber: '',
        phone: '',
        commissionPercent: '10',
      });
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vendor');
    } finally {
      setBusyId(null);
    }
  };

  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/vendors', { params: { status: filter || undefined } });
      setVendors(data.vendors || []);
    } catch {
      toast.error('Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const displayed = useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(v =>
      v.name?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      v.vendorProfile?.businessName?.toLowerCase().includes(q)
    );
  }, [vendors, search]);

  const approve = async (vendor) => {
    if (!confirm(`Approve "${vendor.vendorProfile?.businessName || vendor.name}"? They'll receive an email to set their password.`)) return;
    setBusyId(vendor._id);
    try {
      await api.put(`/admin/vendors/${vendor._id}/approve`);
      toast.success('Vendor approved');
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve vendor');
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (vendor) => {
    setRejectTarget(vendor);
    setRejectReason('');
  };

  const submitReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a reason');
    setBusyId(rejectTarget._id);
    try {
      await api.put(`/admin/vendors/${rejectTarget._id}/reject`, { reason: rejectReason.trim() });
      toast.success('Vendor application rejected');
      setRejectTarget(null);
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject vendor');
    } finally {
      setBusyId(null);
    }
  };

  const suspend = async (vendor) => {
    if (!confirm(`Suspend "${vendor.vendorProfile?.businessName || vendor.name}"? Their products will be deactivated.`)) return;
    setBusyId(vendor._id);
    try {
      await api.put(`/admin/vendors/${vendor._id}/suspend`);
      toast.success('Vendor suspended');
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to suspend vendor');
    } finally {
      setBusyId(null);
    }
  };

  const reinstate = async (vendor) => {
    setBusyId(vendor._id);
    try {
      await api.put(`/admin/vendors/${vendor._id}/reinstate`);
      toast.success('Vendor reinstated');
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reinstate vendor');
    } finally {
      setBusyId(null);
    }
  };

  const deleteVendor = async (vendor) => {
    const doubleConfirm = confirm(`⚠️ DANGER: Are you absolutely sure you want to PERMANENTLY delete the vendor "${vendor.vendorProfile?.businessName || vendor.name}"?\n\nThis will permanently delete:\n- Their vendor profile and user credentials\n- All of their products\n- All of their payout settlements\n\nThis action CANNOT be undone.`);
    if (!doubleConfirm) return;
    
    setBusyId(vendor._id);
    try {
      await api.delete(`/admin/vendors/${vendor._id}`);
      toast.success('Vendor and all associated data permanently deleted');
      fetchVendors();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete vendor');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return (
    <div className="admin-loading">
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading vendors…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-header-left">
          <h1 className="admin-page-title">Vendors</h1>
          <p className="admin-page-subtitle">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''}</p>
        </div>
        <div>
          <button className="btn-submit" style={{ background: '#C08A74', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 500 }} onClick={() => setShowCreateModal(true)}>
            Create Vendor
          </button>
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
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or business…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Business</th>
              <th>Commission</th>
              <th>Status</th>
              <th>Applied</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan="6" className="no-data">No vendors found.</td></tr>
            ) : (
              displayed.map((v) => (
                <tr key={v._id}>
                  <td>
                    <div className="table-cell-primary">{v.name}</div>
                    <div className="table-cell-secondary">{v.email}</div>
                  </td>
                  <td>{v.vendorProfile?.businessName || '—'}</td>
                  <td>{v.vendorProfile?.commissionPercent ?? 10}%</td>
                  <td>
                    <span className={`status-badge badge-${STATUS_BADGE[v.vendorStatus] || 'pending'}`}>{v.vendorStatus}</span>
                  </td>
                  <td className="table-cell-secondary">{new Date(v.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <button className="btn-icon-sm view" title="View Details" onClick={() => navigate(`/admin/vendors/${v._id}`)}>
                        <Eye size={16} />
                      </button>
                      {v.vendorStatus === 'pending' && (
                        <>
                          <button className="btn-small" disabled={busyId === v._id} title="Approve" onClick={() => approve(v)}>
                            <Check size={14} /> Approve
                          </button>
                          <button className="btn-small btn-danger" disabled={busyId === v._id} title="Reject" onClick={() => openReject(v)}>
                            <X size={14} /> Reject
                          </button>
                        </>
                      )}
                      {v.vendorStatus === 'approved' && (
                        <button className="btn-small btn-danger" disabled={busyId === v._id} title="Suspend" onClick={() => suspend(v)}>
                          <Ban size={14} /> Suspend
                        </button>
                      )}
                      {v.vendorStatus === 'suspended' && (
                        <button className="btn-small" disabled={busyId === v._id} title="Reinstate" onClick={() => reinstate(v)}>
                          <RotateCcw size={14} /> Reinstate
                        </button>
                      )}
                      <button className="btn-icon-sm delete" disabled={busyId === v._id} title="Hard Delete Vendor" onClick={() => deleteVendor(v)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Reject reason modal */}
      {rejectTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '1.5rem', maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Reject Vendor Application</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 0, marginBottom: '1rem' }}>
              {rejectTarget.vendorProfile?.businessName || rejectTarget.name} will receive an email with this reason.
            </p>
            <div className="form-group">
              <label>Reason</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete business documentation"
                autoFocus
              />
            </div>
            <div className="form-buttons">
              <button className="btn-cancel" onClick={() => setRejectTarget(null)}>Cancel</button>
              <button className="btn-submit" disabled={busyId === rejectTarget._id} onClick={submitReject}>
                {busyId === rejectTarget._id ? 'Rejecting...' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create vendor modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '1.75rem', maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Create Vendor</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 0, marginBottom: '1.25rem' }}>
              Create a single vendor account. The vendor can log in using these credentials immediately.
            </p>
            <form onSubmit={handleCreateVendor}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.875rem' }}>Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. John Doe"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.875rem' }}>Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  placeholder="e.g. vendor@example.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.875rem' }}>Password *</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="At least 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.875rem' }}>Access Code *</label>
                <input
                  type="password"
                  className="form-input"
                  required
                  placeholder="Vendor login code (min 4 chars)"
                  value={createForm.accessCode}
                  onChange={(e) => setCreateForm({ ...createForm, accessCode: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  autoComplete="off"
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                  The vendor will enter this code alongside their password to log in.
                </span>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.875rem' }}>Business Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="e.g. Apex Clothing"
                  value={createForm.businessName}
                  onChange={(e) => setCreateForm({ ...createForm, businessName: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.875rem' }}>GST Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    value={createForm.gstNumber}
                    onChange={(e) => setCreateForm({ ...createForm, gstNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.875rem' }}>PAN Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ABCDE1234F"
                    value={createForm.panNumber}
                    onChange={(e) => setCreateForm({ ...createForm, panNumber: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.875rem' }}>Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +91 9876543210"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontWeight: 500, fontSize: '0.875rem' }}>Commission %</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    placeholder="e.g. 10"
                    value={createForm.commissionPercent}
                    onChange={(e) => setCreateForm({ ...createForm, commissionPercent: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                  />
                </div>
              </div>
              <div className="form-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)} style={{ background: '#f1f5f9', border: 'none', color: '#334155', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-submit" disabled={busyId !== null} style={{ background: '#C08A74', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>
                  {busyId === 'create' ? 'Creating...' : 'Create Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsManagement;
