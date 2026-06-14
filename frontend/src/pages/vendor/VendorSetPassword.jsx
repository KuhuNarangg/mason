import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import '../Auth.css';

const VendorSetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();

  const [status, setStatus] = useState('checking'); // checking | valid | invalid
  const [info, setInfo] = useState(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/auth/vendor-set-password/${token}`)
      .then(({ data }) => {
        setInfo(data);
        setStatus('valid');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/vendor-set-password', { token, password });
      setAuthUser(data.token, data.user);
      toast.success('Password set! Welcome to your vendor panel 🎉');
      navigate('/vendor');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page" style={{ display: 'block', overflow: 'visible', minHeight: '100vh' }}>
      <div className="auth-form-wrapper" style={{ minHeight: '100vh' }}>
        <Link to="/" className="auth-back-link">Return to Store</Link>
        <div className="auth-container">
          {status === 'checking' && (
            <p className="auth-subtitle">Checking your link…</p>
          )}

          {status === 'invalid' && (
            <>
              <h2 className="auth-title">Link Expired</h2>
              <p className="auth-subtitle">This link is invalid or has expired. Please contact support or sign in if you've already set your password.</p>
              <p className="auth-footer"><Link to="/login">Go to Login</Link></p>
            </>
          )}

          {status === 'valid' && (
            <>
              <h2 className="auth-title">Welcome, {info?.name}! 🎉</h2>
              <p className="auth-subtitle">
                Your application for <strong>{info?.businessName}</strong> has been approved. Set a password to activate your vendor account and log in.
              </p>

              {error && (
                <div style={{
                  background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px',
                  padding: '0.65rem 0.9rem', color: '#dc2626',
                  fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password" className="auth-input" value={password}
                    onChange={(e) => setPassword(e.target.value)} required minLength={6}
                    placeholder="Create a password (min 6 chars)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password" className="auth-input" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)} required minLength={6}
                    placeholder="Re-enter your password"
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Set Password & Login'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorSetPassword;
