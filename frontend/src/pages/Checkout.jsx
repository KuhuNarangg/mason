import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Package, MapPin, CreditCard, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { states, indiaData } from '../utils/indiaData';
import { loadRazorpayScript, openRazorpayCheckout } from '../utils/razorpay';
import './Cart.css';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { user, isAuth } = useAuth();

  useEffect(() => {
    if (!isAuth) {
      navigate('/login?redirect=checkout');
    }
  }, [isAuth, navigate]);

  const { cart, clearCart, totalAmount } = useCart();
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Confirm
  const [loading, setLoading] = useState(false);

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
  const [customerNotes, setCustomerNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [discount, setDiscount] = useState(0);
  const [coupon, setCoupon] = useState('');
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(-1);
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false);

  useEffect(() => {
    const fetchActiveCoupons = async () => {
      try {
        const { data } = await api.get('/coupons/active');
        setActiveCoupons(data.coupons || []);
      } catch (err) {
        console.error('Failed to fetch coupons', err);
      }
    };
    fetchActiveCoupons();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (data.user.addresses?.length > 0) {
          setSavedAddresses(data.user.addresses);
          // Auto-select default address if available
          const defaultIdx = data.user.addresses.findIndex(a => a.isDefault);
          if (defaultIdx !== -1) {
            handleAddressSelect(defaultIdx, data.user.addresses);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      }
    };
    fetchProfile();
  }, []);

  const handleAddressSelect = (index, addresses = savedAddresses) => {
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
      const addr = addresses[index];
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

  const shipping_charge = totalAmount > 1000 ? 0 : 99;
  const finalAmount = totalAmount - discount + shipping_charge;

  const validateShipping = () => {
    const errors = {};
    if (!shipping.fullName?.trim()) errors.fullName = 'Full name is required';
    if (!shipping.phone?.trim()) errors.phone = 'Phone number is required';
    else if (!/^[0-9]{10}$/.test(shipping.phone)) errors.phone = 'Enter a valid 10-digit number';
    if (!shipping.line1?.trim()) errors.line1 = 'Address is required';
    if (!shipping.city?.trim()) errors.city = 'City is required';
    if (!shipping.state?.trim()) errors.state = 'State is required';
    if (!shipping.pincode?.trim()) errors.pincode = 'Pincode is required';
    else if (!/^[0-9]{6}$/.test(shipping.pincode)) errors.pincode = 'Enter a valid 6-digit pincode';

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const { data } = await api.post('/coupons/validate', { 
        code: coupon, 
        cartTotal: totalAmount 
      });
      setDiscount(data.coupon.discountAmount);
      toast.success(`Coupon applied! ${data.coupon.discountType === 'percentage' ? data.coupon.discountValue + '%' : formatPrice(data.coupon.discountValue)} discount`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
      setDiscount(0);
    }
  };

  const createOrder = async () => {
    if (!validateShipping()) return;

    setLoading(true);
    try {
      // Save address to profile if user opted in
      if (selectedAddressIndex === -1 && saveAddressToProfile) {
        await api.post('/auth/address', shipping);
      }

      const orderData = {
        items: cart.items.map(item => ({
          product: typeof item.product === 'object' && item.product?._id ? item.product._id : item.product,
          variantSize: item.variantSize,
          variantColor: item.variantColor,
          quantity: item.quantity,
          price: item.price || item.product?.price || item.product?.originalPrice,
        })),
        shippingAddress: shipping,
        paymentMethod,
        customerNotes,
        couponCode: discount > 0 ? coupon : undefined,
      };

      // Step 1 — Create the DB order (paymentStatus: pending for Razorpay)
      const { data } = await api.post('/orders', orderData);
      const dbOrder = data.order;

      // ── COD flow ──────────────────────────────────────────────
      if (paymentMethod === 'cod') {
        toast.success('Order placed successfully! 🎉');
        await clearCart();
        navigate('/orders');
        return;
      }

      // ── Razorpay flow ─────────────────────────────────────────
      setLoading(false); // release spinner while script loads

      // Load Razorpay checkout.js
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Could not load payment gateway. Please check your connection.');
        return;
      }

      // Step 2 — Get Razorpay order from our backend
      const { data: payData } = await api.post('/payments/create-razorpay-order', {
        orderId: dbOrder._id,
      });

      // Step 3 — Open Razorpay modal
      openRazorpayCheckout({
        keyId: payData.keyId,
        razorpayOrderId: payData.razorpayOrderId,
        amount: payData.amount,
        currency: payData.currency,
        orderNumber: payData.orderNumber,
        user: {
          name: shipping.fullName,
          email: user?.email || '',
          phone: shipping.phone,
        },

        // Step 4 — On success, verify signature on backend
        onSuccess: async (response) => {
          try {
            setLoading(true);
            await api.post('/payments/verify', {
              orderId: dbOrder._id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! 🎉 Order confirmed.');
            await clearCart();
            navigate(`/orders/${dbOrder._id}`);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed. Contact support.');
          } finally {
            setLoading(false);
          }
        },

        // Payment failed inside modal
        onFailure: (msg) => {
          toast.error(`Payment failed: ${msg}`);
        },

        // User closed modal without paying
        onDismiss: async () => {
          toast('Payment cancelled. Your order is saved — you can pay from My Orders.', { icon: 'ℹ️' });
          await clearCart();
          navigate(`/orders/${dbOrder._id}`);
        },
      });

    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="container py-5 text-center fade-in">
        <div className="empty-cart-icon mb-4">📦</div>
        <h2>Your cart is empty</h2>
        <p className="text-muted mt-2 mb-4">Add items before proceeding to checkout</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mb-5 fade-in" style={{ paddingTop: 'var(--space-8)' }}>
      <h1 className="cart-title" style={{ marginBottom: 'var(--space-6)' }}>Checkout</h1>

      <div className="cart-layout">
        <div className="checkout-main">
          {/* Progress Steps */}
          <div className="checkout-steps mb-5">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-number">{step > 1 ? <Check size={18}/> : <MapPin size={18} />}</div>
              <div className="step-label">Shipping</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-number">{step > 2 ? <Check size={18}/> : <CreditCard size={18} />}</div>
              <div className="step-label">Payment</div>
            </div>
            <div className="step-connector"></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number"><Check size={18} /></div>
              <div className="step-label">Confirm</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="checkout-content">
            {step === 1 && (
              <div className="checkout-card reveal active">
                <h2>
                  <MapPin size={24} />
                  Shipping Details
                </h2>

                {savedAddresses.length > 0 && (
                  <div className="form-group mb-4">
                    <label className="form-label">Select Saved Address</label>
                    <select 
                      className="form-select" 
                      value={selectedAddressIndex}
                      onChange={(e) => handleAddressSelect(Number(e.target.value))}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}
                    >
                      <option value="-1">Enter a new address</option>
                      {savedAddresses.map((addr, idx) => (
                        <option key={idx} value={idx}>
                          {addr.fullName}, {addr.city} ({addr.pincode})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group mb-4">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={shipping.fullName}
                    onChange={(e) => { setShipping({ ...shipping, fullName: e.target.value }); setFieldErrors(p => ({ ...p, fullName: '' })); }}
                    className={`form-input ${fieldErrors.fullName ? 'field-error' : ''}`}
                    disabled={selectedAddressIndex !== -1}
                  />
                  {fieldErrors.fullName && <span className="field-error-msg">{fieldErrors.fullName}</span>}
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={shipping.phone}
                    onChange={(e) => { setShipping({ ...shipping, phone: e.target.value }); setFieldErrors(p => ({ ...p, phone: '' })); }}
                    className={`form-input ${fieldErrors.phone ? 'field-error' : ''}`}
                    disabled={selectedAddressIndex !== -1}
                  />
                  {fieldErrors.phone && <span className="field-error-msg">{fieldErrors.phone}</span>}
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Flat, House no., Building, Company, Apartment *</label>
                  <input
                    type="text"
                    placeholder="Address Line 1"
                    value={shipping.line1}
                    onChange={(e) => { setShipping({ ...shipping, line1: e.target.value }); setFieldErrors(p => ({ ...p, line1: '' })); }}
                    className={`form-input ${fieldErrors.line1 ? 'field-error' : ''}`}
                    disabled={selectedAddressIndex !== -1}
                  />
                  {fieldErrors.line1 && <span className="field-error-msg">{fieldErrors.line1}</span>}
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Area, Street, Sector, Village</label>
                  <input
                    type="text"
                    placeholder="Address Line 2 (Optional)"
                    value={shipping.line2}
                    onChange={(e) => setShipping({ ...shipping, line2: e.target.value })}
                    className="form-input"
                    disabled={selectedAddressIndex !== -1}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <select
                      value={shipping.state}
                      onChange={(e) => { setShipping({ ...shipping, state: e.target.value, city: '' }); setFieldErrors(p => ({ ...p, state: '', city: '' })); }}
                      className={`form-input ${fieldErrors.state ? 'field-error' : ''}`}
                      disabled={selectedAddressIndex !== -1}
                    >
                      <option value="">Select State</option>
                      {states.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {fieldErrors.state && <span className="field-error-msg">{fieldErrors.state}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={shipping.city}
                      onChange={(e) => { setShipping({ ...shipping, city: e.target.value }); setFieldErrors(p => ({ ...p, city: '' })); }}
                      className={`form-input ${fieldErrors.city ? 'field-error' : ''}`}
                      disabled={selectedAddressIndex !== -1}
                    />
                    {fieldErrors.city && <span className="field-error-msg">{fieldErrors.city}</span>}
                  </div>
                </div>

                <div className="form-group mb-4">
                  <label className="form-label">Pincode *</label>
                  <input
                    type="text"
                    placeholder="6-digit Pincode"
                    value={shipping.pincode}
                    onChange={(e) => { setShipping({ ...shipping, pincode: e.target.value }); setFieldErrors(p => ({ ...p, pincode: '' })); }}
                    className={`form-input ${fieldErrors.pincode ? 'field-error' : ''}`}
                    disabled={selectedAddressIndex !== -1}
                  />
                  {fieldErrors.pincode && <span className="field-error-msg">{fieldErrors.pincode}</span>}
                </div>

                {selectedAddressIndex === -1 && (
                  <div className="form-group mb-5">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input 
                        type="checkbox" 
                        checked={saveAddressToProfile} 
                        onChange={(e) => setSaveAddressToProfile(e.target.checked)} 
                      />
                      Save this address for future orders
                    </label>
                  </div>
                )}

                <div className="form-group mb-5">
                  <label className="form-label">Order Notes (Optional)</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Notes about your order, e.g. special notes for delivery, sizing requests, customization."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={3}
                  ></textarea>
                </div>

                <button
                  onClick={() => validateShipping() && setStep(2)}
                  className="btn btn-primary w-100 py-3"
                >
                  Proceed to Payment <ArrowRight size={18} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="checkout-card reveal active">
                <h2>
                  <CreditCard size={24} />
                  Payment Method
                </h2>

                <div className="payment-options mb-5">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Online Payment (Razorpay / UPI / Cards)</span>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span>Cash on Delivery (Pay at your doorstep)</span>
                  </label>
                </div>

                <div className="coupon-section">
                  <h3 className="mb-3 font-heading" style={{ fontSize: '1.2rem' }}>Apply Coupon Code</h3>
                  <div className="coupon-input d-flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. SAVE10"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      className="form-input flex-1"
                    />
                    <button onClick={applyCoupon} className="btn btn-outline">
                      Apply
                    </button>
                  </div>
                  {activeCoupons.length > 0 && (
                    <div className="mt-3">
                      {activeCoupons.map((c, i) => (
                        <span key={c._id} className={`badge ${i === 0 ? 'featured' : 'trending'} ms-2`} style={{ cursor: 'pointer', display: 'inline-block', marginBottom: '0.5rem' }} onClick={() => setCoupon(c.code)}>
                          {c.code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="checkout-btn-row mt-5">
                  <button onClick={() => setStep(1)} className="btn btn-outline checkout-nav-btn">
                    Back
                  </button>
                  <button onClick={() => setStep(3)} className="btn btn-primary checkout-nav-btn">
                    Review Summary <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="checkout-card reveal active">
                <h2>
                  <Check size={24} />
                  Review & Confirm
                </h2>

                <div className="mb-4">
                  <h3 className="mb-3 font-heading" style={{ fontSize: '1.1rem' }}>Shipping to:</h3>
                  <div className="address-summary">
                    <p><strong>{shipping.fullName}</strong></p>
                    <p>{shipping.line1}, {shipping.line2}</p>
                    <p>{shipping.city}, {shipping.state} - {shipping.pincode}</p>
                    <p className="mt-2">📱 {shipping.phone}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="mb-3 font-heading" style={{ fontSize: '1.1rem' }}>Payment via:</h3>
                  <div className="payment-option" style={{ cursor: 'default' }}>
                    <CreditCard size={18} className="text-primary" />
                    <span>{paymentMethod === 'razorpay' ? 'Secure Online Payment' : 'Cash on Delivery'}</span>
                  </div>
                </div>

                <div className="mb-4 text-sm" style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
                  By placing this order, you agree to our <a href="/returns" target="_blank" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Return & Refund Policy</a>.
                </div>

                <div className="checkout-btn-row mt-5">
                  <button onClick={() => setStep(2)} className="btn btn-outline checkout-nav-btn">
                    Back to Payment
                  </button>
                  <button
                    onClick={createOrder}
                    disabled={loading}
                    className="btn btn-primary checkout-nav-btn"
                  >
                    {loading ? 'Processing...' : 'Complete Purchase'} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="cart-summary">
          <div className="card summary-card reveal active">
            <h3 className="summary-title mb-4">Order Summary</h3>

            <div className="summary-items-list mb-4">
              {cart.items.map(item => (
                <div key={item._id} className="summary-item d-flex justify-between mb-2" style={{ fontSize: '0.85rem' }}>
                  <span className="text-muted">
                    {item.product.name} ({item.variantSize}) x {item.quantity}
                  </span>
                  <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="summary-details">
              <div className="summary-row">
                <span className="text-muted">Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>

              {discount > 0 && (
                <div className="summary-row text-success">
                  <span>Discount Applied</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="summary-row">
                <span className="text-muted">Shipping Fee</span>
                <span className={shipping_charge === 0 ? 'text-success' : ''}>
                  {shipping_charge === 0 ? 'FREE' : formatPrice(shipping_charge)}
                </span>
              </div>

              <div className="divider my-4"></div>

              <div className="summary-row total-row" style={{ fontSize: '1.25rem' }}>
                <span>Total Amount</span>
                <span className="text-primary">{formatPrice(finalAmount)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-light rounded text-center" style={{ fontSize: '0.75rem', color: '#888', background: '#fcfaf9' }}>
              🛡️ Secure Checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
