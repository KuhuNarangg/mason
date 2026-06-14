import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, Tags, CornerDownRight } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const EMPTY_FORM = { name: '', gender: 'all', subGender: 'none', description: '', parent: '' };

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories?all=1');
      setCategories(data.categories || []);
    } catch {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const topLevel = categories.filter(c => !c.parent);
  const childrenOf = (id) => categories.filter(c => c.parent === id || c.parent?._id === id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, parent: form.parent || null };
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/categories', payload);
        toast.success(payload.parent ? 'Subcategory created' : 'Category created');
      }
      closeForm();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Subcategories must be removed first.')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const startEdit = (cat) => {
    setForm({
      name: cat.name,
      gender: cat.gender,
      subGender: cat.subGender,
      description: cat.description || '',
      parent: cat.parent?._id || cat.parent || '',
    });
    setEditingId(cat._id);
    setShowForm(true);
  };

  const startAddSubcategory = (parentCat) => {
    setForm({ ...EMPTY_FORM, gender: parentCat.gender, parent: parentCat._id });
    setEditingId(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const genderLabel = { all: 'All', men: 'Men', women: 'Women', kids: 'Kids' };

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
          <h1 className="admin-page-title">Categories</h1>
          <p className="admin-page-subtitle">{topLevel.length} categor{topLevel.length !== 1 ? 'ies' : 'y'} · {categories.length - topLevel.length} subcategories</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => { closeForm(); setShowForm(true); }}
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="form-container">
          <div className="form-header">
            <h3 className="form-header-title">
              <Tags size={16} style={{ verticalAlign:'middle', marginRight:8 }} />
              {editingId ? 'Edit Category' : form.parent ? 'New Subcategory' : 'New Category'}
            </h3>
            <button onClick={closeForm} className="btn-icon-sm"><X size={18}/></button>
          </div>
          <div className="form-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom:'1.25rem' }}>
                <label>Parent Category</label>
                <select
                  className="form-select"
                  value={form.parent}
                  onChange={e => setForm({ ...form, parent: e.target.value })}
                >
                  <option value="">— None (top-level category) —</option>
                  {topLevel.filter(c => c._id !== editingId).map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom:'1.25rem' }}>
                <label>{form.parent ? 'Subcategory Name *' : 'Category Name *'}</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Dresses, Tops, Ethnic Wear"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Gender</label>
                  <select
                    className="form-select"
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="all">All</option>
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                    <option value="kids">Kids</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Sub-Gender</label>
                  <select
                    className="form-select"
                    value={form.subGender}
                    onChange={e => setForm({ ...form, subGender: e.target.value })}
                  >
                    <option value="none">None</option>
                    <option value="boys">Boys</option>
                    <option value="girls">Girls</option>
                    <option value="unisex">Unisex</option>
                  </select>
                </div>
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
                  {saving ? 'Saving…' : editingId ? 'Update Category' : form.parent ? 'Create Subcategory' : 'Create Category'}
                </button>
                <button type="button" onClick={closeForm} className="btn-cancel">Cancel</button>
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
              <th>Category Name</th>
              <th>Gender</th>
              <th>Sub-Gender</th>
              <th>Description</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {topLevel.length === 0 ? (
              <tr><td colSpan="5" className="no-data">No categories yet — add one above.</td></tr>
            ) : (
              topLevel.map(cat => (
                <React.Fragment key={cat._id}>
                  <tr>
                    <td>
                      <div className="table-cell-primary">{cat.name}</div>
                    </td>
                    <td>
                      <span className="tag-badge">{genderLabel[cat.gender] || cat.gender}</span>
                    </td>
                    <td style={{ fontSize:'0.8rem', color:'#64748b', textTransform:'capitalize' }}>
                      {cat.subGender === 'none' ? <span style={{ color:'#cbd5e1' }}>—</span> : cat.subGender}
                    </td>
                    <td style={{ fontSize:'0.8rem', color:'#64748b', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {cat.description || <span style={{ color:'#cbd5e1' }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:'0.375rem', justifyContent:'flex-end' }}>
                        <button onClick={() => startAddSubcategory(cat)} className="btn-icon-sm" title="Add Subcategory">
                          <Plus size={16} />
                        </button>
                        <button onClick={() => startEdit(cat)} className="btn-icon-sm edit" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(cat._id)} className="btn-icon-sm delete" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {childrenOf(cat._id).map(sub => (
                    <tr key={sub._id} style={{ background: '#fafafa' }}>
                      <td>
                        <div className="table-cell-primary" style={{ paddingLeft: '1.5rem', display:'flex', alignItems:'center', gap:'0.4rem', fontWeight: 400, color:'#64748b' }}>
                          <CornerDownRight size={14} /> {sub.name}
                        </div>
                      </td>
                      <td>
                        <span className="tag-badge">{genderLabel[sub.gender] || sub.gender}</span>
                      </td>
                      <td style={{ fontSize:'0.8rem', color:'#64748b', textTransform:'capitalize' }}>
                        {sub.subGender === 'none' ? <span style={{ color:'#cbd5e1' }}>—</span> : sub.subGender}
                      </td>
                      <td style={{ fontSize:'0.8rem', color:'#64748b', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {sub.description || <span style={{ color:'#cbd5e1' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display:'flex', gap:'0.375rem', justifyContent:'flex-end' }}>
                          <button onClick={() => startEdit(sub)} className="btn-icon-sm edit" title="Edit">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(sub._id)} className="btn-icon-sm delete" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriesManagement;
