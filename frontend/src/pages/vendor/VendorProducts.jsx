import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit, Plus, Search } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import '../admin/admin-pages.css';

const VendorProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [selectedIds, setSelectedIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategoryForBulk, setSelectedCategoryForBulk] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Category Creation State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryGender, setNewCategoryGender] = useState('women');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryCover, setNewCategoryCover] = useState(null);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return toast.error('Category name is required');
    setCategorySubmitting(true);
    try {
      let uploadedImageUrl = '';
      if (newCategoryCover) {
        const formData = new FormData();
        formData.append('file', newCategoryCover);
        const { data: uploadData } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedImageUrl = uploadData.url;
      }

      await api.post('/categories', {
        name: newCategoryName.trim(),
        gender: newCategoryGender,
        description: newCategoryDesc.trim(),
        image: uploadedImageUrl
      });
      toast.success('Category created successfully!');
      setShowCreateCategoryModal(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setNewCategoryCover(null);
      fetchCategories(); // Refresh categories dropdown!
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCategorySubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category? Products in this category will become uncategorized.')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category deleted successfully');
      fetchCategories(); // Refresh categories dropdown!
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const params = { limit: 100 };
      if (filter !== 'all') params.isActive = filter === 'active';
      const { data } = await api.get('/vendor/products', { params });
      setProducts(data.products);
    } catch {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.categories || []);
    } catch {
      console.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filter, search]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const toggleActive = async (p) => {
    try {
      await api.put(`/vendor/products/${p._id}/toggle-active`);
      toast.success(p.isActive ? 'Product deactivated' : 'Product activated');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkAssignCategory = async () => {
    if (!selectedCategoryForBulk) return;
    setBulkSubmitting(true);
    try {
      const { data } = await api.put('/vendor/products/bulk-category', {
        productIds: selectedIds,
        categoryId: selectedCategoryForBulk,
      });
      toast.success(data.message || 'Category assigned successfully!');
      setSelectedIds([]);
      setSelectedCategoryForBulk('');
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk assignment failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleBulkRemoveCategory = async () => {
    if (!confirm('Are you sure you want to remove the assigned category from these products?')) return;
    setBulkSubmitting(true);
    try {
      const { data } = await api.put('/vendor/products/bulk-category', {
        productIds: selectedIds,
        categoryId: 'remove',
      });
      toast.success(data.message || 'Category removed successfully!');
      setSelectedIds([]);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk removal failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Catalogue</h1>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn-primary"
            style={{ background: 'transparent', border: '1.5px solid var(--champagne-dark, #C08A74)', color: 'var(--champagne-dark, #C08A74)' }}
            onClick={() => setShowCreateCategoryModal(true)}
          >
            <Plus size={18} /> Create Category
          </button>
          <button className="btn-primary" onClick={() => navigate('/vendor/products/new')}>
            <Plus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            className="search-input"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {['all', 'active', 'inactive'].map((f) => (
            <button
              key={f}
              className={`filter-tab${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div style={{
          background: 'var(--champagne-light, #FAF6F0)',
          border: '1px solid var(--champagne, #EAE0D5)',
          padding: '1rem',
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1rem',
          marginBottom: '1rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>
            <strong>{selectedIds.length}</strong> product(s) selected
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              className="search-input"
              style={{ width: '220px', padding: '0.45rem 0.75rem', borderRadius: '4px', border: '1px solid #ccc', background: '#fff' }}
              value={selectedCategoryForBulk}
              onChange={(e) => setSelectedCategoryForBulk(e.target.value)}
            >
              <option value="">-- Assign Category --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name} ({cat.gender})</option>
              ))}
            </select>
            <button
              className="btn-primary"
              style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem' }}
              disabled={!selectedCategoryForBulk || bulkSubmitting}
              onClick={handleBulkAssignCategory}
            >
              {bulkSubmitting ? 'Assigning...' : 'Assign Category'}
            </button>
            <button
              className="btn-small"
              style={{ padding: '0.45rem 1.2rem', fontSize: '0.85rem', color: '#ef4444', border: '1px solid #fca5a5', background: '#fef2f2' }}
              disabled={bulkSubmitting}
              onClick={handleBulkRemoveCategory}
            >
              Remove from Category
            </button>
            <button
              className="btn-small"
              style={{ padding: '0.45rem 0.8rem', background: 'transparent', border: '1px solid #ccc', color: '#555' }}
              onClick={() => { setSelectedIds([]); setSelectedCategoryForBulk(''); }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '40px', paddingLeft: '1rem' }}>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                />
              </th>
              <th>Product Info</th>
              <th>Sizes & Colors</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No products yet. Add your first product to get started!
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const totalStock = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
                const maxStock = 1000;
                const pct = Math.min(100, Math.round((totalStock / maxStock) * 100));
                const level = pct >= 60 ? 'high' : pct >= 30 ? 'medium' : 'low';
                
                // Get unique sizes
                const sizes = [...new Set((p.variants || []).map(v => v.size))];
                
                // Get unique colors
                const colors = (p.variants || []).reduce((acc, v) => {
                  if (v.color && !acc.find(item => item.color === v.color)) {
                    acc.push({ color: v.color, hex: v.colorHex });
                  }
                  return acc;
                }, []);

                return (
                  <tr key={p._id}>
                    <td style={{ paddingLeft: '1rem' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p._id)}
                        onChange={() => handleSelectOne(p._id)}
                        style={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                      />
                    </td>
                    <td>
                      <div className="product-info-cell">
                        {p.images && p.images.length > 0 ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="product-info-thumb"
                            onError={(e) => e.target.src = 'https://placehold.co/44?text=No+Image'}
                          />
                        ) : (
                          <div className="product-info-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: '#a98478' }}>
                            No Image
                          </div>
                        )}
                        <div className="product-info-text">
                          <div className="product-info-name" title={p.name}>{p.name}</div>
                          <div className="product-info-id">ID: {p._id.slice(-8).toUpperCase()} · {p.gender}/{p.type}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {/* Sizes */}
                      {sizes.length > 0 ? (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
                          {sizes.map(s => (
                            <span key={s} style={{ fontSize: '0.72rem', padding: '2px 6px', background: '#F3EDE4', borderRadius: '4px', color: '#475569', fontWeight: 600 }}>{s}</span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No sizes</span>
                      )}
                      
                      {/* Colors */}
                      {colors.length > 0 ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                          {colors.map(c => (
                            <div
                              key={c.color}
                              title={c.color}
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: c.hex || '#ccc',
                                border: '1px solid #ddd',
                              }}
                            />
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No colors</span>
                      )}
                    </td>
                    <td>
                      ₹{p.originalPrice}
                      {Number(p.discount) > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#22c55e', fontWeight: 600 }}>-{p.discount}%</div>
                      )}
                    </td>
                    <td className="stock-cell">
                      <div className="stock-cell-value">{totalStock}</div>
                      <div className="stock-progress-track">
                        <div className={`stock-progress-bar ${level}`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="stock-progress-label">{totalStock}/{maxStock}</div>
                    </td>
                    <td>
                      <label className="toggle-switch" title={p.isActive === false ? 'Inactive — click to activate' : 'Active — click to deactivate'}>
                        <input
                          type="checkbox"
                          checked={p.isActive !== false}
                          onChange={() => toggleActive(p)}
                        />
                        <span className="toggle-switch-slider" />
                      </label>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => navigate(`/vendor/products/edit/${p._id}`)} className="btn-small" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(p._id)} className="btn-small btn-danger" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid var(--champagne, #EAE0D5)',
            width: '450px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink, #1e293b)', marginBottom: '1.5rem', fontFamily: 'inherit' }}>Create New Category</h3>
            <form onSubmit={handleCreateCategorySubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Joggers, Shorts, Skirts"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Gender / Section *</label>
                <select
                  value={newCategoryGender}
                  onChange={(e) => setNewCategoryGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    background: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="women">Women</option>
                  <option value="men">Men</option>
                  <option value="kids">Kids</option>
                  <option value="all">All / Unisex</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Cover Image (Optional)</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={(e) => setNewCategoryCover(e.target.files[0])}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#64748b'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Description</label>
                <textarea
                  placeholder="Optional brief description"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  style={{
                    width: '100%',
                    height: '80px',
                    padding: '0.625rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    resize: 'none',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCategoryModal(false);
                    setNewCategoryName('');
                    setNewCategoryDesc('');
                  }}
                  className="btn-small"
                  style={{ padding: '0.5rem 1.25rem', background: 'transparent', border: '1px solid #cbd5e1', color: '#475569' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={categorySubmitting}
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                >
                  {categorySubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginTop: '1.5rem', marginBottom: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              Existing Categories
            </h4>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(cat => (
                <div key={cat._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#F8FAFC', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>{cat.name}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b', marginLeft: '6px' }}>({cat.gender})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat._id)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Delete Category"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorProducts;
