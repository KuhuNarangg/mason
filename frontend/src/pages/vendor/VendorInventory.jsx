import { useState, useEffect } from 'react';
import { Search, Check, X } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import '../admin/admin-pages.css';

const VendorInventory = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetchInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowStockOnly]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vendor/inventory', { params: { lowStockOnly: lowStockOnly ? 'true' : undefined } });
      setItems(data.items);
    } catch {
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(`${row.productId}-${row.variantId}`);
    setEditValue(String(row.stock));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEdit = async (row) => {
    const stock = Number(editValue);
    if (Number.isNaN(stock) || stock < 0) return toast.error('Enter a valid stock value');
    try {
      await api.put(`/vendor/inventory/${row.productId}/variants/${row.variantId}`, { stock });
      toast.success('Stock updated');
      setEditingId(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  const filtered = items.filter((i) => i.productName.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="admin-loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Inventory</h1>
      </div>

      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input className="search-input" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="filter-tabs">
          <button className={`filter-tab${!lowStockOnly ? ' active' : ''}`} onClick={() => setLowStockOnly(false)}>All</button>
          <button className={`filter-tab${lowStockOnly ? ' active' : ''}`} onClick={() => setLowStockOnly(true)}>Low Stock</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Size</th>
              <th>Color</th>
              <th>SKU</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="no-data">No inventory items found.</td></tr>
            ) : (
              filtered.map((row) => {
                const key = `${row.productId}-${row.variantId}`;
                return (
                  <tr key={key}>
                    <td>
                      <div className="product-info-cell">
                        <img src={row.thumbnail || 'https://placehold.co/40?text=No+Image'} alt={row.productName} className="product-info-thumb" style={{ width: 36, height: 36 }} />
                        <span className="product-info-name" style={{ fontWeight: 600 }}>{row.productName}</span>
                      </div>
                    </td>
                    <td>{row.size}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: row.colorHex || '#ccc', border: '1px solid #ddd' }}></div>
                        {row.color}
                      </div>
                    </td>
                    <td className="table-cell-secondary">{row.sku}</td>
                    <td>
                      {editingId === key ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="form-input"
                          style={{ width: 80, padding: '0.375rem 0.5rem', textAlign: 'center' }}
                          autoFocus
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.stock}</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge badge-${row.isLow ? 'low-stock' : 'ok'}`}>
                        {row.isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      {editingId === key ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn-small"
                            onClick={() => saveEdit(row)}
                            title="Save"
                            style={{ background: '#C08A74', color: 'white', border: 'none' }}
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className="btn-small btn-cancel"
                            onClick={cancelEdit}
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn-small"
                          onClick={() => startEdit(row)}
                          style={{ borderColor: '#C08A74', color: '#C08A74' }}
                        >
                          Edit Stock
                        </button>
                      )}
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

export default VendorInventory;
