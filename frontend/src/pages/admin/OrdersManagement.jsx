import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { Search, Check, X, Package, Download, Eye } from 'lucide-react';
import { generateInvoicePDF } from '../../utils/generateInvoice';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import './admin-pages.css';

/* ── State Machine ─────────────────────────────────────── */
const ALLOWED_TRANSITIONS = {
  pending:          ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['delivered'],
  delivered:        [],
  cancelled:        [],
  cancel_requested: [],
  return_requested: [],
  returned:         [],
  return_rejected:  [],
};

const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
  cancel_requested: 'Cancel Request', return_requested: 'Return Request',
  returned: 'Returned', return_rejected: 'Return Rejected',
};

const STATUS_CLASS = {
  pending: 'badge-pending', confirmed: 'badge-confirmed', processing: 'badge-processing',
  shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled',
  cancel_requested: 'badge-cancel_requested', return_requested: 'badge-return_requested',
  returned: 'badge-returned', return_rejected: 'badge-return_rejected',
};

const FILTER_TABS = [
  { label: 'All',            value: '' },
  { label: 'Pending',        value: 'pending' },
  { label: 'Confirmed',      value: 'confirmed' },
  { label: 'Processing',     value: 'processing' },
  { label: 'Shipped',        value: 'shipped' },
  { label: 'Delivered',      value: 'delivered' },
  { label: 'Cancel Req.',    value: 'cancel_requested' },
  { label: 'Return Req.',    value: 'return_requested' },
];

const MONTHS = [
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

const availableDates = Array.from({ length: 31 }, (_, i) => i + 1);

/* ── Return Item Badge ─────────────────────────────────── */
const returnBadgeClass = {
  requested: 'badge-return_requested',
  approved:  'badge-delivered',
  rejected:  'badge-cancelled',
  completed: 'badge-returned',
};

/* ── Note Modal ────────────────────────────────────────── */
const NoteModal = ({ title, onConfirm, onClose }) => {
  const [note, setNote] = useState('');
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background:'white', borderRadius:'14px', width:'100%', maxWidth:'420px', boxShadow:'0 20px 40px rgba(0,0,0,0.15)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>{title}</h3>
          <button onClick={onClose} className="btn-icon-sm"><X size={18}/></button>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <label style={{ display:'block', fontSize:'0.78rem', fontWeight:600, color:'#374151', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Note (optional)
          </label>
          <textarea
            className="form-textarea"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
          />
        </div>
        <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:'0.75rem' }}>
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={() => onConfirm(note)} className="btn-submit">Confirm</button>
        </div>
      </div>
    </div>
  );
};

