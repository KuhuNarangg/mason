import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Palette, Ruler, PenTool, Send, CheckCircle, ArrowRight } from 'lucide-react';
import './Customization.css';

const fabricOptions = [
  { id: 'silk', name: 'Pure Silk', emoji: '✨', desc: 'Luxuriously smooth' },
  { id: 'cotton', name: 'Organic Cotton', emoji: '🌿', desc: 'Breathable comfort' },
  { id: 'linen', name: 'Linen', emoji: '🌾', desc: 'Effortlessly chic' },
  { id: 'velvet', name: 'Velvet', emoji: '🍷', desc: 'Rich & opulent' },
  { id: 'georgette', name: 'Georgette', emoji: '🦋', desc: 'Light & flowing' },
  { id: 'chiffon', name: 'Chiffon', emoji: '☁️', desc: 'Dreamy layers' },
];

const colorPalette = [
  { id: 'midnight', name: 'Midnight Blue', hex: '#1a1a4e' },
  { id: 'emerald', name: 'Emerald Green', hex: '#2d6a4f' },
  { id: 'champagne', name: 'Champagne', hex: '#f7e7ce' },
  { id: 'rose', name: 'Rose Gold', hex: '#b76e79' },
  { id: 'blush', name: 'Blush Pink', hex: '#f4c2c2' },
  { id: 'ivory', name: 'Ivory White', hex: '#fffff0' },
  { id: 'wine', name: 'Deep Wine', hex: '#722f37' },
  { id: 'lavender', name: 'Lavender', hex: '#b57edc' },
  { id: 'coral', name: 'Coral Sunset', hex: '#ff7f50' },
  { id: 'sage', name: 'Sage Green', hex: '#b2ac88' },
];

