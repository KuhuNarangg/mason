import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, googleLogin, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(name, email, password);
    if (res.success) {
      navigate('/');
    }
  };

  const handleGoogle = async (credentialResponse) => {
    const res = await googleLogin(credentialResponse.credential);
    if (res?.success) navigate('/');
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
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join the House of Mason exclusive members list.</p>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input 
                type="text" 
                className="auth-input" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required 
                placeholder="Enter your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input 
                type="email" 
                className="auth-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="Enter your email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input 
                type="password" 
                className="auth-input" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="Create a password (min 6 chars)"
                minLength={6}
              />
            </div>
            
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ margin: '1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--champagne)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--champagne)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', overflow: 'hidden' }}>
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => {}}
              text="signup_with"
              shape="rectangular"
              theme="outline"
              size="large"
              width="280"
            />
          </div>

          <p className="auth-footer">
            Already a member? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
