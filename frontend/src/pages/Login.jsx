import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import './Auth.css';

const Login = () => {
  const { googleLogin, setAuthUser } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [code, setCode]                 = useState('');
  const [detectedRole, setDetectedRole] = useState(null); // 'admin' | 'vendor' | null
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const debounceRef = useRef(null);
  const codeRef     = useRef(null);

  const checkRole = useCallback(async (emailValue) => {
    if (!emailValue || !emailValue.includes('@')) {
      setDetectedRole(null);
      return;
    }
    try {
      const { data } = await api.get(`/auth/check-role?email=${encodeURIComponent(emailValue)}`);
      const role = data.role === 'admin' || data.role === 'vendor' ? data.role : null;
      setDetectedRole(role);
    } catch {
      setDetectedRole(null);
    }
  }, []);

  /* Focus code field whenever it appears */
  useEffect(() => {
    if (detectedRole && codeRef.current) codeRef.current.focus();
  }, [detectedRole]);

  /* Cleanup debounce on unmount */
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setCode('');
    setDetectedRole(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => checkRole(val), 400);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if ((detectedRole === 'admin' || detectedRole === 'vendor') && !code.trim()) {
      setError(`Please enter your ${detectedRole} verification code.`);
      return;
    }

    setLoading(true);
    try {
      const payload = { email, password };
      if (detectedRole === 'admin' || detectedRole === 'vendor') payload.code = code.trim();

      const { data } = await api.post('/auth/login', payload);
      setAuthUser(data.token, data.user);

      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'vendor') navigate(data.user.vendorStatus === 'approved' ? '/vendor' : '/vendor-pending');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    const res = await googleLogin(credentialResponse.credential);
    if (res?.success) navigate(res.role === 'admin' ? '/admin' : res.role === 'vendor' ? '/vendor' : '/');
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
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">
            Sign in to access your dashboard, wishlist, and orders.
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: isLocked ? '#fffbeb' : '#fff5f5',
              border: `1px solid ${isLocked ? '#fcd34d' : '#fecaca'}`,
              borderRadius: '6px',
              padding: '0.65rem 0.9rem',
              color: isLocked ? '#92400e' : '#dc2626',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              lineHeight: 1.5,
            }}>
              {isLocked && (
                <span style={{ marginRight: '0.4rem' }}>&#128274;</span>
              )}
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="auth-input"
                value={email}
                onChange={handleEmailChange}
                required
                placeholder="Enter your email"
              />
              {detectedRole && (
                <span style={{
                  display: 'inline-block',
                  marginTop: '0.35rem',
                  fontSize: '0.72rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: detectedRole === 'admin' ? '#1d4ed8' : '#065f46',
                  fontWeight: 600,
                }}>
                  {detectedRole === 'admin' ? '⬡ Admin account detected' : '⬡ Vendor account detected'}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="auth-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {/* Verification Code — only for admin / vendor */}
            {(detectedRole === 'admin' || detectedRole === 'vendor') && (
              <div className="form-group" style={{ animation: 'fadeSlideIn 0.2s ease' }}>
                <label className="form-label">
                  {detectedRole === 'admin' ? 'Admin Verification Code' : 'Vendor Verification Code'}
                </label>
                <input
                  ref={codeRef}
                  type="password"
                  className="auth-input"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  required
                  placeholder={`Enter your ${detectedRole} access code`}
                  maxLength={12}
                  autoComplete="off"
                />
                <span style={{
                  display: 'block',
                  marginTop: '0.3rem',
                  fontSize: '0.72rem',
                  color: 'var(--ink-muted)',
                }}>
                  Required for {detectedRole} panel access.
                </span>
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
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin onSuccess={handleGoogle} onError={() => {}}
              text="signin_with" shape="rectangular" theme="outline" size="large" width="340" />
          </div>
          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
