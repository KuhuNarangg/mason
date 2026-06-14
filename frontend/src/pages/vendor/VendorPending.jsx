import { Navigate } from 'react-router-dom';
import { Clock, XCircle, Ban, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import '../admin/admin-pages.css';

const STATUS_CONTENT = {
  pending: {
    icon: <Clock size={40} />,
    color: '#d97706',
    title: 'Application Under Review',
    message: 'Thanks for registering as a vendor! Our team is reviewing your application. You\'ll be able to access the full vendor dashboard once approved. This usually takes 1-2 business days.',
  },
  rejected: {
    icon: <XCircle size={40} />,
    color: '#dc2626',
    title: 'Application Rejected',
    message: 'Unfortunately your vendor application was not approved. Please contact support for more details or to reapply.',
  },
  suspended: {
    icon: <Ban size={40} />,
    color: '#dc2626',
    title: 'Account Suspended',
    message: 'Your vendor account has been suspended. Please contact support for assistance.',
  },
};

const VendorPending = () => {
  const { user, isAuth, logout } = useAuth();

  if (!isAuth || user?.role !== 'vendor') {
    return <Navigate to="/login" replace />;
  }
  if (user?.vendorStatus === 'approved') {
    return <Navigate to="/vendor" replace />;
  }

  const content = STATUS_CONTENT[user?.vendorStatus] || STATUS_CONTENT.pending;

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '1.5rem' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: '2.5rem', maxWidth: 480, width: '100%', textAlign: 'center', border: '1px solid #e2e8f0' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem', color: content.color, background: `${content.color}15`,
        }}>
          {content.icon}
        </div>
        <h1 style={{ fontSize: '1.35rem', marginBottom: '0.75rem', color: '#0f172a' }}>{content.title}</h1>
        <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem' }}>{content.message}</p>
        <button
          onClick={handleLogout}
          className="btn-cancel"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
};

export default VendorPending;
