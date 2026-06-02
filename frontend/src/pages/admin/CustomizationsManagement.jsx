import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './CustomizationsManagement.css'; // We'll just reuse standard admin table styles or make a simple one

const CustomizationsManagement = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/customizations`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(data.customizations);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus, priceQuote, paymentStatus) => {
    // If it's a mock request, just alert
    if (id === 'mock') {
      alert("This is sample data. A real user request is needed to update the database.");
      return;
    }

    try {
      const payload = {};
      if (newStatus !== undefined) payload.status = newStatus;
      if (priceQuote !== undefined) payload.priceQuote = priceQuote;
      if (paymentStatus !== undefined) payload.paymentStatus = paymentStatus;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/customizations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setRequests(requests.map(req => req._id === id ? data.customization : req));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Mock data to display if empty
  const displayRequests = requests.length > 0 ? requests : [{
    _id: 'mock',
    user: { name: 'Jane Doe (Sample)', email: 'jane@example.com', phone: '+1234567890' },
    fabric: 'silk',
    color: 'Midnight Blue',
    measurements: { bust: 34, waist: 28, hips: 38, length: 50 },
    notes: 'I want a beautiful backless gown design.',
    status: 'pending',
    priceQuote: 0,
    paymentStatus: 'pending',
    isMock: true
  }];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Customization Requests</h1>
        <p>Review and manage customer bespoke design requests.</p>
      </div>

      <div className="admin-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Fabric & Color</th>
                <th>Measurements</th>
                <th>Notes</th>
                <th>Quote (₹)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayRequests.map(req => (
                <tr key={req._id}>
                  <td>
                    <strong>{req.user?.name}</strong><br/>
                    <small>{req.user?.email}</small><br/>
                    <small>{req.user?.phone}</small>
                  </td>
                  <td>
                    {req.fabric}<br/>
                    <span style={{ color: 'var(--text-secondary)' }}>{req.color}</span>
                  </td>
                  <td>
                    B: {req.measurements?.bust || '-'} | W: {req.measurements?.waist || '-'} <br/>
                    H: {req.measurements?.hips || '-'} | L: {req.measurements?.length || '-'}
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    {req.notes || <span style={{ color: '#ccc' }}>No notes</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        className="form-input" 
                        style={{ width: '80px', padding: '4px' }} 
                        defaultValue={req.priceQuote}
                        onBlur={(e) => handleStatusChange(req._id, undefined, Number(e.target.value), undefined)}
                        placeholder="Price"
                      />
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>
                      {req.status}
                    </span>
                    <br/>
                    <small style={{ color: req.paymentStatus === 'paid' ? 'green' : 'gray' }}>
                      {req.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                    </small>
                  </td>
                  <td>
                    <select 
                      value={req.status}
                      onChange={(e) => handleStatusChange(req._id, e.target.value, undefined, undefined)}
                      className="form-input"
                      style={{ padding: '4px', fontSize: '12px' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="quoted">Quoted (Awaiting Payment)</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomizationsManagement;
