import { useState, useEffect, useMemo } from 'react';
import { Search, MessageSquare, CheckCircle, Clock, AlertCircle, Edit3, User, Mail, Phone, ExternalLink } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const QueriesManagement = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingQuery, setEditingQuery] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const { data } = await api.get('/queries');
      setQueries(data.queries || []);
    } catch (err) {
      console.error('Fetch Queries Error:', err);
      toast.error('Failed to fetch customer queries');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (queryId, newStatus) => {
    setUpdatingId(queryId);
    try {
      const { data } = await api.put(`/queries/${queryId}`, { status: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      setQueries(prev => prev.map(q => q._id === queryId ? { ...q, status: newStatus } : q));
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!editingQuery) return;
    setUpdatingId(editingQuery._id);
    try {
      const { data } = await api.put(`/queries/${editingQuery._id}`, { notes: noteText });
      toast.success('Notes saved');
      setQueries(prev => prev.map(q => q._id === editingQuery._id ? { ...q, notes: noteText } : q));
      setEditingQuery(null);
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredQueries = useMemo(() => {
    let list = queries;
    if (statusFilter !== 'all') {
      list = list.filter(q => q.status === statusFilter);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(q =>
        q.name.toLowerCase().includes(term) ||
        q.email.toLowerCase().includes(term) ||
        q.query.toLowerCase().includes(term) ||
        (q.phone && q.phone.includes(term))
      );
    }
    return list;
  }, [queries, statusFilter, search]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
        return <span className="status-badge status-new"><AlertCircle size={12} /> New</span>;
      case 'In Progress':
        return <span className="status-badge status-in-progress"><Clock size={12} /> In Progress</span>;
      case 'Resolved':
        return <span className="status-badge status-resolved"><CheckCircle size={12} /> Resolved</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2>Customer Queries</h2>
          <p className="admin-subtitle">Manage customer questions and chatbot escalations</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-toolbar" style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="admin-search-box" style={{ flex: 1, minWidth: '240px' }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by customer name, email, or query..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="all">All Statuses</option>
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">Loading customer queries...</div>
      ) : filteredQueries.length === 0 ? (
        <div className="admin-empty">No customer queries found.</div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date & Source</th>
                <th>Customer</th>
                <th>Query Message</th>
                <th>Status</th>
                <th>Admin Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueries.map((q) => (
                <tr key={q._id}>
                  <td>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>
                      {new Date(q.createdAt).toLocaleDateString()} {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>
                      <span className="source-tag">{q.source || 'AI Chatbot'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} /> {q.name}
                      {q.user ? (
                        <span className="user-type-tag registered">Registered User</span>
                      ) : (
                        <span className="user-type-tag guest">Guest</span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#555', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Mail size={12} /> {q.email}
                    </div>
                    {q.phone && (
                      <div style={{ fontSize: '0.8rem', color: '#555', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <Phone size={12} /> {q.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: '300px' }}>
                    <div className="query-text-box">
                      {q.query}
                    </div>
                    {q.product && (
                      <div className="query-product-tag">
                        <strong>Product:</strong> {q.product}
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      className={`status-select status-select-${q.status.toLowerCase().replace(' ', '-')}`}
                      value={q.status}
                      disabled={updatingId === q._id}
                      onChange={(e) => handleStatusChange(q._id, e.target.value)}
                    >
                      <option value="New">New</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    {q.notes ? (
                      <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#444' }}>
                        {q.notes}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#aaa' }}>No notes</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="admin-btn-secondary"
                      onClick={() => { setEditingQuery(q); setNoteText(q.notes || ''); }}
                      title="Edit Admin Notes"
                    >
                      <Edit3 size={14} /> Note
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingQuery && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Admin Notes for Query</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '12px' }}>
              Customer: <strong>{editingQuery.name}</strong> ({editingQuery.email})
            </p>
            <textarea
              className="admin-textarea"
              rows={4}
              placeholder="Add internal notes or customer response summary..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <div className="admin-modal-actions">
              <button className="admin-btn-secondary" onClick={() => setEditingQuery(null)}>Cancel</button>
              <button className="admin-btn-primary" onClick={handleSaveNotes} disabled={updatingId === editingQuery._id}>
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueriesManagement;
