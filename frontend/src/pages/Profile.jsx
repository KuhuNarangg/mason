import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Heart, MapPin, Settings, LogOut, ChevronRight, User, Ruler, ArrowLeft, FileText, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../utils/generateInvoice';
import './Profile.css';

const Profile = () => {
  const { user, token, logout, setAuthUser } = useAuth();
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

  // Weight & Fit Profile State
  const [fitData, setFitData] = useState({
    weight: user?.weight || '',
    height: user?.height || '',
    preferredSize: user?.preferredSize || '',
    fitPreference: user?.fitPreference || 'Regular'
  });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setProfileData({ name: user.name, email: user.email });
      setFitData({
        weight: user.weight || '',
        height: user.height || '',
        preferredSize: user.preferredSize || '',
        fitPreference: user.fitPreference || 'Regular'
      });
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

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data } = await api.get('/orders/my');
      setOrders(data.orders || []);
    } catch (err) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'invoices' && orders.length === 0) {
      fetchOrders();
    }
  }, [activeTab]);

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
      const { data } = await api.put('/auth/profile', profileData);
      // Update the user in AuthContext + localStorage so changes persist on refresh
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAuthUser(token, updatedUser);
      toast.success('Profile updated successfully!');
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

  const handleUpdateFitProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        weight: fitData.weight ? Number(fitData.weight) : null,
        height: fitData.height ? Number(fitData.height) : null,
        preferredSize: fitData.preferredSize,
        fitPreference: fitData.fitPreference
      };
      const { data } = await api.put('/auth/profile', payload);
      const updatedUser = { ...user, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setAuthUser(token, updatedUser);
      toast.success('Weight & Size Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update fit profile');
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

          <button className="profile-card text-left w-100" onClick={() => setActiveTab('fitProfile')}>
            <div className="profile-card-icon"><Ruler size={24} /></div>
            <div className="profile-card-info">
              <h3>Weight & Size Profile</h3>
              <p>{user?.weight ? `Saved Weight: ${user.weight}kg · Size ${user.preferredSize || 'Calculated'}` : 'Set your weight & size recommendations'}</p>
            </div>
            <ChevronRight className="profile-card-arrow" />
          </button>

          <button className="profile-card text-left w-100" onClick={() => setActiveTab('invoices')}>
            <div className="profile-card-icon"><FileText size={24} /></div>
            <div className="profile-card-info">
              <h3>Bills & Invoices</h3>
              <p>Download invoices for delivered orders</p>
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

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="profile-section fade-in">
          <button className="btn-back mb-4" onClick={() => setActiveTab('overview')}>
            <ArrowLeft size={18} /> Back to Profile
          </button>
          
          <h3 className="mb-4">Bills & Invoices</h3>
          
          {loadingOrders ? (
            <p>Loading invoices...</p>
          ) : (
            <div className="invoices-list">
              {orders.filter(o => o.statusHistory?.some(h => h.status === 'delivered')).length === 0 ? (
                <p className="text-muted">You have no invoices yet. Invoices are generated once an order is delivered.</p>
              ) : (
                orders
                  .filter(o => o.statusHistory?.some(h => h.status === 'delivered'))
                  .map(order => {
                    const isInvalid = ['returned', 'return_rejected', 'cancelled'].includes(order.status) || order.statusHistory?.some(h => h.status === 'returned');
                    return (
                      <div key={order._id} className="card p-4 mb-3 d-flex justify-between align-center" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <h4 style={{ margin: '0 0 0.5rem 0' }}>Invoice #{order.orderNumber}</h4>
                          <p className="text-muted" style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>
                            Billing Date: {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                            Final Amount Paid: <strong>₹{order.totalAmount}</strong>
                          </p>
                          <p className="text-muted" style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>
                            Order ID: {order._id}
                          </p>
                          {isInvalid && (
                            <span style={{ display: 'inline-block', marginTop: '0.75rem', padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                              Returned / Invalid Invoice
                            </span>
                          )}
                        </div>
                        
                        <div>
                          {!isInvalid ? (
                            <button 
                              className="btn btn-outline"
                              onClick={() => {
                                toast.success('Generating invoice...');
                                generateInvoicePDF(order);
                              }}
                            >
                              <Download size={16} /> Download PDF
                            </button>
                          ) : (
                            <button className="btn btn-outline" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                              Unavailable
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          )}
        </div>
      )}

      {/* Weight & Size Profile Tab */}
      {activeTab === 'fitProfile' && (
        <div className="profile-section fade-in">
          <button className="btn-back mb-4" onClick={() => setActiveTab('overview')}>
            <ArrowLeft size={18} /> Back to Profile
          </button>
          
          <div className="settings-cards" style={{ maxWidth: '540px', margin: '0 auto' }}>
            <div className="card p-4 mb-4">
              <div className="d-flex align-center gap-2 mb-3 justify-center">
                <Ruler size={24} style={{ color: 'var(--rose-gold, #C08A74)' }} />
                <h3 className="m-0 text-center">My Weight & Size Profile</h3>
              </div>
              <p className="text-muted text-center mb-4" style={{ fontSize: '0.9rem' }}>
                Save your body measurements so Mason can automatically recommend the best size for you on every product page.
              </p>

              <form onSubmit={handleUpdateFitProfile}>
                <div className="form-group mb-3">
                  <label>Weight (in kg) *</label>
                  <input
                    type="number"
                    min="20"
                    max="200"
                    className="form-input mt-1"
                    required
                    placeholder="e.g. 68"
                    value={fitData.weight}
                    onChange={e => setFitData({...fitData, weight: e.target.value})}
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Height (in cm) — Optional</label>
                  <input
                    type="number"
                    min="100"
                    max="230"
                    className="form-input mt-1"
                    placeholder="e.g. 172"
                    value={fitData.height}
                    onChange={e => setFitData({...fitData, height: e.target.value})}
                  />
                </div>

                <div className="form-group mb-3">
                  <label>Preferred Apparel Size</label>
                  <select
                    className="form-input mt-1"
                    value={fitData.preferredSize}
                    onChange={e => setFitData({...fitData, preferredSize: e.target.value})}
                  >
                    <option value="">Auto-Calculate Based on Weight</option>
                    <option value="S">Size S (Small)</option>
                    <option value="M">Size M (Medium)</option>
                    <option value="L">Size L (Large)</option>
                    <option value="XL">Size XL (Extra Large)</option>
                    <option value="XXL">Size XXL (2XL)</option>
                    <option value="3XL">Size 3XL (3XL)</option>
                  </select>
                </div>

                <div className="form-group mb-4">
                  <label>Fit Preference</label>
                  <select
                    className="form-input mt-1"
                    value={fitData.fitPreference}
                    onChange={e => setFitData({...fitData, fitPreference: e.target.value})}
                  >
                    <option value="Slim">Slim Fit (Snug)</option>
                    <option value="Regular">Regular Fit (Standard)</option>
                    <option value="Relaxed">Relaxed Fit (Loose/Oversized)</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary w-100 mt-2">Save Size Profile</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