const Customization = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fabric: '',
    color: '',
    bust: '',
    waist: '',
    hips: '',
    length: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);

  // Floating emoji animation
  useEffect(() => {
    const emojis = ['✂️', '🧵', '✨', '💫', '🪡', '🎨', '💖', '🦋'];
    const interval = setInterval(() => {
      const newEmoji = {
        id: Date.now(),
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        left: Math.random() * 100,
        delay: Math.random() * 2,
      };
      setFloatingEmojis(prev => [...prev.slice(-12), newEmoji]);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { icon: <Palette size={20} />, label: 'Fabric & Color', emoji: '🎨' },
    { icon: <Ruler size={20} />, label: 'Measurements', emoji: '📐' },
    { icon: <PenTool size={20} />, label: 'Design Notes', emoji: '✏️' },
  ];

  const handleSubmit = async () => {
    if (!user) {
      navigate('/login?redirect=/customisation');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        fabric: formData.fabric,
        color: formData.color,
        measurements: {
          bust: formData.bust ? Number(formData.bust) : undefined,
          waist: formData.waist ? Number(formData.waist) : undefined,
          hips: formData.hips ? Number(formData.hips) : undefined,
          length: formData.length ? Number(formData.length) : undefined,
        },
        notes: formData.notes
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/customizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="cust-page">
        <div className="cust-success-screen">
          <div className="cust-success-confetti">
            {['🎉','✨','💖','🧵','✂️','🎊','💫','🌟'].map((e, i) => (
              <span key={i} className="cust-confetti-piece" style={{ '--i': i }}>{e}</span>
            ))}
          </div>
          <div className="cust-success-card">
            <CheckCircle size={64} className="cust-success-icon" />
            <h2>Your Vision is on Its Way! ✨</h2>
            <p>Our master tailors will review your bespoke request and reach out with a personalized quote within 24 hours.</p>
            <button className="cust-btn cust-btn--primary" onClick={() => { setSuccess(false); setCurrentStep(0); setFormData({ fabric: '', color: '', bust: '', waist: '', hips: '', length: '', notes: '' }); }}>
              Design Another Piece <Sparkles size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cust-page">
      {/* Floating background emojis */}
      <div className="cust-floating-bg" aria-hidden>
        {floatingEmojis.map(f => (
          <span key={f.id} className="cust-float-emoji" style={{ left: `${f.left}%`, animationDelay: `${f.delay}s` }}>
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Hero Header */}
      <header className="cust-hero">
        <div className="cust-hero__sparkle">✂️</div>
        <h1 className="cust-hero__title">
          Design Your <em>Dream</em> Outfit
        </h1>
        <p className="cust-hero__subtitle">
          Tell us what you imagine — we'll bring it to life, stitch by stitch.
        </p>
      </header>

      {/* Step Indicator */}
      <div className="cust-steps">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <button
              className={`cust-step ${currentStep === i ? 'cust-step--active' : ''} ${currentStep > i ? 'cust-step--done' : ''}`}
              onClick={() => i <= currentStep && setCurrentStep(i)}
            >
              <span className="cust-step__emoji">{s.emoji}</span>
              <span className="cust-step__label">{s.label}</span>
            </button>
            {i < steps.length - 1 && <div className={`cust-step__line ${currentStep > i ? 'cust-step__line--filled' : ''}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Form Body */}
      <div className="cust-form-area">

        {/* STEP 0: Fabric & Color */}
        {currentStep === 0 && (
          <div className="cust-card cust-card--animate">
            <h2 className="cust-card__title">
              Pick Your Fabric <span className="cust-bounce">🧵</span>
            </h2>
            <div className="cust-fabric-grid">
              {fabricOptions.map(fab => (
                <button
                  key={fab.id}
                  className={`cust-fabric-chip ${formData.fabric === fab.id ? 'cust-fabric-chip--selected' : ''}`}
                  onClick={() => setFormData({ ...formData, fabric: fab.id })}
                >
                  <span className="cust-fabric-chip__emoji">{fab.emoji}</span>
                  <span className="cust-fabric-chip__name">{fab.name}</span>
                  <span className="cust-fabric-chip__desc">{fab.desc}</span>
                </button>
              ))}
            </div>

            <h2 className="cust-card__title" style={{ marginTop: '2rem' }}>
              Choose Your Color <span className="cust-bounce">🎨</span>
            </h2>
            <div className="cust-color-grid">
              {colorPalette.map(c => (
                <button
                  key={c.id}
                  className={`cust-color-swatch ${formData.color === c.name ? 'cust-color-swatch--selected' : ''}`}
                  style={{ '--swatch-color': c.hex }}
                  onClick={() => setFormData({ ...formData, color: c.name })}
                  title={c.name}
                >
                  <span className="cust-color-swatch__inner" />
                  <span className="cust-color-swatch__name">{c.name}</span>
                </button>
              ))}
            </div>

            <div className="cust-nav-row">
              <div />
              <button
                className="cust-btn cust-btn--primary"
                disabled={!formData.fabric || !formData.color}
                onClick={() => setCurrentStep(1)}
              >
                Next: Measurements <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Measurements */}
        {currentStep === 1 && (
          <div className="cust-card cust-card--animate">
            <h2 className="cust-card__title">
              Your Measurements <span className="cust-bounce">📐</span>
            </h2>
            <p className="cust-card__hint">All measurements in inches. Leave blank if unsure — we'll help!</p>

            <div className="cust-measure-grid">
              {[
                { key: 'bust', label: 'Bust', emoji: '👗', placeholder: 'e.g. 34' },
                { key: 'waist', label: 'Waist', emoji: '📏', placeholder: 'e.g. 28' },
                { key: 'hips', label: 'Hips', emoji: '💃', placeholder: 'e.g. 38' },
                { key: 'length', label: 'Length', emoji: '📐', placeholder: 'e.g. 50' },
              ].map(m => (
                <div key={m.key} className="cust-measure-card">
                  <span className="cust-measure-card__emoji">{m.emoji}</span>
                  <label className="cust-measure-card__label">{m.label}</label>
                  <input
                    type="number"
                    className="cust-measure-card__input"
                    placeholder={m.placeholder}
                    value={formData[m.key]}
                    onChange={e => setFormData({ ...formData, [m.key]: e.target.value })}
                  />
                  <span className="cust-measure-card__unit">inches</span>
                </div>
              ))}
            </div>

            <div className="cust-nav-row">
              <button className="cust-btn cust-btn--outline" onClick={() => setCurrentStep(0)}>← Back</button>
              <button className="cust-btn cust-btn--primary" onClick={() => setCurrentStep(2)}>
                Next: Design Notes <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Notes */}
        {currentStep === 2 && (
          <div className="cust-card cust-card--animate">
            <h2 className="cust-card__title">
              Tell Us Your Vision <span className="cust-bounce">✏️</span>
            </h2>
            <p className="cust-card__hint">Describe the silhouette, sleeve style, neckline — anything you dream of!</p>

            <div className="cust-notes-wrap">
              <textarea
                className="cust-notes-textarea"
                rows="8"
                placeholder="I'd love a flowy A-line dress with flutter sleeves, a sweetheart neckline, and maybe some delicate embroidery along the hem... ✨"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
              <div className="cust-notes-doodles" aria-hidden>
                <span>✨</span><span>🧵</span><span>💫</span>
              </div>
            </div>

            {/* Summary Preview */}
            <div className="cust-summary">
              <h3>Your Selection ✨</h3>
              <div className="cust-summary__chips">
                {formData.fabric && <span className="cust-summary-chip">🧵 {fabricOptions.find(f => f.id === formData.fabric)?.name}</span>}
                {formData.color && <span className="cust-summary-chip">🎨 {formData.color}</span>}
                {formData.bust && <span className="cust-summary-chip">Bust: {formData.bust}"</span>}
                {formData.waist && <span className="cust-summary-chip">Waist: {formData.waist}"</span>}
                {formData.hips && <span className="cust-summary-chip">Hips: {formData.hips}"</span>}
                {formData.length && <span className="cust-summary-chip">Length: {formData.length}"</span>}
              </div>
            </div>

            <div className="cust-nav-row">
              <button className="cust-btn cust-btn--outline" onClick={() => setCurrentStep(1)}>← Back</button>
              <button
                className="cust-btn cust-btn--submit"
                disabled={loading || !formData.fabric || !formData.color}
                onClick={handleSubmit}
              >
                {loading ? (
                  <span className="cust-spinner" />
                ) : (
                  <>Submit My Design <Send size={16} /></>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customization;
