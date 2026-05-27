import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, loading, user, isAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Already logged in as admin → go straight to dashboard
  useEffect(() => {
    if (isAuth && user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [isAuth, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      if (res.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        setError('Access denied. This account does not have admin privileges.');
      }
    }
    // login() already shows a toast on failure
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Montserrat', -apple-system, sans-serif",
      padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo block */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56, background: '#C08A74', borderRadius: '12px',
            marginBottom: '1rem',
          }}>
            <LayoutDashboard size={28} color="white" strokeWidth={1.5} />
          </div>
          <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 600, margin: 0, letterSpacing: '0.5px' }}>
            Mason Admin
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.4rem' }}>
            Sign in to manage your store
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#1a1d27',
          border: '1px solid #2a2d3a',
          borderRadius: '16px',
          padding: '2rem',
        }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '0.75rem 1rem',
              color: '#f87171', fontSize: '0.83rem', marginBottom: '1.5rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block', color: '#9ca3af', fontSize: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem', fontWeight: 500,
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@yourstore.com"
                autoComplete="username"
                style={{
                  width: '100%', padding: '0.8rem 1rem',
                  background: '#0f1117', border: '1px solid #2a2d3a',
                  borderRadius: '8px', color: 'white', fontSize: '0.9rem',
                  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#C08A74'}
                onBlur={e => e.target.style.borderColor = '#2a2d3a'}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.75rem' }}>
              <label style={{
                display: 'block', color: '#9ca3af', fontSize: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem', fontWeight: 500,
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  style={{
                    width: '100%', padding: '0.8rem 2.8rem 0.8rem 1rem',
                    background: '#0f1117', border: '1px solid #2a2d3a',
                    borderRadius: '8px', color: 'white', fontSize: '0.9rem',
                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#C08A74'}
                  onBlur={e => e.target.style.borderColor = '#2a2d3a'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '0.85rem',
                background: loading ? '#4b3328' : '#C08A74',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1.5px',
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { if (!loading) e.target.style.background = '#A36B56'; }}
              onMouseLeave={e => { if (!loading) e.target.style.background = '#C08A74'; }}
            >
              {loading ? 'Signing in…' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>

        {/* Back to store */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#4b5563', fontSize: '0.8rem' }}>
          <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>
            ← Back to Mason Store
          </Link>
        </p>

      </div>
    </div>
  );
};

export default AdminLogin;
