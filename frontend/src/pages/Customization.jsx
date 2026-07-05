import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles
} from 'lucide-react';
import api from '../utils/api';
import './Customization.css';
import toast from 'react-hot-toast';

// Data definitions
const products = [
  { id: 'single_tshirt', name: 'Single T-Shirt', price: 499, icon: <Shirt size={32} /> },
  { id: 'couple_tshirts', name: 'Couple T-Shirts', price: 899, icon: <Heart size={32} /> },
  { id: 'hoodie', name: 'Premium Hoodie', price: 999, icon: <Layers size={32} /> },
  { id: 'oversized_tshirt', name: 'Oversized T-Shirt', price: 599, icon: <Shirt size={32} /> },
  { id: 'couple_pj', name: 'Couple PJ Set', price: 1299, icon: <Heart size={32} /> },
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
        notes: formData.notes
      };

      const { data } = await api.post('/customizations/general', payload);
      if (data.success) {
        setSuccess(true);
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

  return (
    <div className="cust-container">
      {/* Header */}
      <div className="cust-header">
        <h1>Create Your Custom Design</h1>
        <p>Follow the steps to build your unique apparel.</p>
        <div className="cust-progress-bar">
          <div className="cust-progress-fill" style={{ width: `${(step / 8) * 100}%` }} />
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

          {/* Navigation Controls */}
          <div className="cust-nav-controls">
            {step > 1 ? (
              <button className="cust-btn-outline" onClick={handlePrev}>
                <ArrowLeft size={18} /> Back
              </button>
            ) : <div></div>}

            {step < 8 ? (
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
                Next <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                className="cust-btn-submit" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Checkout (₹${totalPrice})`}
              </button>
            )}
          </div>
        </div>

        {/* Right: Live Preview Widget */}
        <div className="cust-preview-section">
          <div className="cust-preview-card" style={{ backgroundColor: colors.find(c => c.name === formData.color)?.hex || '#f1f5f9' }}>
            {formData.productType ? (
              <div className="preview-product-shape">
                {/* Fallback silhouette based on product type */}
                {formData.productType.includes('hoodie') ? <Layers size={120} color="rgba(255,255,255,0.8)" /> : <Shirt size={120} color="rgba(255,255,255,0.8)" />}
                
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
    </div>
  );
};

export default Customization;
