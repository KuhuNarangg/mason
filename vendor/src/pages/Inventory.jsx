import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Inventory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowOnly, setLowOnly] = useState(false);
  const [editing, setEditing] = useState({});

  const load = () => {
    setLoading(true);
    api.get('/vendor/inventory')
      .then(({ data }) => setRows(data.inventory || data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const visibleRows = lowOnly ? rows.filter((r) => r.isLow) : rows;

  const saveStock = async (row) => {
    const key = `${row.productId}_${row.variantId}`;
    const value = editing[key];
    if (value === undefined) return;
    try {
      await api.put(`/vendor/inventory/${row.productId}/variants/${row.variantId}`, { stock: Number(value) });
      toast.success('Stock updated');
      setEditing((e) => { const next = { ...e }; delete next[key]; return next; });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update stock');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Inventory</h1>
          <p>Track stock across all product variants.</p>
        </div>
      </div>

      <div className="filter-bar">
        <label className="checkbox-row" style={{ margin: 0 }}>
          <input type="checkbox" checked={lowOnly} onChange={(e) => setLowOnly(e.target.checked)} /> Show low stock only
        </label>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : visibleRows.length === 0 ? (
          <div className="empty-state">No inventory items found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Product</th><th>Size</th><th>Color</th><th>SKU</th><th>Stock</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => {
                  const key = `${row.productId}_${row.variantId}`;
                  const value = editing[key] ?? row.stock;
                  return (
                    <tr key={key}>
                      <td>{row.productName}</td>
                      <td>{row.size}</td>
                      <td>{row.color}</td>
                      <td>{row.sku || '—'}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          style={{ width: 80 }}
                          value={value}
                          onChange={(e) => setEditing((ed) => ({ ...ed, [key]: e.target.value }))}
                        />
                      </td>
                      <td><span className={`badge ${row.isLow ? 'badge-low' : 'badge-active'}`}>{row.isLow ? 'Low Stock' : 'OK'}</span></td>
                      <td>
                        <button className="btn btn-sm" onClick={() => saveStock(row)} disabled={editing[key] === undefined}>Save</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
