import { useState, useEffect, useMemo } from 'react';
import { Trash2, Eye, Search, Shield, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const UsersManagement = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const navigate = useNavigate();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const displayed = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  const initials = (name) =>
    (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (loading) return (
    <div className="admin-loading">
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading users…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Customers</h1>
          <p className="admin-page-subtitle">{users.length} registered account{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search */}
      <div className="filter-bar" style={{ marginBottom:'1.25rem' }}>
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Joined</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan="5" className="no-data">No users found</td></tr>
            ) : (
              displayed.map(user => (
                <tr key={user._id}>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{initials(user.name)}</div>
                      <div>
                        <div className="table-cell-primary">{user.name}</div>
                        <div className="table-cell-secondary">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize:'0.875rem', color:'#64748b' }}>
                    {user.phone || <span style={{ color:'#cbd5e1' }}>—</span>}
                  </td>
                  <td>
                    <span className={`status-badge ${user.role === 'admin' ? 'badge-admin' : 'badge-user'}`}>
                      {user.role === 'admin'
                        ? <><Shield size={11} style={{ verticalAlign:'middle', marginRight:3 }}/>Admin</>
                        : <><User size={11} style={{ verticalAlign:'middle', marginRight:3 }}/>Customer</>
                      }
                    </span>
                  </td>
                  <td style={{ fontSize:'0.8rem', color:'#64748b' }}>
                    {new Date(user.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                  </td>
                  <td>
                    <div style={{ display:'flex', gap:'0.375rem', justifyContent:'flex-end' }}>
                      <button
                        onClick={() => navigate(`/admin/users/${user._id}`)}
                        className="btn-icon-sm view"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        disabled={user.role === 'admin'}
                        className="btn-icon-sm delete"
                        title={user.role === 'admin' ? 'Cannot delete admin' : 'Delete User'}
                        style={{ opacity: user.role === 'admin' ? 0.3 : 1, cursor: user.role === 'admin' ? 'not-allowed' : 'pointer' }}
                      >
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

export default UsersManagement;
