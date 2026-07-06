import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../utils/api';
import './Auth.css';

const Login = () => {
  const { googleLogin, setAuthUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { email, password };
      const { data } = await api.post('/auth/login', payload);
      setAuthUser(data.token, data.user);

      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'vendor') navigate(data.user.vendorStatus === 'approved' ? '/vendor' : '/vendor-pending');
      else if (redirect) navigate(`/${redirect}`);
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials.');
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
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
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
              text="signin_with" shape="rectangular" theme="outline" size="large" />
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
