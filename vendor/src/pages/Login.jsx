import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      if (data.user.role !== 'vendor') {
        toast.error('This account is not registered as a vendor.');
        setLoading(false);
        return;
      }
      login(data.token, data.user);
      if (data.user.vendorStatus === 'approved') navigate('/dashboard');
      else navigate('/pending');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>Vendor Login</h1>
        <p className="subtitle">Sign in to manage your products, orders and earnings.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" required value={form.email} onChange={handleChange} placeholder="you@business.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" required value={form.password} onChange={handleChange} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        {/* <div className="switch-link">
          New vendor? <Link to="/register">Apply for a vendor account</Link>
        </div> */}
      </div>
    </div>
  );
}
