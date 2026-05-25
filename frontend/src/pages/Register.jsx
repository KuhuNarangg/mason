import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(name, email, password);
    if (res.success) {
      navigate('/');
    }
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

          <p className="auth-footer">
            Already a member? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