/* ── Cancellation Detail Modal ─────────────────────────── */
const CancellationModal = ({ order, onApprove, onReject, onClose }) => {
  const [note, setNote] = useState('');
  if (!order) return null;
  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'1rem' }}
      onClick={onClose}
    >
      <div
        style={{ background:'white', borderRadius:'16px', width:'100%', maxWidth:'460px', boxShadow:'0 20px 40px rgba(0,0,0,0.18)', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#0f172a' }}>Cancellation Request</h3>
            <p style={{ margin:'2px 0 0', fontSize:'0.75rem', color:'#94a3b8' }}>
              #{order.orderNumber?.replace('ORD-','') || order._id.slice(-6).toUpperCase()} · {order.user?.name}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:'4px' }}>
            <X size={18}/>
          </button>
        </div>

        {/* Reason Card */}
        <div style={{ padding:'1.25rem 1.5rem' }}>
          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'10px', padding:'1rem 1.25rem', marginBottom:'1.25rem' }}>
            <p style={{ margin:'0 0 0.4rem', fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#c2410c' }}>
              Customer Reason
            </p>
            <p style={{ margin:'0 0 0.75rem', fontSize:'0.9rem', color:'#0f172a', lineHeight:1.55, fontWeight:500 }}>
              {order.cancellationRequest?.reason || 'No reason provided'}
            </p>
            <p style={{ margin:0, fontSize:'0.72rem', color:'#94a3b8' }}>
              Requested on {new Date(order.cancellationRequest?.requestedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
            </p>
          </div>

          {/* Order summary */}
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.25rem', padding:'0.75rem 1rem', background:'#f8fafc', borderRadius:'8px', fontSize:'0.82rem' }}>
            <span style={{ color:'#64748b' }}>Order Amount</span>
            <span style={{ fontWeight:700, color:'#0f172a' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
          </div>

          {/* Admin note */}
          <label style={{ display:'block', fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'#374151', marginBottom:'0.4rem' }}>
            Admin Note (optional)
          </label>
          <textarea
            className="form-textarea"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add an internal note..."
            rows={2}
            style={{ marginBottom:'1.25rem' }}
          />
        </div>

        {/* Actions */}
        <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid #f1f5f9', display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
          <button onClick={onClose} className="btn-cancel">Close</button>
          <button
            onClick={() => onReject(note)}
            style={{ display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.55rem 1.1rem', background:'#475569', color:'white', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}
          >
            <X size={14}/> Reject
          </button>
          <button
            onClick={() => onApprove(note)}
            style={{ display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.55rem 1.1rem', background:'#ef4444', color:'white', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'0.82rem', cursor:'pointer' }}
          >
            <Check size={14}/> Approve & Refund
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ────────────────────────────────────── */
const OrdersManagement = () => {
  const location = useLocation();
  const initialFilter = new URLSearchParams(location.search).get('status') || '';

  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState(initialFilter);
  const [search, setSearch]       = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [noteModal, setNoteModal]     = useState(null); // { title, onConfirm }
  const [cancelModal, setCancelModal] = useState(null); // order object

  // Date selectors states
  const [filterYear, setFilterYear] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/orders?status=${filter}&limit=100`);
      setOrders(data.orders || []);
    } catch {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  // Extract unique years dynamically from order timestamps
  const availableYears = useMemo(() => {
    const years = orders.map(o => new Date(o.createdAt).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  }, [orders]);

  /* filtered by search & date (Year, Month, Date) */
  const displayed = useMemo(() => {
    let result = orders;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q)
      );
    }

    if (filterYear) {
      result = result.filter(o => new Date(o.createdAt).getFullYear() === Number(filterYear));
    }

    if (filterMonth) {
      result = result.filter(o => new Date(o.createdAt).getMonth() === Number(filterMonth));
    }

    if (filterDate) {
      result = result.filter(o => new Date(o.createdAt).getDate() === Number(filterDate));
    }

    return result;
  }, [orders, search, filterYear, filterMonth, filterDate]);

  /* ── Actions ── */
  const promptNote = (title, onConfirm) => setNoteModal({ title, onConfirm });

  const updateStatus = (orderId, currentStatus, newStatus) => {
    if (newStatus === currentStatus) return;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      toast.error(`Cannot change "${currentStatus}" → "${newStatus}"`);
      return;
    }
    promptNote(`Update to "${STATUS_LABELS[newStatus]}"`, async (note) => {
      setNoteModal(null);
      try {
        await api.put(`/orders/${orderId}/status`, { status: newStatus, note: note || `Order is now ${newStatus}` });
        toast.success('Status updated');
        fetchOrders();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update');
      }
    });
  };

  const handleUpdateTracking = async (orderId, url) => {
    if (url && !/^(https?:\/\/)/i.test(url)) {
      toast.error('Invalid URL. Must start with http:// or https://');
      fetchOrders();
      return;
    }

    try {
      await api.put(`/orders/${orderId}/tracking`, { trackingUrl: url });
      toast.success('Tracking URL updated');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update tracking');
    }
  };

  const handleUpdateAdminNotes = async (orderId, notes) => {
    try {
      await api.put(`/orders/${orderId}/admin-notes`, { adminNotes: notes });
      toast.success('Admin notes saved');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update admin notes');
    }
  };

  const handleCancellation = async (orderId, action, preNote) => {
    if (preNote !== undefined) {
      try {
        await api.put(`/orders/${orderId}/cancel-handle`, { action, adminNote: preNote || `Cancellation ${action}d` });
        toast.success(`Cancellation ${action}d`);
        fetchOrders();
      } catch {
        toast.error('Failed to process cancellation');
      }
      return;
    }
    promptNote(`${action === 'approve' ? 'Approve' : 'Reject'} Cancellation`, async (adminNote) => {
      setNoteModal(null);
      try {
        await api.put(`/orders/${orderId}/cancel-handle`, { action, adminNote });
        toast.success(`Cancellation ${action}d`);
        fetchOrders();
      } catch {
        toast.error('Failed to process cancellation');
      }
    });
  };

  const handleItemReturn = (orderId, itemId, action) => {
    promptNote(`${action === 'approve' ? 'Approve' : 'Reject'} Item Return`, async (adminNote) => {
      setNoteModal(null);
      try {
        await api.put(`/orders/${orderId}/return-item-handle`, { itemId, action, adminNote });
        toast.success(`Return ${action}d`);
        fetchOrders();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to process return');
      }
    });
  };

  return (
    <div className="animate-fade-in-up">
      {/* Page header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-header-left">
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-subtitle">{displayed.length} order{displayed.length !== 1 ? 's' : ''} found</p>
        </div>

        {/* Date Filters Selectors */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 750, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filter Date:</span>
          
          {/* Year */}
          <select 
            className="form-select" 
            value={filterYear} 
            onChange={e => setFilterYear(e.target.value)} 
            style={{ padding: '0.45rem 1.75rem 0.45rem 0.75rem', fontSize: '0.8rem', width: 'auto', backgroundPosition: 'right 0.5rem center', height: '36px', borderRadius: '8px' }}
          >
            <option value="">All Years</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>

          {/* Month */}
          <select 
            className="form-select" 
            value={filterMonth} 
            onChange={e => setFilterMonth(e.target.value)} 
            style={{ padding: '0.45rem 1.75rem 0.45rem 0.75rem', fontSize: '0.8rem', width: 'auto', backgroundPosition: 'right 0.5rem center', height: '36px', borderRadius: '8px' }}
          >
            <option value="">All Months</option>
            {MONTHS.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          {/* Date */}
          <select 
            className="form-select" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
            style={{ padding: '0.45rem 1.75rem 0.45rem 0.75rem', fontSize: '0.8rem', width: 'auto', backgroundPosition: 'right 0.5rem center', height: '36px', borderRadius: '8px' }}
          >
            <option value="">All Days</option>
            {availableDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          
          {(filterYear || filterMonth || filterDate) && (
            <button 
              onClick={() => { setFilterYear(''); setFilterMonth(''); setFilterDate(''); }}
              className="btn-icon-sm delete"
              title="Clear date filter"
              style={{ width: 36, height: 36, borderRadius: '8px', border: '1px solid #fecaca', background: 'white' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by order ID or customer…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              className={`filter-tab${filter === tab.value ? ' active' : ''}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="admin-loading">
          <div style={{ width:20, height:20, border:'2px solid #e2e8f0', borderTopColor:'#C08A74', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
          Loading orders…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 60, paddingLeft: '1.25rem' }}>S.No</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-data">No orders found</td>
                </tr>
              ) : (
                displayed.map((order, idx) => {
                  const isExpanded = expandedId === order._id;
                  const allowed = ALLOWED_TRANSITIONS[order.status] || [];
                  const isTerminal = allowed.length === 0;

                  return [
                    /* Main Row */
                    <tr key={order._id} className={isExpanded ? 'expanded' : ''}>
                      <td style={{ fontSize: '0.85rem', fontWeight: 650, color: '#64748b', paddingLeft: '1.25rem' }}>
                        {idx + 1}
                      </td>
                      <td>
                        <div className="table-cell-primary" style={{ fontSize:'0.85rem', color:'#C08A74' }}>
                          #{order.orderNumber?.replace('ORD-','') || order._id.slice(-6).toUpperCase()}
                        </div>
                        <div className="table-cell-secondary">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</div>
                      </td>
                      <td>
                        <div className="table-cell-primary">{order.user?.name || '—'}</div>
                        <div className="table-cell-secondary">{order.user?.email}</div>
                      </td>
                      <td style={{ fontSize:'0.8rem', color:'#64748b' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </td>
                      <td>
                        <div className="table-cell-primary">₹{Number(order.totalAmount).toLocaleString('en-IN')}</div>
                        <div className="table-cell-secondary" style={{ textTransform:'capitalize' }}>{order.paymentMethod}</div>
                      </td>
                      <td>
                        <span className={`status-badge ${
                          order.paymentStatus === 'paid'     ? 'badge-paid'     :
                          order.paymentStatus === 'refunded' ? 'badge-delivered' :
                          'badge-unpaid'
                        }`}>
                          {order.paymentStatus === 'paid'     ? 'Paid'     :
                           order.paymentStatus === 'refunded' ? 'Refunded' : 'Unpaid'}
                        </span>
                        {order.refundId && (
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '2px' }}>
                            ID: {order.refundId.slice(0, 14)}…
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${STATUS_CLASS[order.status] || 'badge-pending'}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* 1. Add view option in Action column (eye icon) to toggle expansion */}
                          <button
                            className="btn-icon-sm view"
                            onClick={() => setExpandedId(isExpanded ? null : order._id)}
                            title={isExpanded ? 'Collapse details' : 'View details'}
                            style={{
                              background: isExpanded ? '#f0fdf4' : 'transparent',
                              borderColor: isExpanded ? '#bbf7d0' : 'transparent',
                              color: isExpanded ? '#16a34a' : '#64748b',
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px'
                            }}
                          >
                            <Eye size={15} />
                          </button>

                          {order.status === 'cancel_requested' ? (
                            <button
                              onClick={() => setCancelModal(order)}
                              style={{ display:'flex', alignItems:'center', gap:'0.25rem', padding:'0.35rem 0.85rem', background:'#f97316', color:'white', border:'none', borderRadius:'6px', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}
                            >
                              View &amp; Act
                            </button>
                          ) : order.status === 'return_requested' ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : order._id)}
                              style={{ display:'flex', alignItems:'center', gap:'0.25rem', padding:'0.35rem 0.85rem', background:'#f97316', color:'white', border:'none', borderRadius:'6px', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap' }}
                            >
                              Review
                            </button>
                          ) : isTerminal ? (
                            <span style={{ fontSize:'0.75rem', color:'#94a3b8' }}>—</span>
                          ) : (
                            <select
                              className="status-select"
                              value={order.status}
                              onChange={e => updateStatus(order._id, order.status, e.target.value)}
                            >
                              <option value={order.status}>{STATUS_LABELS[order.status]}</option>
                              {allowed.map(s => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>,

                    /* Expanded Detail Row */
                    isExpanded && (
                      <tr key={`${order._id}-detail`}>
                        <td colSpan="8" style={{ padding:0, border:'none' }}>
                          <div className="order-detail-grid">
                            {/* Items */}
                            <div>
                              <p className="order-detail-section-title">
                                <Package size={13} style={{ verticalAlign:'middle', marginRight:6 }} />
                                Order Items
                              </p>
                              {order.items?.map((item, idx) => {
                                const rStatus = item.returnStatus || 'none';
                                return (
                                  <div key={idx} className="order-item-card">
                                    <div className="order-item-header">
                                      <div>
                                        <div className="order-item-name">{item.name}</div>
                                        <div className="order-item-meta">
                                          {item.variantSize} · {item.variantColor} · Qty {item.quantity}
                                        </div>
                                      </div>
                                      <div className="order-item-price">₹{item.price}</div>
                                    </div>
                                    {rStatus !== 'none' && (
                                      <div style={{ marginTop:'0.625rem' }}>
                                        <span className={`status-badge ${returnBadgeClass[rStatus] || 'badge-pending'}`} style={{ fontSize:'0.7rem' }}>
                                          Return: {rStatus.charAt(0).toUpperCase() + rStatus.slice(1)}
                                        </span>
                                        {item.returnReason && (
                                          <p style={{ margin:'0.35rem 0 0', fontSize:'0.75rem', color:'#64748b' }}>
                                            Reason: {item.returnReason}
                                          </p>
                                        )}
                                        {item.returnAdminNote && (
                                          <p style={{ margin:'0.2rem 0 0', fontSize:'0.75rem', color:'#94a3b8', fontStyle:'italic' }}>
                                            Admin note: {item.returnAdminNote}
                                          </p>
                                        )}
                                        {rStatus === 'approved' && item.refundAmount && (
                                          <div style={{ margin:'0.35rem 0 0', padding:'6px 10px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:'6px', fontSize:'0.72rem', color:'#15803d' }}>
                                            💚 Refund ₹{item.refundAmount} initiated
                                            {item.refundId && <span style={{ marginLeft:'6px', fontFamily:'monospace', color:'#4ade80' }}>{item.refundId}</span>}
                                          </div>
                                        )}
                                        {rStatus === 'requested' && (
                                          <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.625rem' }}>
                                            <button
                                              onClick={() => handleItemReturn(order._id, item._id, 'approve')}
                                              style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.35rem 0.875rem', background:'#10b981', color:'white', border:'none', borderRadius:'6px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}
                                            >
                                              <Check size={13}/> Approve
                                            </button>
                                            <button
                                              onClick={() => handleItemReturn(order._id, item._id, 'reject')}
                                              style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.35rem 0.875rem', background:'#ef4444', color:'white', border:'none', borderRadius:'6px', fontSize:'0.75rem', fontWeight:700, cursor:'pointer' }}
                                            >
                                              <X size={13}/> Reject
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Right column: address + cancellation */}
                            <div>
                              {order.customerNotes && (
                                <div style={{ marginBottom:'1.25rem' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <p className="order-detail-section-title" style={{ margin: 0 }}>Order Notes</p>
                                  </div>
                                  <div style={{ padding:'0.75rem', background:'#fdf8f6', border:'1px solid #fbd5c8', borderRadius:'6px', fontSize:'0.8rem', color:'#92400e', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                    {order.customerNotes}
                                  </div>
                                </div>
                              )}

                              {/* Admin Internal Notes */}
                              <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                                <p className="order-detail-section-title" style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Internal Admin Notes</p>
                                <textarea
                                  placeholder="Add private notes for this order (only visible to admins/vendors)..."
                                  defaultValue={order.adminNotes || ''}
                                  onBlur={(e) => {
                                    if(e.target.value !== (order.adminNotes || '')) {
                                       handleUpdateAdminNotes(order._id, e.target.value);
                                    }
                                  }}
                                  rows={2}
                                  style={{ width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #fcd34d', borderRadius: '6px', fontSize: '0.8rem', outline: 'none', resize: 'vertical' }}
                                />
                                <p style={{ margin: '0.4rem 0 0', fontSize: '0.65rem', color: '#b45309' }}>
                                  Notes save automatically when you click outside the box.
                                </p>
                              </div>

                              <div className="shipping-detail" style={{ marginBottom:'1.25rem' }}>
                                <p className="order-detail-section-title">Shipping Address</p>
                                <p style={{ margin:0, fontWeight:600 }}>{order.shippingAddress?.fullName}</p>
                                <p style={{ margin:0 }}>{order.shippingAddress?.line1}</p>
                                {order.shippingAddress?.line2 && <p style={{ margin:0 }}>{order.shippingAddress.line2}</p>}
                                <p style={{ margin:0 }}>
                                  {order.shippingAddress?.city}, {order.shippingAddress?.state} – {order.shippingAddress?.pincode}
                                </p>
                                {order.shippingAddress?.phone && <p style={{ margin:'0.25rem 0 0', color:'#64748b', fontSize:'0.8rem' }}>📞 {order.shippingAddress.phone}</p>}
                              </div>

                              {/* Tracking URL */}
                              <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                <p className="order-detail-section-title" style={{ margin: '0 0 0.5rem 0' }}>Tracking Link</p>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <input 
                                    type="url" 
                                    placeholder="Paste courier tracking URL..." 
                                    defaultValue={order.trackingUrl || ''}
                                    onBlur={(e) => {
                                      if(e.target.value !== order.trackingUrl) {
                                         handleUpdateTracking(order._id, e.target.value);
                                      }
                                    }}
                                    style={{ flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.8rem', outline: 'none' }}
                                  />
                                </div>
                                {order.trackingUrl && (
                                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                                    ✓ Customers can now track this order.
                                  </p>
                                )}
                              </div>

                              {/* Order summary */}
                              <div style={{ marginBottom:'1.25rem' }}>
                                <p className="order-detail-section-title">Order Summary</p>
                                <div className="stat-row">
                                  <span className="stat-label">Payment Method</span>
                                  <span className="stat-value" style={{ textTransform:'capitalize' }}>{order.paymentMethod}</span>
                                </div>
                                <div className="stat-row">
                                  <span className="stat-label">Payment Status</span>
                                  <span className={`status-badge ${order.paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}`}>
                                    {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                  </span>
                                </div>
                                <div className="stat-row">
                                  <span className="stat-label">Total Amount</span>
                                  <span className="stat-value">₹{Number(order.totalAmount).toLocaleString('en-IN')}</span>
                                </div>
                                {order.discount > 0 && (
                                  <div className="stat-row">
                                    <span className="stat-label">Discount</span>
                                    <span className="stat-value" style={{ color:'#16a34a' }}>-₹{order.discount}</span>
                                  </div>
                                )}
                                {order.paymentStatus === 'refunded' && (
                                  <div className="stat-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                    <span className="stat-label" style={{ color: '#16a34a', fontWeight: 700 }}>Refund Status</span>
                                    <span className="status-badge badge-delivered" style={{ fontSize: '0.7rem' }}>Refunded</span>
                                  </div>
                                )}
                                {order.refundAmount && (
                                  <div className="stat-row">
                                    <span className="stat-label">Refund Amount</span>
                                    <span className="stat-value" style={{ color: '#16a34a' }}>₹{Number(order.refundAmount).toLocaleString('en-IN')}</span>
                                  </div>
                                )}
                                {order.refundId && (
                                  <div className="stat-row">
                                    <span className="stat-label">Razorpay Refund ID</span>
                                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{order.refundId}</span>
                                  </div>
                                )}
                                {order.refundStatus === 'failed' && (
                                  <div style={{ marginTop: '8px', padding: '8px 10px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '6px', fontSize: '0.75rem', color: '#c2410c' }}>
                                    ⚠ Auto-refund failed — please process manually via Razorpay dashboard.
                                  </div>
                                )}
                                {/* Invoice Action */}
                                {order.statusHistory?.some(h => h.status === 'delivered') && (
                                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0' }}>
                                    <button
                                      onClick={() => {
                                        toast.success('Generating invoice...');
                                        generateInvoicePDF(order);
                                      }}
                                      style={{ display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.5rem 1.25rem', background:'#10b981', color:'white', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', width: '100%', justifyContent: 'center' }}
                                    >
                                      <Download size={15}/> Download Invoice
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Status history */}
                              {order.statusHistory?.length > 0 && (
                                <div>
                                  <p className="order-detail-section-title">Timeline</p>
                                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                                    {order.statusHistory.slice().reverse().map((h, i) => (
                                      <div key={i} style={{ display:'flex', gap:'0.625rem', alignItems:'flex-start' }}>
                                        <div style={{ width:8, height:8, borderRadius:'50%', background:'#C08A74', marginTop:4, flexShrink:0 }} />
                                        <div>
                                          <div style={{ fontSize:'0.78rem', fontWeight:600, color:'#374151', textTransform:'capitalize' }}>{h.status}</div>
                                          {h.note && <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>{h.note}</div>}
                                          <div style={{ fontSize:'0.72rem', color:'#94a3b8' }}>
                                            {new Date(h.updatedAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Return Requests — dedicated card for all pending items */}
                          {order.items?.some(i => i.returnStatus === 'requested') && (
                            <div style={{ margin:'0 1.5rem 1.5rem', background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'12px', padding:'1.25rem' }}>
                              <p style={{ margin:'0 0 1rem', fontWeight:700, fontSize:'0.85rem', color:'#c2410c', display:'flex', alignItems:'center', gap:'6px' }}>
                                ↩ Return Request{order.items.filter(i => i.returnStatus === 'requested').length > 1 ? 's' : ''} Pending Approval
                              </p>
                              <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
                                {order.items.filter(i => i.returnStatus === 'requested').map((item, idx) => (
                                  <div key={idx} style={{ background:'white', border:'1px solid #fed7aa', borderRadius:'8px', padding:'0.875rem' }}>
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                                      <div>
                                        <div style={{ fontWeight:700, fontSize:'0.85rem', color:'#0f172a' }}>{item.name}</div>
                                        <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:'2px' }}>
                                          {item.variantSize} · {item.variantColor} · Qty {item.quantity} · ₹{item.price * item.quantity}
                                        </div>
                                      </div>
                                      <span style={{ fontSize:'0.7rem', background:'#fef3c7', color:'#92400e', fontWeight:700, padding:'3px 8px', borderRadius:'4px' }}>
                                        Pending
                                      </span>
                                    </div>
                                    {item.returnReason && (
                                      <p style={{ margin:'0 0 0.75rem', fontSize:'0.78rem', color:'#64748b', background:'#f8fafc', padding:'6px 10px', borderRadius:'6px' }}>
                                        <strong>Reason:</strong> {item.returnReason}
                                      </p>
                                    )}
                                    <div style={{ display:'flex', gap:'0.625rem' }}>
                                      <button
                                        onClick={() => handleItemReturn(order._id, item._id, 'approve')}
                                        style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.45rem 1rem', background:'#10b981', color:'white', border:'none', borderRadius:'7px', fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}
                                      >
                                        <Check size={13}/> Approve & Refund ₹{item.price * item.quantity}
                                      </button>
                                      <button
                                        onClick={() => handleItemReturn(order._id, item._id, 'reject')}
                                        style={{ display:'flex', alignItems:'center', gap:'0.3rem', padding:'0.45rem 1rem', background:'#ef4444', color:'white', border:'none', borderRadius:'7px', fontSize:'0.78rem', fontWeight:700, cursor:'pointer' }}
                                      >
                                        <X size={13}/> Reject
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cancellation Request */}
                          {order.status === 'cancel_requested' && (
                            <div className="cancel-request-card" style={{ margin:'0 1.5rem 1.5rem' }}>
                              <p className="cancel-request-title">⚠ Cancellation Request</p>
                              <p className="cancel-request-reason">
                                <strong>Reason:</strong> {order.cancellationRequest?.reason || 'No reason provided'}
                              </p>
                              <p style={{ fontSize:'0.78rem', color:'#92400e', marginBottom:'0.875rem' }}>
                                Requested {new Date(order.cancellationRequest?.requestedAt).toLocaleString('en-IN')}
                              </p>
                              <div style={{ display:'flex', gap:'0.75rem' }}>
                                <button
                                  onClick={() => handleCancellation(order._id, 'approve')}
                                  style={{ display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.5rem 1.25rem', background:'#ef4444', color:'white', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}
                                >
                                  <Check size={15}/> Approve & Refund
                                </button>
                                <button
                                  onClick={() => handleCancellation(order._id, 'reject')}
                                  style={{ display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.5rem 1.25rem', background:'#475569', color:'white', border:'none', borderRadius:'8px', fontWeight:700, fontSize:'0.8rem', cursor:'pointer' }}
                                >
                                  <X size={15}/> Reject Request
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ),
                  ].filter(Boolean);
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancellation Detail Modal */}
      {cancelModal && createPortal(
        <CancellationModal
          order={cancelModal}
          onApprove={(note) => {
            setCancelModal(null);
            handleCancellation(cancelModal._id, 'approve', note);
          }}
          onReject={(note) => {
            setCancelModal(null);
            handleCancellation(cancelModal._id, 'reject', note);
          }}
          onClose={() => setCancelModal(null)}
        />,
        document.body
      )}

      {/* Note Modal */}
      {noteModal && createPortal(
        <NoteModal
          title={noteModal.title}
          onConfirm={noteModal.onConfirm}
          onClose={() => setNoteModal(null)}
        />,
        document.body
      )}
    </div>
  );
};

export default OrdersManagement;
