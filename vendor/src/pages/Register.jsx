import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const initialForm = {
  name: '', email: '', password: '', phone: '',
  businessName: '', gstNumber: '', panNumber: '',
  line1: '', line2: '', city: '', state: '', pincode: '',
  accountHolder: '', accountNumber: '', ifsc: '', bankName: '',
};

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password, phone: form.phone,
        businessName: form.businessName, gstNumber: form.gstNumber, panNumber: form.panNumber,
        address: { line1: form.line1, line2: form.line2, city: form.city, state: form.state, pincode: form.pincode },
        bankDetails: { accountHolder: form.accountHolder, accountNumber: form.accountNumber, ifsc: form.ifsc, bankName: form.bankName },
      };
      const { data } = await api.post('/auth/vendor-register', payload);
      login(data.token, data.user);
      toast.success('Registration submitted! Awaiting admin approval.');
      navigate('/pending');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 640, textAlign: 'center', padding: '3rem 2rem' }}>
        <h1>Become a Vendor</h1>
        <div style={{
          background: '#fff8f6', border: '1px solid #fecaca', borderRadius: '8px',
          padding: '2rem', marginTop: '2rem', color: '#dc2626', lineHeight: 1.6
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Registration Disabled</p>
          <p style={{ fontSize: '0.95rem', color: '#475569' }}>
            Vendor self-registration is currently disabled. The platform is configured as a single-vendor store.
            Please contact the website administrator to obtain your vendor credentials.
          </p>
        </div>
        <div className="switch-link" style={{ marginTop: '2rem' }}>
          Already a vendor? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
