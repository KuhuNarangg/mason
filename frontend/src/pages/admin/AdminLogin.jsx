import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user, isAuth, setAuthUser } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  /* Shared */
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [code, setCode]         = useState('');
  const [showCode, setShowCode] = useState(false);
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (isAuth && user?.role === 'admin') navigate('/admin', { replace: true });
  }, [isAuth, user, navigate]);

  const reset = () => {
    setEmail(''); setPassword(''); setCode('');
    setName(''); setError(''); setShowCode(false);
  };

  /* ── LOGIN ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (data.user.role !== 'admin') {
        setError('This account does not have admin access.'); return;
      }
      // Admin confirmed — store temp token and show code field
      sessionStorage.setItem('_at', data.token);
      setShowCode(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) { setError('Please enter the access code.'); return; }
    setError('');
    setLoading(true);
    try {
      const tempToken = sessionStorage.getItem('_at');
      const { data } = await api.post(
        '/auth/admin-verify-code',
        { code: code.trim() },
        { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      sessionStorage.removeItem('_at');
      setAuthUser(data.token, data.user);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid access code.');
      setCode('');
    } finally { setLoading(false); }
  };

  /* ── REGISTER ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/admin-register', { name, email, password, code });
      setAuthUser(data.token, data.user);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  /* ── Styles ── */
  const inp = (extra = {}) => ({
    width: '100%', padding: '0.85rem 1rem', boxSizing: 'border-box',
    background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '8px',
    color: 'white', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.2s', ...extra,
  });
  const lbl = {
    display: 'block', color: '#9ca3af', fontSize: '0.7rem',
    textTransform: 'uppercase', letterSpacing: '1.5px',
    marginBottom: '0.45rem', fontWeight: 600,
  };
  const field = { marginBottom: '1.1rem' };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f1117',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Montserrat', -apple-system, sans-serif", padding: '1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, background: '#C08A74', borderRadius: '12px', marginBottom: '0.875rem',
          }}>
            <LayoutDashboard size={26} color="white" strokeWidth={1.5} />
          </div>
          <h1 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Mason Admin</h1>
          <p style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.3rem' }}>
            Manage your store
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '4px', marginBottom: '1.25rem' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); reset(); }}
              style={{
                flex: 1, padding: '0.6rem', border: 'none', borderRadius: '7px', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.5px',
                textTransform: 'capitalize', transition: 'all 0.2s',
                background: tab === t ? '#C08A74' : 'transparent',
                color: tab === t ? 'white' : '#6b7280',
              }}>
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: '16px', padding: '2rem' }}>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px', padding: '0.75rem 1rem',
              color: '#f87171', fontSize: '0.82rem', marginBottom: '1.25rem', lineHeight: 1.5,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />{error}
            </div>
          )}

          {/* ════ LOGIN ════ */}
          {tab === 'login' && (
            <form onSubmit={showCode ? handleVerifyCode : handleLogin}>

              <div style={field}>
                <label style={lbl}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="admin@yourstore.com"
                  disabled={showCode}
                  style={inp({ opacity: showCode ? 0.45 : 1, cursor: showCode ? 'not-allowed' : 'auto' })}
                  onFocus={e => { if (!showCode) e.target.style.borderColor = '#C08A74'; }}
                  onBlur={e => e.target.style.borderColor = '#2a2d3a'} />
              </div>

              <div style={{ ...field, marginBottom: showCode ? '1.1rem' : '1.6rem' }}>
                <label style={lbl}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required
                    placeholder="Enter your password"
                    disabled={showCode}
                    style={inp({ paddingRight: '2.8rem', opacity: showCode ? 0.45 : 1, cursor: showCode ? 'not-allowed' : 'auto' })}
                    onFocus={e => { if (!showCode) e.target.style.borderColor = '#C08A74'; }}
                    onBlur={e => e.target.style.borderColor = '#2a2d3a'} />
                  {!showCode && (
                    <button type="button" onClick={() => setShowPass(v => !v)} style={{
                      position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0,
                    }}>
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Code field — slides in after admin is confirmed */}
              {showCode && (
                <div style={{
                  ...field, marginBottom: '1.6rem',
                  padding: '1rem', borderRadius: '10px',
                  background: 'rgba(192,138,116,0.07)',
                  border: '1px solid rgba(192,138,116,0.2)',
                }}>
                  <label style={{ ...lbl, color: '#C08A74' }}>🔐 Admin Access Code</label>
                  <p style={{ color: '#6b7280', fontSize: '0.74rem', margin: '0 0 0.75rem' }}>
                    Admin role verified. Enter your access code to continue.
                  </p>
                  <input
                    autoFocus type="password" value={code}
                    onChange={e => setCode(e.target.value)}
                    required placeholder="Enter access code"
                    style={inp({ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.1rem' })}
                    onFocus={e => e.target.style.borderColor = '#C08A74'}
                    onBlur={e => e.target.style.borderColor = '#2a2d3a'} />
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '0.9rem', border: 'none', borderRadius: '8px',
                background: loading ? '#4b3328' : '#C08A74', color: 'white',
                fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.2s',
              }}>
                {loading ? 'Please wait…' : showCode ? '🔒 Access Dashboard' : 'Continue →'}
              </button>

              {showCode && (
                <button type="button"
                  onClick={() => { setShowCode(false); setCode(''); setError(''); sessionStorage.removeItem('_at'); }}
                  style={{ width: '100%', marginTop: '0.65rem', padding: '0.45rem', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.77rem', fontFamily: 'inherit' }}>
                  ← Try a different account
                </button>
              )}
            </form>
          )}

          {/* ════ REGISTER ════ */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>

              <div style={field}>
                <label style={lbl}>Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  required placeholder="Your name"
                  style={inp()}
                  onFocus={e => e.target.style.borderColor = '#C08A74'}
                  onBlur={e => e.target.style.borderColor = '#2a2d3a'} />
              </div>

              <div style={field}>
                <label style={lbl}>Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="admin@yourstore.com"
                  style={inp()}
                  onFocus={e => e.target.style.borderColor = '#C08A74'}
                  onBlur={e => e.target.style.borderColor = '#2a2d3a'} />
              </div>

              <div style={field}>
                <label style={lbl}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required
                    placeholder="Create a strong password" minLength={6}
                    style={inp({ paddingRight: '2.8rem' })}
                    onFocus={e => e.target.style.borderColor = '#C08A74'}
                    onBlur={e => e.target.style.borderColor = '#2a2d3a'} />
                  <button type="button" onClick={() => setShowPass(v => !v)} style={{
                    position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0,
                  }}>
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div style={{ ...field, marginBottom: '1.6rem' }}>
                <label style={{ ...lbl, color: '#C08A74' }}>🔐 Admin Access Code</label>
                <p style={{ color: '#6b7280', fontSize: '0.74rem', margin: '0 0 0.6rem' }}>
                  Required to create an admin account.
                </p>
                <input type="password" value={code} onChange={e => setCode(e.target.value)}
                  required placeholder="Enter access code"
                  style={inp({ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.1rem' })}
                  onFocus={e => e.target.style.borderColor = '#C08A74'}
                  onBlur={e => e.target.style.borderColor = '#2a2d3a'} />
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '0.9rem', border: 'none', borderRadius: '8px',
                background: loading ? '#4b3328' : '#C08A74', color: 'white',
                fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1.5px',
                textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'background 0.2s',
              }}>
                {loading ? 'Creating account…' : 'Create Admin Account'}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.78rem' }}>
          <Link to="/" style={{ color: '#6b7280', textDecoration: 'none' }}>← Back to Mason Store</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
