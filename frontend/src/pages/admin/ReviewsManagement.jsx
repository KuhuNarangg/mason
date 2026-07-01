import { useState, useEffect, useMemo } from 'react';
import { Trash2, Star, Search } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

const ReviewsManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'approved'
  const [busyId, setBusyId]   = useState(null);

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get('/admin/reviews');
      setReviews(data.reviews || []);
    } catch {
      toast.error('Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (review) => {
    if (!confirm(`Delete this review by ${review.name}?`)) return;
    setBusyId(review.reviewId);
    try {
      await api.delete(`/admin/reviews/${review.productId}/${review.reviewId}`);
      toast.success('Review deleted');
      fetchReviews();
    } catch {
      toast.error('Failed to delete review');
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (review) => {
    setBusyId(review.reviewId);
    try {
      const { data } = await api.put(`/admin/reviews/${review.productId}/${review.reviewId}/approve`);
      toast.success(data.message);
      // Update local state without refetching to be snappy
      setReviews(prev => prev.map(r => r.reviewId === review.reviewId ? { ...r, isApproved: data.isApproved } : r));
    } catch {
      toast.error('Failed to update review status');
    } finally {
      setBusyId(null);
    }
  };

  const displayed = useMemo(() => {
    let list = reviews;
    if (ratingFilter) list = list.filter(r => String(r.rating) === ratingFilter);
    if (statusFilter === 'pending') list = list.filter(r => !r.isApproved);
    if (statusFilter === 'approved') list = list.filter(r => r.isApproved);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.productName?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.comment?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [reviews, search, ratingFilter]);

  if (loading) return (
    <div className="admin-loading">
      <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      Loading reviews…
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="admin-page-title">Reviews</h1>
          <p className="admin-page-subtitle">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="filter-bar" style={{ marginBottom: '1.25rem' }}>
        <div className="filter-tabs">
          {['all', 'pending', 'approved'].map(s => (
            <button key={s} className={`filter-tab${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="vertical-divider" style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 8px' }} />
          {['', '5', '4', '3', '2', '1'].map(r => (
            <button key={r} className={`filter-tab${ratingFilter === r ? ' active' : ''}`} onClick={() => setRatingFilter(r)}>
              {r === '' ? 'All ★' : `${r} ★`}
            </button>
          ))}
        </div>
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by product, customer, or comment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Customer</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan="6" className="no-data">No reviews found.</td></tr>
            ) : (
              displayed.map((r) => (
                <tr key={r.reviewId}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {r.productThumbnail && <img src={r.productThumbnail} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                      <div className="table-cell-primary">{r.productName}</div>
                    </div>
                  </td>
                  <td className="table-cell-secondary">{r.name}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#f59e0b' }}>
                      {r.rating} <Star size={14} fill="#f59e0b" stroke="none" />
                    </span>
                  </td>
                  <td className="table-cell-secondary" style={{ maxWidth: 320 }}>{r.comment || '—'}</td>
                  <td>
                    {r.isApproved ? (
                      <span className="status-badge active" style={{ fontSize: '0.75rem' }}>Approved</span>
                    ) : (
                      <span className="status-badge pending" style={{ fontSize: '0.75rem', background: '#fef3c7', color: '#92400e' }}>Pending</span>
                    )}
                  </td>
                  <td className="table-cell-secondary">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button 
                        className={`btn-icon-sm ${r.isApproved ? 'edit' : 'add'}`} 
                        disabled={busyId === r.reviewId} 
                        title={r.isApproved ? "Unapprove Review" : "Approve Review"} 
                        onClick={() => handleApprove(r)}
                        style={{ color: r.isApproved ? '#d97706' : '#059669', background: r.isApproved ? '#fef3c7' : '#d1fae5' }}
                      >
                        {r.isApproved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button className="btn-icon-sm delete" disabled={busyId === r.reviewId} title="Delete Review" onClick={() => handleDelete(r)}>
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

export default ReviewsManagement;
