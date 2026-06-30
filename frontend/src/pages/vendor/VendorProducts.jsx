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

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">My Products</h1>
        <button className="btn-primary" onClick={() => navigate('/vendor/products/new')}>
          <Plus size={20} /> Add Product
        </button>
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
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No products yet. Add your first product to get started!
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const totalStock = (p.variants || []).reduce((s, v) => s + (v.stock || 0), 0);
                const maxStock = 1000;
                const pct = Math.min(100, Math.round((totalStock / maxStock) * 100));
                const level = pct >= 60 ? 'high' : pct >= 30 ? 'medium' : 'low';
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
    </div>
  );
};

export default VendorProducts;
