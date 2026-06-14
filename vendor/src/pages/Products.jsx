import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Pencil, Trash2, Eye, EyeOff, Plus } from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = () => {
    setLoading(true);
    api.get('/vendor/products', { params: { search, page } })
      .then(({ data }) => { setProducts(data.products); setPages(data.pages); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]); // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const toggleActive = async (id) => {
    try {
      await api.put(`/vendor/products/${id}/toggle-active`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/vendor/products/${id}`);
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const totalStock = (p) => p.variants.reduce((s, v) => s + (v.stock || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>Manage your clothing catalog.</p>
        </div>
        <Link to="/products/new" className="btn btn-primary"><Plus size={16} /> Add Product</Link>
      </div>

      <form className="filter-bar" onSubmit={handleSearch}>
        <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn" type="submit">Search</button>
      </form>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : products.length === 0 ? (
          <div className="empty-state">No products yet. Click "Add Product" to create your first listing.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th><th>Type</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img className="thumb" src={p.thumbnail || p.images?.[0]} alt="" onError={(e) => { e.target.style.visibility = 'hidden'; }} />
                      <span>{p.name}</span>
                    </td>
                    <td>{p.type}</td>
                    <td>{formatPrice(p.price)}</td>
                    <td>{totalStock(p)}</td>
                    <td><span className={`badge ${p.isActive ? 'badge-active' : 'badge-inactive'}`}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/products/${p._id}/edit`} className="btn btn-sm"><Pencil size={14} /></Link>
                        <button className="btn btn-sm" onClick={() => toggleActive(p._id)} title={p.isActive ? 'Deactivate' : 'Activate'}>
                          {p.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => remove(p._id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
