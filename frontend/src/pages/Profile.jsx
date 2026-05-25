import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Heart, MapPin, Settings, LogOut, ChevronRight, User, Ruler, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Address State
  const [addresses, setAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState({
    fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: ''
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Settings State
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '' });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setProfileData({ name: user.name, email: user.email });
      fetchAddresses();
    }
  }, [user, navigate]);

  const fetchAddresses = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setAddresses(data.user.addresses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/address', newAddress);
      toast.success('Address added successfully');
      setShowAddressForm(false);
      setNewAddress({ fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '' });
      fetchAddresses();
    } catch (err) {
      toast.error('Failed to add address');
    }
  };

  const handleDeleteAddress = async (index) => {
    try {
      await api.delete(`/auth/address/${index}`);
      toast.success('Address removed');
      fetchAddresses();
    } catch (err) {
      toast.error('Failed to remove address');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', profileData);
      toast.success('Profile updated! (Refresh to see changes globally)');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    try {
      await api.put('/auth/change-password', passwords);
      toast.success('Password changed successfully');
      setPasswords({ oldPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  if (!user) return null;

  return (
    <div className="profile-container container mt-4 mb-5">
      <div className="profile-header text-center mb-5">
        <div className="profile-avatar">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <h2>Hello, {user.name}!</h2>
        <p className="text-muted">{user.email}</p>
      </div>

      {activeTab === 'overview' && (
        <div className="profile-grid">
          <Link to="/orders" className="profile-card">
            <div className="profile-card-icon"><Package size={24} /></div>
            <div className="profile-card-info">
              <h3>My Orders</h3>
              <p>Track, return, or buy things again</p>
            </div>
            <ChevronRight className="profile-card-arrow" />
          </Link>

          <Link to="/wishlist" className="profile-card">
            <div className="profile-card-icon"><Heart size={24} /></div>
            <div className="profile-card-info">
              <h3>Wishlist</h3>
              <p>Your saved items and collections</p>
            </div>
            <ChevronRight className="profile-card-arrow" />
          </Link>

          <button className="profile-card text-left w-100" onClick={() => setActiveTab('addresses')}>
            <div className="profile-card-icon"><MapPin size={24} /></div>
            <div className="profile-card-info">
              <h3>Saved Addresses</h3>
              <p>Manage shipping addresses for fast checkout</p>
            </div>
            <ChevronRight className="profile-card-arrow" />
          </button>

          <button className="profile-card text-left w-100" onClick={() => setActiveTab('settings')}>
            <div className="profile-card-icon"><Settings size={24} /></div>
            <div className="profile-card-info">
              <h3>Account Settings</h3>
              <p>Update personal details and password</p>
            </div>
            <ChevronRight className="profile-card-arrow" />
          </button>

          <button className="profile-card logout-card text-left w-100" onClick={handleLogout}>
            <div className="profile-card-icon"><LogOut size={24} /></div>
            <div className="profile-card-info">
              <h3>Logout</h3>
              <p>Sign out of your account</p>
            </div>
          </button>
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'addresses' && (
        <div className="profile-section fade-in">
          <button className="btn-back mb-4" onClick={() => setActiveTab('overview')}>
            <ArrowLeft size={18} /> Back to Profile
          </button>
          
          <div className="d-flex justify-between align-center mb-4">
            <h3>Saved Addresses</h3>
            <button className="btn btn-outline" onClick={() => setShowAddressForm(!showAddressForm)}>
              {showAddressForm ? 'Cancel' : '+ Add New'}
            </button>
          </div>

          {showAddressForm && (
            <form onSubmit={handleAddAddress} className="address-form card p-4 mb-4">
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" className="form-input" required value={newAddress.fullName} onChange={e => setNewAddress({...newAddress, fullName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" className="form-input" required value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Address Line 1</label>
                  <input type="text" className="form-input" required value={newAddress.line1} onChange={e => setNewAddress({...newAddress, line1: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Address Line 2 (Optional)</label>
                  <input type="text" className="form-input" value={newAddress.line2} onChange={e => setNewAddress({...newAddress, line2: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" className="form-input" required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input type="text" className="form-input" required value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Pincode</label>
                  <input type="text" className="form-input" required value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary mt-4">Save Address</button>
            </form>
          )}

          <div className="address-grid">
            {addresses.map((addr, idx) => (
              <div key={idx} className="address-card card p-4">
                <h4>{addr.fullName}</h4>
                <p className="mt-2 text-muted">
                  {addr.line1}, {addr.line2 && `${addr.line2},`} <br/>
                  {addr.city}, {addr.state} - {addr.pincode}<br/>
                  Phone: {addr.phone}
                </p>
                <button className="btn-remove-address mt-3" onClick={() => handleDeleteAddress(idx)}>Remove</button>
              </div>
            ))}
            {addresses.length === 0 && !showAddressForm && (
              <p className="text-muted">You have no saved addresses.</p>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="profile-section fade-in">
          <button className="btn-back mb-4" onClick={() => setActiveTab('overview')}>
            <ArrowLeft size={18} /> Back to Profile
          </button>
          
          <div className="settings-cards" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="card p-4 mb-4">
              <h3 className="mb-4 text-center">Personal Information</h3>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group mb-3">
                  <label>Full Name</label>
                  <input type="text" className="form-input mt-1" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                </div>
                <div className="form-group mb-4">
                  <label>Email Address</label>
                  <input type="email" className="form-input mt-1 mb-2" value={profileData.email} disabled />
                  <small className="text-muted d-block">Email cannot be changed.</small>
                </div>
                <button type="submit" className="btn btn-primary w-100 mt-2">Save Changes</button>
              </form>
            </div>

            <div className="card p-4">
              <h3 className="mb-4 text-center">Change Password</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group mb-3">
                  <label>Current Password</label>
                  <input type="password" className="form-input mt-1" required value={passwords.oldPassword} onChange={e => setPasswords({...passwords, oldPassword: e.target.value})} placeholder="Enter your current password" />
                </div>
                <div className="form-group mb-4">
                  <label>New Password</label>
                  <input type="password" className="form-input mt-1" required value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} placeholder="Enter your new password (min 6 characters)" />
                </div>
                <button type="submit" className="btn btn-primary w-100 mt-2">Change Password</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
