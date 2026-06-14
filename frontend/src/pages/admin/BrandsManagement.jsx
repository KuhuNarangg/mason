import { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, Award } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const EMPTY_FORM = { name: '', logo: '', description: '', isActive: true };

const BrandsManagement = () => {
  const [brands, setBrands]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetchBrands(); }, []);

  const fetchBrands = async () => {
    try {
      const { data } = await api.get('/brands', { params: { all: 1 } });
      setBrands(data.brands || []);
    } catch {
      toast.error('Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/brands/${editingId}`, form);
        toast.success('Brand updated');
      } else {
        await api.post('/brands', form);
        toast.success('Brand created');
      }
      closeForm();
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this brand?')) return;
    try {
      await api.delete(`/brands/${id}`);
      toast.success('Brand deleted');
      fetchBrands();
    } catch {
      toast.error('Failed to delete brand');
    }
  };

  const toggleActive = async (brand) => {
    try {
      await api.put(`/brands/${brand._id}`, { isActive: !brand.isActive });
      fetchBrands();
    } catch {
      toast.error('Failed to update brand');
    }
  };

  const startEdit = (b) => {
    setForm({ name: b.name, logo: b.logo || '', description: b.description || '', isActive: b.isActive });
    setEditingId(b._id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  if (loading) return (
    <div className="admin-loading">
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Brands</h1>
          <p className="admin-page-subtitle">{brands.length} brand{brands.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => { closeForm(); setShowForm(true); }}>
          <Plus size={16} /> Add Brand
        </button>
      </div>

      {showForm && (
        <div className="form-container">
          <div className="form-header">
            <h3 className="form-header-title">
              <Award size={16} style={{ verticalAlign:'middle', marginRight:8 }} />
              {editingId ? 'Edit Brand' : 'New Brand'}
            </h3>
            <button onClick={closeForm} className="btn-icon-sm"><X size={18}/></button>
          </div>
          <div className="form-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom:'1.25rem' }}>
                <label>Brand Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Nike, Zara, Mason Originals"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom:'1.25rem' }}>
                <label>Logo URL</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.logo}
                  onChange={e => setForm({ ...form, logo: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="form-group" style={{ marginBottom:0 }}>
                <label>Description</label>
                <textarea
                  className="form-textarea"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Short description (optional)"
                  rows={2}
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-submit" disabled={saving}>
                  {saving ? 'Saving…' : editingId ? 'Update Brand' : 'Create Brand'}
                </button>
                <button type="button" onClick={closeForm} className="btn-cancel">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Description</th>
              <th>Status</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 ? (
              <tr><td colSpan="4" className="no-data">No brands yet — add one above.</td></tr>
            ) : (
              brands.map(b => (
                <tr key={b._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {b.logo && <img src={b.logo} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />}
                      <div className="table-cell-primary">{b.name}</div>
                    </div>
                  </td>
                  <td style={{ fontSize:'0.8rem', color:'#64748b', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {b.description || <span style={{ color:'#cbd5e1' }}>—</span>}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${b.isActive ? 'badge-active' : 'badge-cancelled'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleActive(b)}
                      title="Click to toggle"
                    >
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:'0.375rem', justifyContent:'flex-end' }}>
                      <button onClick={() => startEdit(b)} className="btn-icon-sm edit" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(b._id)} className="btn-icon-sm delete" title="Delete">
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
    </div>
  );
};

export default BrandsManagement;
