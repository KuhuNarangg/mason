import { Navigate } from 'react-router-dom';
import { Clock, XCircle, Ban } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const statusConfig = {
  pending: {
    icon: Clock,
    color: '#d97706',
    bg: '#fef3c7',
    title: 'Application Under Review',
    text: 'Thanks for applying! Our admin team is reviewing your vendor application. You will be notified once your account is approved — usually within 1-2 business days.',
  },
  rejected: {
    icon: XCircle,
    color: '#dc2626',
    bg: '#fee2e2',
    title: 'Application Rejected',
    text: 'Unfortunately your vendor application was not approved.',
  },
  suspended: {
    icon: Ban,
    color: '#6b7280',
    bg: '#f3f4f6',
    title: 'Account Suspended',
    text: 'Your vendor account has been suspended by the admin. Please contact support for more information.',
  },
};

export default function PendingApproval() {
  const { vendor, logout, refreshProfile } = useAuth();

  if (!vendor) return <Navigate to="/login" replace />;
  if (vendor.vendorStatus === 'approved') return <Navigate to="/dashboard" replace />;

  const cfg = statusConfig[vendor.vendorStatus] || statusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div className="auth-wrap">
      <div className="auth-card pending-card">
        <div className="icon-wrap" style={{ background: cfg.bg }}>
          <Icon size={30} color={cfg.color} />
        </div>
        <h1>{cfg.title}</h1>
        <p className="subtitle">{cfg.text}</p>
        {vendor.vendorStatus === 'rejected' && vendor.vendorProfile?.rejectionReason && (
          <div className="card" style={{ textAlign: 'left', background: '#fef2f2', borderColor: '#fecaca' }}>
            <strong>Reason:</strong> {vendor.vendorProfile.rejectionReason}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16 }}>
          <button className="btn" onClick={refreshProfile}>Check status again</button>
          <button className="btn btn-danger" onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
