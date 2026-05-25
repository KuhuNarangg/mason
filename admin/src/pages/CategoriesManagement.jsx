import { useState, useEffect } from 'react';
import { Trash2, Edit, Plus } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    gender: 'all',
    subGender: 'none',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories);
    } catch {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, form);
        toast.success('Category updated');
      } else {
        await api.post('/categories', form);
        toast.success('Category created');
      }
      setForm({ name: '', gender: 'all', subGender: 'none', description: '' });
      setShowForm(false);
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this category?')) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success('Category deleted');
        fetchCategories();
      } catch {
        toast.error('Failed to delete category');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Categories Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            background: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <Plus size={20} /> Add Category
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="form-input">
                  <option value="all">All</option>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="kids">Kids</option>
                </select>
              </div>

              <div className="form-group">
                <label>Sub Gender</label>
                <select value={form.subGender} onChange={(e) => setForm({ ...form, subGender: e.target.value })} className="form-input">
                  <option value="none">None</option>
                  <option value="boys">Boys</option>
                  <option value="girls">Girls</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="form-input" rows="2"></textarea>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="submit" className="btn" style={{ background: '#2563eb', color: 'white', flex: 1 }}>
                {editingId ? 'Update' : 'Create'} Category
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="btn"
                style={{ background: '#e5e7eb', flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="kpi-card" style={{ display: 'block' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', background: '#f9fafb' }}>
              <th style={{ padding: '1rem 0' }}>Category Name</th>
              <th>Gender</th>
              <th>Sub Gender</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem 0' }}>{cat.name}</td>
                <td>{cat.gender}</td>
                <td>{cat.subGender}</td>
                <td>{cat.description.substring(0, 30)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setForm(cat);
                        setEditingId(cat._id);
                        setShowForm(true);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563eb' }}
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriesManagement;
