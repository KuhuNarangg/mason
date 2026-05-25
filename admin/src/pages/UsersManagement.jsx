import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this user?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        toast.success('User deleted');
        fetchUsers();
      } catch {
        toast.error('Failed to delete user');
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 style={{ marginBottom: '2rem' }}>Users Management</h2>

      <div className="kpi-card" style={{ display: 'block' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', background: '#f9fafb' }}>
              <th style={{ padding: '1rem 0' }}>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.75rem 0' }}>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone || '-'}</td>
                <td>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      background: user.role === 'admin' ? '#dbeafe' : '#e5e7eb',
                      color: user.role === 'admin' ? '#1565c0' : '#374151',
                    }}
                  >
                    {user.role}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleDelete(user._id)}
                    disabled={user.role === 'admin'}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: user.role === 'admin' ? 'not-allowed' : 'pointer',
                      color: user.role === 'admin' ? '#ccc' : '#ef4444',
                      opacity: user.role === 'admin' ? 0.5 : 1,
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
            No users found
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
