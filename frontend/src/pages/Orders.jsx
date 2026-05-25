import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Package, MapPin, CalendarDays, DollarSign, ChevronDown, ArrowLeft, Download, Star, Upload, X, CheckCircle2, Clock, Truck, Box, AlertCircle, HelpCircle } from 'lucide-react';
import api from '../utils/api';
import { formatPrice } from '../utils/formatPrice';
import { generateInvoicePDF } from '../utils/generateInvoice';
import toast from 'react-hot-toast';
import './Orders.css';

const Orders = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Return Modal State
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [returnItemId, setReturnItemId] = useState(null);
  const [returnItemName, setReturnItemName] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data.orders);

      if (orderId) {
        setExpandedOrderId(orderId);
      }
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const info = {
      pending: { color: '#f59e0b', icon: <Clock size={16} />, label: 'Pending' },
      confirmed: { color: '#3b82f6', icon: <CheckCircle2 size={16} />, label: 'Confirmed' },
      processing: { color: '#8b5cf6', icon: <Package size={16} />, label: 'Processing' },
      shipped: { color: '#06b6d4', icon: <Truck size={16} />, label: 'Shipped' },
      delivered: { color: '#10b981', icon: <Box size={16} />, label: 'Delivered' },
      cancelled: { color: '#ef4444', icon: <X size={16} />, label: 'Cancelled' },
      cancel_requested: { color: '#f97316', icon: <AlertCircle size={16} />, label: 'Cancel Requested' },
      return_requested: { color: '#f97316', icon: <Clock size={16} />, label: 'Return Requested' },
      return_rejected: { color: '#dc2626', icon: <AlertCircle size={16} />, label: 'Return Rejected' },
      returned: { color: '#6b7280', icon: <Package size={16} />, label: 'Returned' },
    };
    return info[status] || { color: '#6b7280', icon: <Clock size={16} />, label: status };
  };

  const handleDownloadInvoice = async (order) => {
    setDownloadingInvoiceId(order._id);
    try {
      await generateInvoicePDF(order);
      toast.success('Invoice downloaded successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to download invoice');
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const openReturnModal = (orderId, item) => {
    setReturnOrderId(orderId);
    setReturnItemId(item._id);
    setReturnItemName(item.name);
    setReturnReason('');
    setReturnModalOpen(true);
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnOrderId || !returnItemId) return;
    setReturning(true);
    try {
      await api.put(`/orders/${returnOrderId}/return`, { itemId: returnItemId, reason: returnReason });
      toast.success('Return requested successfully!');
      setReturnModalOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request return');
    } finally {
      setReturning(false);
    }
  };

  const openReviewModal = (item) => {
    setReviewProduct(item);
    setRating(5);
    setComment('');
    setReviewPhotos([]);
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setReviewProduct(null);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingPhotos(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        uploadedUrls.push(data.url);
      }
      setReviewPhotos(prev => [...prev, ...uploadedUrls]);
      toast.success('Photos uploaded!');
    } catch (err) {
      toast.error('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewProduct) return;
    try {
      await api.post(`/products/${reviewProduct.product}/reviews`, {
        rating,
        comment,
        photos: reviewPhotos
      });
      toast.success('Review submitted successfully!');
      closeReviewModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  const handleCancelRequest = async (e) => {
    e.preventDefault();
    if (!cancelOrderId || !cancelReason) return;
    setCancelling(true);
    try {
      await api.put(`/orders/${cancelOrderId}/cancel`, { reason: cancelReason });
      toast.success('Cancellation requested successfully! Waiting for admin approval.');
      setCancelModalOpen(false);
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request cancellation');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-glow mb-3"></div>
        <p className="text-muted font-medium">Fetching your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="empty-state-icon mb-4">🛍️</div>
        <h2 className="font-heading">No Orders Yet</h2>
        <p className="text-muted mt-2 mb-4">Looks like you haven't made your first purchase yet.</p>
        <Link to="/" className="btn btn-primary px-5 py-3">
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="orders-page py-5">
      <div className="container">
        <div className="page-header d-flex align-center justify-between mb-5">
          <div className="d-flex align-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-back" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="font-heading m-0 h2">My Orders</h1>
              <p className="text-muted m-0 small">Manage your recent purchases and tracking</p>
            </div>
          </div>
        </div>

        <div className="orders-list">
          {orders.map(order => {
            const status = getStatusInfo(order.status);
            const isExpanded = expandedOrderId === order._id;

            return (
              <div key={order._id} className={`order-card-v2 mb-4 ${isExpanded ? 'expanded' : ''}`}>
                <div 
                  className="order-card-header p-4 d-flex justify-between align-center"
                  onClick={() => setExpandedOrderId(isExpanded ? null : order._id)}
                >
                  <div className="header-grid">
                    <div className="header-info-item">
                      <span className="tiny-label">Order Number</span>
                      <h4 className="m-0 font-bold">#{order.orderNumber}</h4>
                    </div>
                    <div className="header-info-item">
                      <span className="tiny-label">Placed On</span>
                      <div className="font-medium">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                    <div className="header-info-item">
                      <span className="tiny-label">Total Amount</span>
                      <div className="font-bold text-primary">{formatPrice(order.totalAmount)}</div>
                    </div>
                    <div className="header-info-item">
                      <span className="tiny-label">Status</span>
                      <div className="status-pill-v2" style={{ '--status-color': status.color }}>
                        {status.icon}
                        <span>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="header-actions d-flex align-center gap-3">
                    <span className="items-count text-muted font-medium">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                    </span>
                    <button className="btn-toggle">
                      <ChevronDown size={20} />
                    </button>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="details-grid p-4">
                    {/* Items Section */}
                    <div className="items-section">
                      <h5 className="section-title mb-4">Items in Order</h5>
                      <div className="items-stack">
                        {order.items.map((item, idx) => {
                          const NO_IMAGE_PLACEHOLDER = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22250%22%20height%3D%22250%22%20viewBox%3D%220%200%20250%20250%22%3E%3Crect%20fill%3D%22%23eaeaea%22%20width%3D%22250%22%20height%3D%22250%22%2F%3E%3Ctext%20fill%3D%22%23999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2216%22%20dy%3D%2210.5%22%20font-weight%3D%22bold%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
                          return (
                          <div key={idx} className="order-item-row">
                            <Link to={`/product/${item.product}`} className="item-img-box">
                              <img 
                                src={(!item.thumbnail || item.thumbnail === 'undefined' || item.thumbnail === 'null') ? NO_IMAGE_PLACEHOLDER : item.thumbnail} 
                                alt={item.name} 
                                onError={(e) => {
                                  e.target.onerror = null; // prevents infinite loop if placeholder also fails
                                  e.target.src = NO_IMAGE_PLACEHOLDER;
                                }}
                              />
                            </Link>
                            <div className="item-info">
                              <div className="d-flex justify-between">
                                <Link to={`/product/${item.product}`} className="item-name">{item.name}</Link>
                                <span className="item-price">{formatPrice(item.price)}</span>
                              </div>
                              <div className="item-meta">
                                <span>Size: <b>{item.variantSize}</b></span>
                                <span>Color: <b>{item.variantColor}</b></span>
                                <span>Qty: <b>{item.quantity}</b></span>
                              </div>
                              {/* Per-item return status badge */}
                              {item.returnStatus && item.returnStatus !== 'none' && (
                                <div style={{
                                  marginTop: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block',
                                  background: item.returnStatus === 'requested' ? '#fef3c7' : item.returnStatus === 'approved' ? '#d1fae5' : '#fee2e2',
                                  color: item.returnStatus === 'requested' ? '#92400e' : item.returnStatus === 'approved' ? '#065f46' : '#991b1b',
                                }}>
                                  Return {item.returnStatus.charAt(0).toUpperCase() + item.returnStatus.slice(1)}
                                  {item.returnAdminNote && <span style={{ fontWeight: 400, marginLeft: '6px' }}>— {item.returnAdminNote}</span>}
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '8px', flexWrap: 'wrap' }}>
                                {(order.status === 'delivered' || order.status === 'return_requested') && (!item.returnStatus || item.returnStatus === 'none') && (
                                  <button className="btn-review-inline" style={{ color: '#dc2626', borderColor: '#fee2e2' }} onClick={() => openReturnModal(order._id, item)}>
                                    ↩ Return Item
                                  </button>
                                )}
                                {order.status === 'delivered' && (
                                  <button className="btn-review-inline" onClick={() => openReviewModal(item)}>
                                    <Star size={12} /> Write a Review
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tracking Section */}
                    <div className="tracking-section">
                      <h5 className="section-title mb-4">Track Order</h5>
                      <div className="modern-timeline">
                        {order.statusHistory?.map((h, i) => {
                          const hInfo = getStatusInfo(h.status);
                          return (
                            <div key={i} className="timeline-node">
                              <div className="node-marker" style={{ backgroundColor: hInfo.color }}>
                                {hInfo.icon}
                              </div>
                              <div className="node-content">
                                <div className="node-label" style={{ color: hInfo.color }}>{hInfo.label}</div>
                                <div className="node-time">
                                  {new Date(h.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                {h.note && <div className="node-note">{h.note}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="address-payment-summary mt-5">
                        <div className="summary-card">
                          <div className="summary-title"><MapPin size={14}/> Shipping Address</div>
                          <div className="summary-text">
                            <strong>{order.shippingAddress.fullName}</strong><br/>
                            {order.shippingAddress.line1}, {order.shippingAddress.line2}<br/>
                            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br/>
                            Phone: {order.shippingAddress.phone}
                          </div>
                        </div>
                        <div className="summary-card mt-3">
                          <div className="summary-title"><DollarSign size={14}/> Price Details</div>
                          <div className="price-table">
                            <div className="price-row"><span>Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                            {order.discount > 0 && <div className="price-row text-success"><span>Discount</span><span>-{formatPrice(order.discount)}</span></div>}
                            <div className="price-row"><span>Shipping</span><span>{order.shippingCharge === 0 ? 'FREE' : formatPrice(order.shippingCharge)}</span></div>
                            <div className="price-row total"><span>Total</span><span>{formatPrice(order.totalAmount)}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="order-footer p-4 border-top d-flex gap-3">
                    <button className="btn-action-v2" onClick={() => handleDownloadInvoice(order)} disabled={downloadingInvoiceId === order._id}>
                      <Download size={16} /> {downloadingInvoiceId === order._id ? 'Downloading...' : 'Invoice'}
                    </button>
                    <Link to="/contact" className="btn-action-v2"><HelpCircle size={16} /> Support</Link>

                    {['pending', 'confirmed', 'processing'].includes(order.status) && (
                      <button className="btn-action-v2 danger" onClick={() => { setCancelOrderId(order._id); setCancelModalOpen(true); }}>Cancel Order</button>
                    )}
                  </div>

                  {order.cancellationRequest?.isRequested && (
                    <div className="cancel-status-bar p-4">
                      <div className="status-content">
                        <AlertCircle size={18} />
                        <div>
                          <strong>Cancellation Status: {order.status === 'cancel_requested' ? 'Pending Approval' : order.status === 'cancelled' ? 'Approved' : 'Rejected'}</strong>
                          <p>Reason: {order.cancellationRequest.reason}</p>
                          {order.cancellationRequest.adminNote && <p className="admin-note">Note: {order.cancellationRequest.adminNote}</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalOpen && reviewProduct && (
        <div className="modal-root" onClick={closeReviewModal}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <h4>Write a Review</h4>
              <button onClick={closeReviewModal}><X size={20}/></button>
            </div>
            <form className="modal-form" onSubmit={submitReview}>
              <div className="rating-box">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={32} 
                    onClick={() => setRating(star)}
                    fill={star <= rating ? "#f59e0b" : "none"}
                    stroke={star <= rating ? "#f59e0b" : "#d1d5db"}
                    className={star <= rating ? 'active' : ''}
                  />
                ))}
              </div>
              <textarea 
                className="modal-input" 
                rows="4" 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What do you think about this product?"
              ></textarea>
              <div className="photo-upload-section">
                <div className="photo-list">
                  {reviewPhotos.map((url, i) => (
                    <div key={i} className="photo-box">
                      <img src={url} alt="" />
                      <button type="button" onClick={() => setReviewPhotos(prev => prev.filter((_, idx) => idx !== i))}><X size={12}/></button>
                    </div>
                  ))}
                </div>
                <label className="upload-label">
                  {uploadingPhotos ? 'Uploading...' : <><Upload size={16} /> Add Photos</>}
                  <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploadingPhotos} />
                </label>
              </div>
              <button type="submit" className="modal-submit">Submit Review</button>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="modal-root" onClick={() => setCancelModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-head danger">
              <h4>Cancel Order</h4>
              <button onClick={() => setCancelModalOpen(false)}><X size={20}/></button>
            </div>
            <form className="modal-form" onSubmit={handleCancelRequest}>
              <div className="alert-yellow">Please provide a reason for cancellation. It will be reviewed by our team.</div>
              <textarea 
                className="modal-input" 
                rows="4" 
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why do you want to cancel?"
              ></textarea>
              <div className="d-flex gap-3">
                <button type="button" className="btn-secondary flex-1" onClick={() => setCancelModalOpen(false)}>Go Back</button>
                <button type="submit" className="btn-danger-v2 flex-1" disabled={cancelling}>{cancelling ? 'Sending...' : 'Confirm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {returnModalOpen && (
        <div className="modal-root" onClick={() => setReturnModalOpen(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-head danger">
              <h4>Return Item</h4>
              <button onClick={() => setReturnModalOpen(false)}><X size={20}/></button>
            </div>
            <form className="modal-form" onSubmit={handleReturnSubmit}>
              <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                Requesting return for: <strong>{returnItemName}</strong>
              </div>
              <div className="alert-yellow">Please tell us why you want to return this item. Our team will review your request.</div>
              <textarea
                className="modal-input"
                rows="4"
                required
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Reason for return (e.g., wrong size, damaged, not as described)"
              ></textarea>
              <div className="d-flex gap-3">
                <button type="button" className="btn-secondary flex-1" onClick={() => setReturnModalOpen(false)}>Go Back</button>
                <button type="submit" className="btn-danger-v2 flex-1" disabled={returning}>{returning ? 'Sending...' : 'Request Return'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .orders-page { background: #fdfdfd; min-height: 100vh; padding: 50px 0; }
        .p-4 { padding: 1.5rem !important; }
        .tiny-label { font-size: 0.65rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; display: block; }
        .order-card-v2 { background: white; border: 1px solid #f0f0f0; border-radius: 12px; transition: all 0.3s ease; }
        .order-card-v2.expanded { box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .order-card-header { cursor: pointer; border-bottom: 1px solid transparent; }
        .expanded .order-card-header { border-bottom: 1px solid #f5f5f5; }
        
        .header-grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1fr; gap: 1.5rem; flex: 1; }
        @media (max-width: 992px) { .header-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; } }
        @media (max-width: 576px) { 
          .header-grid { grid-template-columns: 1fr; gap: 0.75rem; }
          .order-card-header { flex-direction: column; align-items: flex-start !important; gap: 1rem; }
          .header-actions { width: 100%; justify-content: space-between; border-top: 1px solid #f5f5f5; pt-3; padding-top: 12px; }
        }
        
        .status-pill-v2 { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; color: var(--status-color); background: color-mix(in srgb, var(--status-color), transparent 90%); }
        .btn-toggle { background: none; border: none; color: #ccc; transition: 0.3s; }
        .expanded .btn-toggle { transform: rotate(180deg); color: var(--color-primary); }
        
        .order-card-body { max-height: 0; overflow: hidden; transition: max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        .expanded .order-card-body { max-height: 5000px; }
        
        .details-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 3rem; }
        @media (max-width: 992px) { .details-grid { grid-template-columns: 1fr; gap: 2rem; } }
        
        .section-title { font-size: 0.95rem; font-weight: 800; border-left: 4px solid var(--color-primary); padding-left: 12px; color: #333; }
        
        /* Items List Fix */
        .items-stack { display: flex; flex-direction: column; gap: 1rem; }
        .order-item-row { display: flex; gap: 1.5rem; padding: 1rem; border: 1px solid #f7f7f7; border-radius: 12px; background: #fff; }
        @media (max-width: 480px) { 
          .order-item-row { flex-direction: column; gap: 1rem; align-items: center; text-align: center; }
          .item-meta { justify-content: center; }
        }
        
        .item-img-box { width: 90px; height: 110px; flex-shrink: 0; background: #f5f5f5; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .item-img-box img { width: 100%; height: 100%; object-fit: cover; }
        .item-info { flex: 1; }
        .item-name { font-weight: 700; color: #111; text-decoration: none; font-size: 0.95rem; }
        .item-price { font-weight: 800; color: #333; }
        .item-meta { font-size: 0.8rem; color: #777; margin-top: 4px; display: flex; gap: 1rem; }
        .btn-review-inline { background: none; border: 1px solid #eee; color: #666; font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; margin-top: 10px; cursor: pointer; }
        
        /* Modern Timeline */
        .modern-timeline { position: relative; padding-left: 32px; }
        .modern-timeline::before { content: ''; position: absolute; left: 14.5px; top: 10px; bottom: 10px; width: 2px; background: #f0f0f0; }
        .timeline-node { position: relative; margin-bottom: 2rem; }
        .node-marker { position: absolute; left: -32px; top: 0; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; display: flex; align-items: center; justify-content: center; color: white; z-index: 2; }
        .node-marker svg { width: 14px; height: 14px; }
        .node-label { font-weight: 800; font-size: 0.85rem; }
        .node-time { font-size: 0.65rem; color: #aaa; }
        .node-note { font-size: 0.75rem; color: #777; font-style: italic; margin-top: 4px; background: #f9f9f9; padding: 4px 8px; border-radius: 4px; }
        
        .summary-card { padding: 1.25rem; background: #fafafa; border-radius: 12px; }
        .summary-title { font-weight: 700; font-size: 0.8rem; color: var(--color-primary); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
        .summary-text { font-size: 0.75rem; color: #666; line-height: 1.5; }
        
        .price-table { margin-top: 10px; }
        .price-row { display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px; color: #777; }
        .price-row.total { border-top: 1px solid #eee; padding-top: 8px; margin-top: 8px; font-weight: 800; color: #111; font-size: 0.9rem; }
        
        .order-footer { background: #fafafa; padding: 1.25rem; display: flex; flex-wrap: wrap; gap: 1rem; }
        @media (max-width: 576px) { .btn-action-v2 { flex: 1; min-width: 150px; justify-content: center; } }
        
        .btn-action-v2 { display: flex; align-items: center; gap: 8px; padding: 10px 18px; background: white; border: 1px solid #eee; border-radius: 8px; font-weight: 700; font-size: 0.8rem; color: #444; cursor: pointer; text-decoration: none; transition: 0.2s; }
        .btn-action-v2:hover { background: #f9f9f9; transform: translateY(-1px); }
        .btn-action-v2.danger { color: #dc2626; border-color: #fee2e2; }
        .btn-action-v2.danger:hover { background: #dc2626; color: white; }
        
        .cancel-status-bar { border-top: 1px solid #fff5f5; background: #fffcfc; padding: 1.25rem; }
        .status-content { display: flex; gap: 12px; color: #dc2626; }
        .status-content strong { font-size: 0.85rem; }
        .status-content p { margin: 2px 0 0; font-size: 0.75rem; color: #888; }
        .admin-note { color: #dc2626 !important; font-weight: 600; }

        /* Modal Redesign */
        .modal-root { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 1rem; }
        .modal-container { background: white; width: 100%; max-width: 450px; border-radius: 20px; box-shadow: 0 30px 60px rgba(0,0,0,0.2); animation: pop 0.3s ease; overflow: hidden; }
        @keyframes pop { from { transform: scale(0.9); opacity: 0; } }
        .modal-head { padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f5f5f5; }
        .modal-head.danger { background: #fff5f5; color: #dc2626; }
        .modal-form { padding: 1.5rem; }
        .rating-box { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; }
        .modal-input { width: 100%; border: 1.5px solid #eee; border-radius: 12px; padding: 12px; font-size: 0.9rem; transition: 0.2s; }
        .modal-input:focus { border-color: var(--color-primary); outline: none; }
        .modal-submit { width: 100%; padding: 14px; background: var(--color-primary); color: white; border: none; border-radius: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 1.5rem; cursor: pointer; }
        .upload-label { border: 2px dashed #eee; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border-radius: 10px; color: #888; cursor: pointer; font-size: 0.8rem; }
        .alert-yellow { padding: 10px; background: #fffbeb; color: #92400e; border-radius: 8px; font-size: 0.75rem; margin-bottom: 1rem; }
        .photo-list { display: flex; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
        .photo-box { position: relative; width: 50px; height: 50px; }
        .photo-box img { width: 100%; height: 100%; object-fit: cover; border-radius: 4px; }
        .photo-box button { position: absolute; -top: 5px; -right: 5px; background: red; color: white; border: none; border-radius: 50%; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; font-size: 8px; }
        
        .spinner-glow { width: 30px; height: 30px; border: 3px solid #eee; border-top-color: var(--color-primary); border-radius: 50%; animation: rot 1s infinite linear; }
        @keyframes rot { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Orders;
