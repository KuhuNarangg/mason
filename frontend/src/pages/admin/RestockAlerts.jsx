import { useState, useEffect } from 'react';
import { Bell, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const RestockAlerts = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/restock-notifications', {
        params: { page, limit: 15 }
      });
      setNotifications(data.notifications || []);
      setTotalPages(data.pages || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      toast.error('Failed to fetch restock notifications');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <Bell size={24} className="text-[#C08A74]" />
            Restock Alerts
          </h1>
          <p className="text-sm text-slate-500">
            Track user notification subscriptions for out-of-stock products
          </p>
        </div>
        <div className="bg-[#C08A74]/10 text-[#C08A74] px-4 py-2 rounded-lg font-semibold text-sm">
          Total Requests: {totalItems}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C08A74]"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center">
          <Bell size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-1">No Alerts Logged</h3>
          <p className="text-slate-400">There are no customer restock notification requests at this time.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-600 uppercase">
                  <th className="py-4 px-6">Product</th>
                  <th className="py-4 px-6">Customer Email</th>
                  <th className="py-4 px-6 text-center">Size</th>
                  <th className="py-4 px-6 text-center">Color</th>
                  <th className="py-4 px-6">Request Date</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {notifications.map((n) => {
                  const p = n.product || {};
                  return (
                    <tr key={n._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img
                          src={p.thumbnail || '/placeholder.png'}
                          alt={p.name || 'Product'}
                          style={{
                            width: '40px',
                            height: '50px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                          onError={(e) => {
                            e.target.src = '/placeholder.png';
                          }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate max-w-[200px]" title={p.name}>
                            {p.name || 'Deleted Product'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {p.price ? `₹${p.price.toLocaleString()}` : '-'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-600">
                        {n.email}
                      </td>
                      <td className="py-4 px-6 text-center font-bold text-slate-800">
                        {n.size || '-'}
                      </td>
                      <td className="py-4 px-6 text-center text-slate-500">
                        {n.color || '-'}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {formatDate(n.createdAt)}
                      </td>
                      <td className="py-4 px-6">
                        {n.isNotified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={12} />
                            Notified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
                            <AlertCircle size={12} />
                            Pending Restock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RestockAlerts;
