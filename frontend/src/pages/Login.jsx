import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import './Auth.css';

const Login = () => {
  const { login, googleLogin, setAuthUser } = useAuth();
  const navigate = useNavigate();
  const codeRef  = useRef(null);

  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [code, setCode]           = useState('');
  const [showCode, setShowCode]   = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    if (showCode) setTimeout(() => codeRef.current?.focus(), 80);
  }, [showCode]);

  /* ── Step 1: email + password ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role === 'admin') {
        setTempToken(data.token);
        setShowCode(true);           // just reveal the code field, nothing else changes
      } else {
        setAuthUser(data.token, data.user);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2: admin code (same form, just the extra field) ── */
  const handleCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please enter the access code.'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post(
        '/auth/admin-verify-code',
        { code: code.trim() },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      // Update auth state cleanly — no reload needed
      setAuthUser(data.token, data.user);
      navigate('/admin', { replace: true });
    } catch (err) {
      // Wrong code → only show error + clear code field, keep everything else
      setError(err.response?.data?.message || 'Invalid access code. Please try again.');
      setCode('');
      setTimeout(() => codeRef.current?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (credentialResponse) => {
    const res = await googleLogin(credentialResponse.credential);
    if (res?.success) navigate(res.role === 'admin' ? '/admin' : '/');
  };

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
          <h2 className="auth-title">{showCode ? 'Admin Verification' : 'Welcome Back'}</h2>
          <p className="auth-subtitle">
            {showCode
              ? 'Admin account detected. Enter your access code.'
              : 'Sign in to access your curated wishlist and orders.'}
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '6px',
              padding: '0.65rem 0.9rem', color: '#dc2626',
              fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={showCode ? handleCode : handleSubmit} className="auth-form">

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email" className="auth-input" value={email}
                onChange={e => setEmail(e.target.value)} required
                placeholder="Enter your email"
                disabled={showCode}
                style={{ opacity: showCode ? 0.45 : 1, cursor: showCode ? 'not-allowed' : 'auto' }}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password" className="auth-input" value={password}
                onChange={e => setPassword(e.target.value)} required
                placeholder="Enter your password"
                disabled={showCode}
                style={{ opacity: showCode ? 0.45 : 1, cursor: showCode ? 'not-allowed' : 'auto' }}
              />
            </div>

            {/* Admin code — only shown after admin role confirmed */}
            {showCode && (
              <div className="form-group" style={{
                padding: '1rem', borderRadius: '8px',
                background: 'var(--beige)', border: '1px solid var(--champagne)',
              }}>
                <label className="form-label" style={{ color: 'var(--rose-gold-dark)' }}>
                  🔐 Admin Access Code
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', margin: '0 0 0.65rem' }}>
                  Enter the access code to unlock the dashboard.
                </p>
                <input
                  ref={codeRef}
                  type="password" className="auth-input" value={code}
                  onChange={e => setCode(e.target.value)} required
                  placeholder="Enter access code"
                  style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.05rem' }}
                />
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Please wait…' : showCode ? 'Access Dashboard →' : 'Sign In'}
            </button>

            {showCode && (
              <button type="button"
                onClick={() => { setShowCode(false); setCode(''); setError(''); setTempToken(''); }}
                style={{
                  width: '100%', marginTop: '0.5rem', padding: '0.5rem',
                  background: 'none', border: 'none', color: 'var(--ink-muted)',
                  cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit',
                }}>
                ← Use a different account
              </button>
            )}
          </form>

          {!showCode && (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
