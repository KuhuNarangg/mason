import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './CustomizationsManagement.css'; 

const CustomizationsManagement = () => {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/customizations`, {
        headers: { Authorization: `Bearer ${token}` }
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
          Authorization: `Bearer ${token}`
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

  const displayRequests = requests.length > 0 ? requests : [{
    _id: 'mock',
    user: { name: 'Jane Doe (Sample)', email: 'jane@example.com', phone: '+1234567890' },
    productType: 'Hoodie',
    designType: 'Custom Upload',
    material: 'Heavy GSM (Streetwear)',
    color: 'Midnight Black',
    printType: 'DTF Print',
    printPlacement: 'Front Center',
    quoteText: '',
    customDesignUrl: 'https://via.placeholder.com/150',
    quantity: 2,
    totalPrice: 1500,
    notes: 'Please make it extra puffy',
    status: 'pending',
    paymentStatus: 'pending',
    isMock: true
  }];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Custom Design Orders</h1>
        <p>Review and manage customer custom apparel orders.</p>
      </div>

      <div className="admin-card">
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Product & Theme</th>
                <th>Specs</th>
                <th>Design / Artwork</th>
                <th>Notes</th>
                <th>Price (₹)</th>
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
                    <strong>{req.productType}</strong> (x{req.quantity})<br/>
                    <span style={{ color: 'var(--text-secondary)' }}>{req.designType}</span>
                  </td>
                  <td>
                    <small><strong>Mat:</strong> {req.material}</small><br/>
                    <small><strong>Color:</strong> {req.color}</small><br/>
                    <small><strong>Print:</strong> {req.printType}</small><br/>
                    <small><strong>Place:</strong> {req.printPlacement}</small>
                  </td>
                  <td>
                    {req.customDesignUrl ? (
                      <a href={req.customDesignUrl} target="_blank" rel="noreferrer">
                        <img src={req.customDesignUrl} alt="Design" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '4px', border: '1px solid #ccc' }} />
                      </a>
                    ) : req.quoteText ? (
                      <span style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>"{req.quoteText}"</span>
                    ) : (
                      <span style={{ color: '#ccc' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '150px' }}>
                    {req.notes || <span style={{ color: '#ccc' }}>No notes</span>}
                  </td>
                  <td>
                    <strong>₹{req.totalPrice}</strong>
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
                      <option value="approved">Approved</option>
                      <option value="disapproved">Disapproved</option>
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
