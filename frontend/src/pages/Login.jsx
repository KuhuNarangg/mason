import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Shield } from 'lucide-react';
import api from '../utils/api';
import './Auth.css';

const Login = () => {
  const { googleLogin, setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  // Mode: 'login' | 'forgot_request' | 'forgot_verify'
  const [mode, setMode]                 = useState('login');

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [accessCode, setAccessCode]     = useState('');
  const [role, setRole]                 = useState(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail]   = useState('');
  const [otp, setOtp]                   = useState('');
  const [newPassword, setNewPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError]               = useState('');
  const [successMsg, setSuccessMsg]     = useState('');
  const [loading, setLoading]           = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      if (email.includes('@')) {
        try {
          const { data } = await api.get(`/auth/check-role?email=${encodeURIComponent(email)}`);
          setRole(data.role);
        } catch (err) {
          setRole(null);
        }
      } else {
        setRole(null);
      }
    };
    const timer = setTimeout(checkRole, 500);
    return () => clearTimeout(timer);
  }, [email]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const payload = { email, password, accessCode };
      const { data } = await api.post('/auth/login', payload);
      setAuthUser(data.token, data.user);

      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'vendor') navigate(data.user.vendorStatus === 'approved' ? '/vendor' : '/vendor-pending');
      else if (redirect) navigate(`/${redirect}`);
      else navigate('/');
    } catch (err) {
      if (err.response?.data?.requiresAccessCode) {
        setRole(err.response.data.role);
        setError('An access code is required for this account.');
      } else {
        setError(err.response?.data?.message || 'Invalid credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequestSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const targetEmail = forgotEmail.trim() || email.trim();
      const { data } = await api.post('/auth/forgot-password', { email: targetEmail });
      setSuccessMsg(data.message || `An OTP has been sent to ${targetEmail}`);
      setForgotEmail(targetEmail);
      setMode('forgot_verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifySubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/reset-password-otp', {
        email: forgotEmail,
        otp: otp.trim(),
        newPassword,
      });
      setSuccessMsg(data.message || 'Password reset successfully! You can now log in.');
      setEmail(forgotEmail);
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setMode('login');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    const res = await googleLogin(credentialResponse.credential);
    if (res?.success) {
      if (res.role === 'admin') navigate('/admin');
      else if (res.role === 'vendor') navigate(res.vendorStatus === 'approved' ? '/vendor' : '/vendor-pending');
      else if (redirect) navigate(`/${redirect}`);
      else navigate('/');
    }
  };

  const isLocked = error.toLowerCase().includes('locked');

  return (
    <div className="auth-page">
      {/* Left: Campaign Image */}
      <div className="auth-hero">
        <div className="auth-hero-content">
          <h1 className="auth-hero-brand">MASON</h1>
          <p className="auth-hero-tagline">The Editorial Collection</p>
        </div>
      </div>

      {/* Right: Form */}
      <div className="auth-form-wrapper">
        <Link to="/" className="auth-back-link">Return to Store</Link>
        <div className="auth-container">
          
          {/* ============================================================
             MODE 1: LOGIN
             ============================================================ */}
          {mode === 'login' && (
            <>
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">
                Sign in to access your dashboard, wishlist, and orders.
              </p>

              {/* Success Message */}
              {successMsg && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '0.65rem 0.9rem',
                  color: '#166534',
                  fontSize: '0.82rem',
                  marginTop: '1rem',
                  lineHeight: 1.5,
                }}>
                  {successMsg}
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div style={{
                  background: isLocked ? '#fffbeb' : '#fff5f5',
                  border: `1px solid ${isLocked ? '#fcd34d' : '#fecaca'}`,
                  borderRadius: '6px',
                  padding: '0.65rem 0.9rem',
                  color: isLocked ? '#92400e' : '#dc2626',
                  fontSize: '0.82rem',
                  marginTop: '1rem',
                  lineHeight: 1.5,
                }}>
                  {isLocked && <span style={{ marginRight: '0.4rem' }}>&#128274;</span>}
                  {error}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="auth-form">

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                  {role === 'admin' && (
                    <div style={{ color: '#2563eb', fontSize: '0.72rem', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Shield size={12} /> Admin Account Detected
                    </div>
                  )}
                  {role === 'vendor' && (
                    <div style={{ color: '#2563eb', fontSize: '0.72rem', fontWeight: 750, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Shield size={12} /> Vendor Account Detected
                    </div>
                  )}
                </div>

                {/* Password with Forgot Password link */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setError('');
                        setSuccessMsg('');
                        setMode('forgot_request');
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--rose-gold-dark)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    className="auth-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                  />
                </div>
                
                {/* Conditional Access Code */}
                {(role === 'admin' || role === 'vendor') && (
                  <div className="form-group">
                    <label className="form-label">Access Code (Required)</label>
                    <input
                      type="password"
                      className="auth-input"
                      value={accessCode}
                      onChange={e => setAccessCode(e.target.value)}
                      required
                      placeholder={`Enter ${role} access code`}
                    />
                  </div>
                )}

                <button type="submit" className="auth-btn" disabled={loading || isLocked}>
                  {loading ? 'Please wait…' : 'Sign In'}
                </button>
              </form>

              <div style={{ margin: '1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--champagne)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'var(--champagne)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
                <GoogleLogin onSuccess={handleGoogle} onError={() => {}}
                  text="signin_with" shape="rectangular" theme="outline" size="large" width="280" />
              </div>
              <p className="auth-footer">
                Don't have an account? <Link to="/register">Create an account</Link>
              </p>
            </>
          )}

          {/* ============================================================
             MODE 2: FORGOT PASSWORD - REQUEST OTP
             ============================================================ */}
          {mode === 'forgot_request' && (
            <>
              <h2 className="auth-title">Forgot Password</h2>
              <p className="auth-subtitle">
                Enter your registered email address and we'll send you a 6-digit OTP to reset your password.
              </p>

              {/* Error */}
              {error && (
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '0.65rem 0.9rem',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  marginTop: '1rem',
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleForgotRequestSubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">Registered Email Address</label>
                  <input
                    type="email"
                    className="auth-input"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    autoFocus
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Sending OTP…' : 'Send Reset OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setMode('login');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--ink-soft)',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    marginTop: '0.5rem',
                    textAlign: 'center',
                  }}
                >
                  ← Back to Sign In
                </button>
              </form>
            </>
          )}

          {/* ============================================================
             MODE 3: FORGOT PASSWORD - VERIFY OTP & RESET
             ============================================================ */}
          {mode === 'forgot_verify' && (
            <>
              <h2 className="auth-title">Enter Verification OTP</h2>
              <p className="auth-subtitle">
                A 6-digit OTP has been sent to <strong>{forgotEmail}</strong>.
              </p>

              {/* Success Notification */}
              {successMsg && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '6px',
                  padding: '0.65rem 0.9rem',
                  color: '#166534',
                  fontSize: '0.82rem',
                  marginTop: '1rem',
                  lineHeight: 1.5,
                }}>
                  {successMsg}
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '0.65rem 0.9rem',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  marginTop: '1rem',
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleForgotVerifySubmit} className="auth-form">
                <div className="form-group">
                  <label className="form-label">6-Digit OTP</label>
                  <input
                    type="text"
                    className="auth-input"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit OTP (e.g. 123456)"
                    style={{ letterSpacing: '4px', fontWeight: 600, fontSize: '1.1rem' }}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Resetting Password…' : 'Reset Password'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleForgotRequestSubmit}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--rose-gold-dark)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    Resend OTP
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccessMsg('');
                      setMode('login');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ink-soft)',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                    }}
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
