import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Shirt, 
  Palette, 
  Type, 
  UploadCloud, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Image as ImageIcon,
  Heart,
  Droplets,
  Layers,
  Sparkles,
  MapPin,
  CreditCard,
  Check
} from 'lucide-react';
import api from '../utils/api';
import SEO from '../components/SEO';
import Breadcrumbs from '../components/Breadcrumbs';
import './Customization.css';
import toast from 'react-hot-toast';
import { loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpay';
import { states } from '../utils/indiaData';

// Data definitions
const products = [
  { id: 'single_tshirt', name: 'Single T-Shirt', price: 499, icon: <Shirt size={32} /> },
  { id: 'couple_tshirts', name: 'Couple T-Shirts', price: 899, icon: <Heart size={32} /> },
  { id: 'hoodie', name: 'Premium Hoodie', price: 999, icon: <Layers size={32} /> },
  { id: 'oversized_tshirt', name: 'Oversized T-Shirt', price: 599, icon: <Shirt size={32} /> },
  { id: 'couple_pj', name: 'Couple PJ Set', price: 1299, icon: <Heart size={32} /> },
  { id: 'custom_dress', name: 'Custom Dress', price: 1499, icon: <Sparkles size={32} /> },
];

const designTypes = [
  { id: 'gen_z', name: 'Gen Z Collection', desc: 'Trendy, bold, aesthetic' },
  { id: 'couple', name: 'Couple Collection', desc: 'Matching vibes for you & them' },
  { id: 'quotes', name: 'Quote Collection', desc: 'Text-based minimalism' },
  { id: 'custom', name: 'Custom Upload', desc: 'Your own graphics' },
];

const materials = [
  { id: 'cotton', name: '100% Cotton', price: 0, desc: 'Breathable & classic' },
  { id: 'premium_cotton', name: 'Premium Combed Cotton', price: 150, desc: 'Ultra-soft & durable' },
  { id: 'heavy_gsm', name: 'Heavy GSM (Streetwear)', price: 250, desc: 'Thick, structured fit' },
];

const colors = [
  { id: 'black', name: 'Midnight Black', hex: '#111827' },
  { id: 'white', name: 'Pure White', hex: '#f8fafc' },
  { id: 'navy', name: 'Navy Blue', hex: '#1e3a8a' },
  { id: 'sage', name: 'Sage Green', hex: '#b2ac88' },
  { id: 'lavender', name: 'Lavender', hex: '#b57edc' },
  { id: 'beige', name: 'Oatmeal Beige', hex: '#e5e0d8' },
];

const printTypes = [
  { id: 'dtf', name: 'DTF Print', price: 100, desc: 'Vibrant, durable colors' },
  { id: 'screen', name: 'Screen Print', price: 80, desc: 'Classic, smooth finish' },
  { id: 'embroidery', name: 'Embroidery', price: 300, desc: 'Premium stitched look' },
  { id: 'vinyl', name: 'Vinyl (Puff)', price: 150, desc: 'Raised 3D effect' },
];

const predefinedQuotes = [
  "His & Hers",
  "We Fell in Love in October",
  "Main Character Energy",
  "Delulu is the Solulu",
  "Touch Grass",
  "It's Giving...",
  "Custom (Type your own)"
];

const placements = [
  { id: 'front_center', name: 'Front Center' },
  { id: 'left_chest', name: 'Left Chest' },
  { id: 'right_chest', name: 'Right Chest' },
  { id: 'back_large', name: 'Large Back' },
  { id: 'sleeves', name: 'Sleeves' },
];

const Customization = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    productType: '',
    designType: '',
    material: '',
    color: '',
    printType: '',
    quoteText: '',
    customQuoteMode: false,
    customDesignUrl: '',
    printPlacement: '',
    quantity: 1,
    notes: ''
  });

  // Pre-select product type based on URL
  useEffect(() => {
    if (location.pathname === '/customized-dresses') {
      setFormData(prev => ({ ...prev, productType: 'custom_dress' }));
    } else if (location.pathname === '/custom-couple-tshirts') {
      setFormData(prev => ({ ...prev, productType: 'couple_tshirts' }));
    } else if (location.pathname === '/custom-hoodies') {
      setFormData(prev => ({ ...prev, productType: 'hoodie' }));
    } else if (location.pathname === '/custom-tshirts') {
      setFormData(prev => ({ ...prev, productType: 'single_tshirt' }));
    }
  }, [location.pathname]);

  // Shipping & Payment State
  const [shipping, setShipping] = useState({
    fullName: user?.name || '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);

  // Load user saved addresses
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const { data } = await api.get('/auth/me');
          if (data.user?.addresses?.length > 0) {
            setSavedAddresses(data.user.addresses);
            const defaultIdx = data.user.addresses.findIndex(a => a.isDefault);
            if (defaultIdx !== -1) {
              setSelectedAddressIndex(defaultIdx);
              const addr = data.user.addresses[defaultIdx];
              setShipping({
                fullName: addr.fullName,
                phone: addr.phone,
                line1: addr.line1,
                line2: addr.line2 || '',
                city: addr.city,
                state: addr.state,
                pincode: addr.pincode,
              });
            }
          }
        } catch (err) {
          console.error('Failed to fetch user addresses:', err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleAddressSelect = (index) => {
    setSelectedAddressIndex(index);
    if (index === -1) {
      setShipping({
        fullName: user?.name || '',
        phone: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
      });
    } else {
      const addr = savedAddresses[index];
      setShipping({
        fullName: addr.fullName,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2 || '',
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
      });
    }
  };

  const [totalPrice, setTotalPrice] = useState(0);

  // Calculate Price
  useEffect(() => {
    let price = 0;
    if (formData.productType) {
      price += products.find(p => p.id === formData.productType)?.price || 0;
    }
    if (formData.material) {
      price += materials.find(m => m.id === formData.material)?.price || 0;
    }
    if (formData.printType) {
      price += printTypes.find(p => p.id === formData.printType)?.price || 0;
    }
    setTotalPrice(price * formData.quantity);
  }, [formData]);

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formPayload = new FormData();
      formPayload.append('file', file);
      const { data } = await api.post('/upload', formPayload, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.url) {
        setFormData({ ...formData, customDesignUrl: data.url });
        toast.success('Design uploaded successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login?redirect=/customisation');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        productType: products.find(p => p.id === formData.productType)?.name,
        designType: designTypes.find(d => d.id === formData.designType)?.name,
        material: materials.find(m => m.id === formData.material)?.name,
        color: formData.color,
        printType: printTypes.find(p => p.id === formData.printType)?.name,
        quoteText: formData.quoteText,
        customDesignUrl: formData.customDesignUrl,
        printPlacement: placements.find(p => p.id === formData.printPlacement)?.name,
        quantity: formData.quantity,
        totalPrice,
        notes: formData.notes,
        shippingAddress: shipping,
        paymentMethod
      };

      const { data } = await api.post('/customizations/general', payload);
      if (data.success) {
        if (paymentMethod === 'cod') {
          toast.success('Custom design order placed successfully (COD)! 🛍️');
          setSuccess(true);
        } else if (paymentMethod === 'razorpay' && data.razorpayOrder) {
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            toast.error('Could not load payment gateway. Please check your connection.');
            setLoading(false);
            return;
          }

          const { razorpayOrder } = data;
          openRazorpayCheckout({
            keyId: razorpayOrder.keyId,
            razorpayOrderId: razorpayOrder.razorpayOrderId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            orderNumber: `CUST_${data.customization._id.toString().slice(-6).toUpperCase()}`,
            user: {
              name: shipping.fullName,
              email: user?.email || '',
              phone: shipping.phone,
            },
            onSuccess: async (response) => {
              try {
                setLoading(true);
                await api.post('/customizations/general/verify-payment', {
                  customizationId: data.customization._id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                });
                toast.success('Payment successful! 🎉 Custom order confirmed.');
                setSuccess(true);
              } catch (err) {
                toast.error(err.response?.data?.message || 'Payment verification failed. Contact support.');
              } finally {
                setLoading(false);
              }
            },
            onFailure: (msg) => {
              toast.error(`Payment failed: ${msg}`);
              setSuccess(true);
            },
            onDismiss: () => {
              toast('Payment cancelled. Your customization request is saved.', { icon: 'ℹ️' });
              setSuccess(true);
            }
          });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="cust-success-screen">
        <CheckCircle size={64} className="cust-success-icon" />
        <h2>Order Received! ✨</h2>
        <p>Your custom design is now in production. We will process it shortly!</p>
        <button className="cust-btn-primary" onClick={() => navigate('/profile')}>
          View My Orders
        </button>
      </div>
    );
  }

  const getSeoData = () => {
    switch (location.pathname) {
      case '/customized-dresses':
        return { title: 'Customized Dresses', desc: 'Design your own custom dresses online. Choose fabrics, prints, and styles.' };
      case '/custom-couple-tshirts':
        return { title: 'Custom Couple T-Shirts', desc: 'Design matching custom couple t-shirts. Perfect for anniversaries and gifts.' };
      case '/custom-hoodies':
        return { title: 'Custom Hoodies', desc: 'Create your own premium custom hoodies with unique prints and styles.' };
      case '/custom-tshirts':
        return { title: 'Custom T-Shirts', desc: 'Design custom t-shirts online. High-quality prints and premium fabrics.' };
      default:
        return { title: 'Custom Apparel Design', desc: 'Create your own unique custom apparel. Choose from t-shirts, hoodies, and dresses.' };
    }
  };

  const seoData = getSeoData();

  return (
    <div className="cust-container">
      <SEO 
        title={seoData.title}
        description={seoData.desc}
        url={location.pathname}
        type="website"
      />
      <Breadcrumbs crumbs={[
        { name: "Home", path: "/" },
        { name: seoData.title, path: location.pathname }
      ]} />
      {/* Header */}
      <div className="cust-header">
        <h1>Create Your Custom Design</h1>
        <p>Follow the steps to build your unique apparel.</p>
        <div className="cust-progress-bar">
          <div className="cust-progress-fill" style={{ width: `${(step / 9) * 100}%` }} />
        </div>
      </div>

      <div className="cust-main">
        {/* Left: Interactive Form */}
        <div className="cust-form-section">
          
          {/* STEP 1: Product */}
          {step === 1 && (
            <div className="cust-step-animate">
              <h2>1. Choose Product</h2>
              <div className="cust-grid-2">
                {products.map(p => (
                  <button 
                    key={p.id} 
                    className={`cust-card-btn ${formData.productType === p.id ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, productType: p.id })}
                  >
                    {p.icon}
                    <h3>{p.name}</h3>
                    <span>Starting at ₹{p.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Design Type */}
          {step === 2 && (
            <div className="cust-step-animate">
              <h2>2. Design Theme</h2>
              <div className="cust-grid-2">
                {designTypes.map(d => (
                  <button 
                    key={d.id} 
                    className={`cust-card-btn ${formData.designType === d.id ? 'active' : ''}`}
                    onClick={() => {
                      setFormData({ ...formData, designType: d.id, quoteText: '', customDesignUrl: '' });
                    }}
                  >
                    <Sparkles size={24} />
                    <h3>{d.name}</h3>
                    <p>{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Material */}
          {step === 3 && (
            <div className="cust-step-animate">
              <h2>3. Fabric Material</h2>
              <div className="cust-grid-1">
                {materials.map(m => (
                  <button 
                    key={m.id} 
                    className={`cust-row-btn ${formData.material === m.id ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, material: m.id })}
                  >
                    <div className="cust-row-info">
                      <h3>{m.name}</h3>
                      <p>{m.desc}</p>
                    </div>
                    <div className="cust-row-price">
                      {m.price === 0 ? 'Included' : `+ ₹${m.price}`}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Color */}
          {step === 4 && (
            <div className="cust-step-animate">
              <h2>4. Apparel Color</h2>
              <div className="cust-color-grid">
                {colors.map(c => (
                  <button
                    key={c.id}
                    className={`cust-color-swatch ${formData.color === c.name ? 'active' : ''}`}
                    style={{ '--bg': c.hex }}
                    onClick={() => setFormData({ ...formData, color: c.name })}
                    title={c.name}
                  >
                    <span className="swatch-color" />
                    <span className="swatch-name">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Print Type */}
          {step === 5 && (
            <div className="cust-step-animate">
              <h2>5. Print/Applique Style</h2>
              <div className="cust-grid-2">
                {printTypes.map(p => (
                  <button 
                    key={p.id} 
                    className={`cust-card-btn ${formData.printType === p.id ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, printType: p.id })}
                  >
                    <Droplets size={24} />
                    <h3>{p.name}</h3>
                    <p>{p.desc}</p>
                    <span className="price-tag">+ ₹{p.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Graphic/Quote */}
          {step === 6 && (
            <div className="cust-step-animate">
              <h2>6. Artwork & Graphics</h2>
              {formData.designType === 'custom' ? (
                <div className="cust-upload-zone">
                  {formData.customDesignUrl ? (
                    <div className="cust-preview-image">
                      <img src={formData.customDesignUrl} alt="Uploaded Design" />
                      <button className="cust-btn-outline mt-3" onClick={() => setFormData({...formData, customDesignUrl: ''})}>Remove</button>
                    </div>
                  ) : (
                    <>
                      <input type="file" id="designUpload" accept="image/*" onChange={handleFileUpload} hidden disabled={uploading} />
                      <label htmlFor="designUpload" className="cust-upload-label">
                        {uploading ? <div className="spinner"></div> : <UploadCloud size={48} />}
                        <p>{uploading ? 'Uploading...' : 'Click to Upload Your Graphic'}</p>
                        <span>PNG, JPG (High Res)</span>
                      </label>
                    </>
                  )}
                </div>
              ) : (
                <div className="cust-quotes-section">
                  <div className="cust-grid-2">
                    {predefinedQuotes.map(q => (
                      <button 
                        key={q} 
                        className={`cust-quote-chip ${(formData.quoteText === q && !formData.customQuoteMode) || (q === 'Custom (Type your own)' && formData.customQuoteMode) ? 'active' : ''}`}
                        onClick={() => {
                          if (q === 'Custom (Type your own)') {
                            setFormData({ ...formData, quoteText: '', customQuoteMode: true });
                          } else {
                            setFormData({ ...formData, quoteText: q, customQuoteMode: false });
                          }
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  {formData.customQuoteMode && (
                    <input 
                      type="text" 
                      className="cust-input mt-4" 
                      placeholder="Type your custom text here..."
                      value={formData.quoteText}
                      onChange={(e) => setFormData({...formData, quoteText: e.target.value})}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Placement */}
          {step === 7 && (
            <div className="cust-step-animate">
              <h2>7. Print Placement</h2>
              <div className="cust-placement-grid">
                {placements.map(p => (
                  <button 
                    key={p.id} 
                    className={`cust-placement-btn ${formData.printPlacement === p.id ? 'active' : ''}`}
                    onClick={() => setFormData({ ...formData, printPlacement: p.id })}
                  >
                    <div className={`placement-icon ${p.id}`} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: Review & Submit */}
          {step === 8 && (
            <div className="cust-step-animate">
              <h2>8. Review Your Order</h2>
              <div className="cust-review-summary">
                <div className="summary-row"><span>Product</span> <strong>{products.find(p=>p.id===formData.productType)?.name}</strong></div>
                <div className="summary-row"><span>Theme</span> <strong>{designTypes.find(d=>d.id===formData.designType)?.name}</strong></div>
                <div className="summary-row"><span>Material</span> <strong>{materials.find(m=>m.id===formData.material)?.name}</strong></div>
                <div className="summary-row"><span>Color</span> <strong>{formData.color}</strong></div>
                <div className="summary-row"><span>Print Tech</span> <strong>{printTypes.find(p=>p.id===formData.printType)?.name}</strong></div>
                <div className="summary-row"><span>Placement</span> <strong>{placements.find(p=>p.id===formData.printPlacement)?.name}</strong></div>
                
                {formData.quoteText && <div className="summary-row"><span>Text/Quote</span> <strong>"{formData.quoteText}"</strong></div>}
                
                <div className="summary-row mt-4">
                  <span>Quantity</span>
                  <div className="qty-selector">
                    <button onClick={()=>setFormData({...formData, quantity: Math.max(1, formData.quantity - 1)})}>-</button>
                    <span>{formData.quantity}</span>
                    <button onClick={()=>setFormData({...formData, quantity: formData.quantity + 1})}>+</button>
                  </div>
                </div>
                
                <textarea 
                  className="cust-input mt-4" 
                  rows="3" 
                  placeholder="Any extra notes? (e.g. Please make the text cursive font)"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* STEP 9: Shipping & Payment */}
          {step === 9 && (
            <div className="cust-step-animate">
              <h2>9. Shipping & Payment</h2>
              
              {/* Saved Address Selector */}
              {savedAddresses.length > 0 && (
                <div className="mb-4">
                  <label className="d-block mb-1 text-sm font-semibold" style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>Select Saved Address</label>
                  <select 
                    className="cust-input mb-3" 
                    value={selectedAddressIndex} 
                    onChange={e => handleAddressSelect(Number(e.target.value))}
                  >
                    <option value={-1}>-- Use New Address --</option>
                    {savedAddresses.map((addr, idx) => (
                      <option key={idx} value={idx}>
                        {addr.fullName} - {addr.line1}, {addr.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Address Form Fields */}
              <div className="address-form-fields">
                <div className="full-width-field">
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    className="cust-input" 
                    required 
                    value={shipping.fullName} 
                    onChange={e => setShipping({ ...shipping, fullName: e.target.value })} 
                    disabled={selectedAddressIndex !== -1}
                  />
                </div>
                <div>
                  <input 
                    type="tel" 
                    placeholder="Phone Number"
                    className="cust-input" 
                    required 
                    value={shipping.phone} 
                    onChange={e => setShipping({ ...shipping, phone: e.target.value })} 
                    disabled={selectedAddressIndex !== -1}
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="Pincode"
                    className="cust-input" 
                    required 
                    value={shipping.pincode} 
                    onChange={e => setShipping({ ...shipping, pincode: e.target.value })} 
                    disabled={selectedAddressIndex !== -1}
                  />
                </div>
                <div className="full-width-field">
                  <input 
                    type="text" 
                    placeholder="Address Line 1"
                    className="cust-input" 
                    required 
                    value={shipping.line1} 
                    onChange={e => setShipping({ ...shipping, line1: e.target.value })} 
                    disabled={selectedAddressIndex !== -1}
                  />
                </div>
                <div className="full-width-field">
                  <input 
                    type="text" 
                    placeholder="Address Line 2 (Optional)"
                    className="cust-input" 
                    value={shipping.line2} 
                    onChange={e => setShipping({ ...shipping, line2: e.target.value })} 
                    disabled={selectedAddressIndex !== -1}
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    placeholder="City"
                    className="cust-input" 
                    required 
                    value={shipping.city} 
                    onChange={e => setShipping({ ...shipping, city: e.target.value })} 
                    disabled={selectedAddressIndex !== -1}
                  />
                </div>
                <div>
                  <select 
                    className="cust-input" 
                    required 
                    value={shipping.state} 
                    onChange={e => setShipping({ ...shipping, state: e.target.value })}
                    disabled={selectedAddressIndex !== -1}
                  >
                    <option value="">Select State</option>
                    {states.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mt-4">
                <label className="d-block mb-2 font-semibold" style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>Payment Method</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    type="button"
                    className={`cust-placement-btn flex-1 ${paymentMethod === 'razorpay' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('razorpay')}
                    style={{ flex: 1, padding: '0.85rem' }}
                  >
                    Online Payment
                  </button>
                  <button 
                    type="button"
                    className={`cust-placement-btn flex-1 ${paymentMethod === 'cod' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                    style={{ flex: 1, padding: '0.85rem' }}
                  >
                    Cash on Delivery
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="cust-nav-controls">
            {step > 1 ? (
              <button className="cust-btn-outline" onClick={handlePrev}>
                <ArrowLeft size={18} /> Back
              </button>
            ) : <div></div>}

            {step < 9 ? (
              <button 
                className="cust-btn-primary" 
                onClick={handleNext}
                disabled={
                  (step === 1 && !formData.productType) ||
                  (step === 2 && !formData.designType) ||
                  (step === 3 && !formData.material) ||
                  (step === 4 && !formData.color) ||
                  (step === 5 && !formData.printType) ||
                  (step === 6 && formData.designType === 'custom' && !formData.customDesignUrl) ||
                  (step === 6 && formData.designType !== 'custom' && !formData.quoteText) ||
                  (step === 7 && !formData.printPlacement)
                }
              >
                {step === 8 ? 'Proceed to Shipping' : 'Next'} <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                className={`cust-btn-submit ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handleSubmit}
                disabled={
                  loading || 
                  !shipping.fullName || 
                  !shipping.phone || 
                  !shipping.line1 || 
                  !shipping.city || 
                  !shipping.state || 
                  !shipping.pincode
                }
              >
                {loading ? 'Processing...' : `Place Custom Order (₹${totalPrice})`}
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Preview Widget */}
        <div className="cust-preview-section">
          <div className="cust-preview-card" style={{ backgroundColor: colors.find(c => c.name === formData.color)?.hex || '#f5f0eb' }}>
            {formData.productType ? (
              <div className="preview-product-shape">
                {/* Large shirt/hoodie silhouette filling the preview */}
                <svg className={`shirt-silhouette ${['Midnight Black', 'Navy Blue'].includes(formData.color) ? 'dark-mode' : 'light-mode'}`} viewBox="0 0 300 360" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {formData.productType.includes('hoodie') ? (
                    /* Hoodie silhouette */
                    <path d="M150 30 C140 30 130 25 120 22 C110 19 95 18 85 22 L40 55 L15 120 L50 140 L60 105 L60 330 L240 330 L240 105 L250 140 L285 120 L260 55 L215 22 C205 18 190 19 180 22 C170 25 160 30 150 30 Z M130 30 C130 45 140 55 150 55 C160 55 170 45 170 30" />
                  ) : (
                    /* T-shirt silhouette */
                    <path d="M110 25 L60 45 L15 100 L55 130 L80 80 L80 335 L220 335 L220 80 L245 130 L285 100 L240 45 L190 25 C185 40 170 55 150 55 C130 55 115 40 110 25 Z" />
                  )}
                </svg>
                
                {/* Overlay Graphic */}
                {formData.customDesignUrl && (
                  <img src={formData.customDesignUrl} alt="Artwork" className={`overlay-art placement-${formData.printPlacement}`} />
                )}
                {formData.quoteText && (
                  <div className={`overlay-text placement-${formData.printPlacement}`}>
                    {formData.quoteText}
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-preview">
                <ImageIcon size={48} opacity={0.3} />
                <p>Select a product to preview</p>
              </div>
            )}
          </div>
          
          <div className="cust-price-tally">
            <div className="tally-row"><span>Base</span> <span>₹{products.find(p=>p.id===formData.productType)?.price || 0}</span></div>
            <div className="tally-row"><span>Material</span> <span>₹{materials.find(m=>m.id===formData.material)?.price || 0}</span></div>
            <div className="tally-row"><span>Print</span> <span>₹{printTypes.find(p=>p.id===formData.printType)?.price || 0}</span></div>
            <hr />
            <div className="tally-row tally-total">
              <span>Total Price</span> 
              <span>₹{totalPrice}</span>
            </div>
          </div>
        </div>
        
      </div>

      {/* FAQ Section (AI Visibility Quick Win) */}
      <section className="cust-faq mt-5" style={{ background: '#f8f9fa', padding: '3rem 2rem', borderRadius: '12px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.8rem' }}>Customization FAQ</h2>
        <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#111827' }}>What is the estimated turnaround time for custom orders?</h4>
            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Our standard turnaround time for made-to-order apparel is 7-10 business days. For intricate designs or hand-embroidered details, please allow up to 14 business days. We will provide a definitive tracking timeline as soon as your garment enters production.</p>
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#111827' }}>Do you offer alterations if the fit isn't perfect?</h4>
            <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Yes, we stand behind the perfect fit. If your custom garment requires minor adjustments, we provide one complimentary round of alterations within 7 days of delivery. Please contact our support team with photos of the fit issue to initiate the alteration process.</p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Customization;
