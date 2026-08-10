import { useState, useEffect } from 'react';
import { X, Ruler, Sparkles, Scale } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './WeightFitModal.css';

// Check if product is Bottomwear / Lowerwear
export const isBottomwearType = (productOrType) => {
  const typeStr = typeof productOrType === 'string'
    ? productOrType.toLowerCase()
    : `${productOrType?.type || ''} ${productOrType?.category || ''} ${productOrType?.name || ''}`.toLowerCase();

  const bottomwearKeywords = [
    'trouser', 'trousers', 'pant', 'pants', 'jeans', 'skirt', 'skirts', 
    'shorts', 'bottom', 'bottoms', 'lehenga', 'lehengas', 'churidar', 'palazzo', 'salwar'
  ];
  return bottomwearKeywords.some(kw => typeStr.includes(kw));
};

// Differentiated size calculator for Upperwear (Tops/Dresses) vs Lowerwear (Bottomwear)
export const calculateRecommendedSize = (weightKg, fitPref = 'Regular', productOrType = 'top') => {
  const w = Number(weightKg);
  if (!w || isNaN(w) || w <= 0) return null;

  const isBottom = isBottomwearType(productOrType);

  let baseSize = 'M';
  if (isBottom) {
    // Lowerwear / Bottomwear weight scale (calibrated for waist/hip fit)
    if (w <= 52) baseSize = 'S';
    else if (w <= 65) baseSize = 'M';
    else if (w <= 78) baseSize = 'L';
    else if (w <= 91) baseSize = 'XL';
    else baseSize = 'XXL';
  } else {
    // Upperwear / Tops / Dresses weight scale (calibrated for bust/chest fit)
    if (w <= 54) baseSize = 'S';
    else if (w <= 67) baseSize = 'M';
    else if (w <= 81) baseSize = 'L';
    else if (w <= 94) baseSize = 'XL';
    else baseSize = 'XXL';
  }

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  let idx = sizes.indexOf(baseSize);

  if (fitPref === 'Relaxed' && idx < sizes.length - 1) {
    idx = Math.min(sizes.length - 1, idx + 1);
  }
  return sizes[idx];
};

const WeightFitModal = ({ onClose, onSaveSuccess, currentProduct }) => {
  const { user, isAuth, updateUser } = useAuth();

  const [weight, setWeight] = useState(user?.weight || '');
  const [height, setHeight] = useState(user?.height || '');
  const [fitPreference, setFitPreference] = useState(user?.fitPreference || 'Regular');
  const [saving, setSaving] = useState(false);
  const [topSize, setTopSize] = useState(null);
  const [bottomSize, setBottomSize] = useState(null);

  // Auto calculate when weight or fitPreference changes
  useEffect(() => {
    if (weight) {
      const topRec = calculateRecommendedSize(weight, fitPreference, 'top');
      const bottomRec = calculateRecommendedSize(weight, fitPreference, 'trouser');
      setTopSize(topRec);
      setBottomSize(bottomRec);
    } else {
      setTopSize(null);
      setBottomSize(null);
    }
  }, [weight, fitPreference]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!weight) return;

    const currentRecSize = calculateRecommendedSize(weight, fitPreference, currentProduct || 'top');
    setSaving(true);

    try {
      if (isAuth) {
        const payload = {
          weight: Number(weight),
          height: height ? Number(height) : null,
          preferredSize: currentRecSize,
          fitPreference: fitPreference
        };
        const res = await api.put('/auth/profile', payload);
        if (res.data.success && updateUser) {
          updateUser(res.data.user);
        }
      }

      if (onSaveSuccess) {
        onSaveSuccess({
          weight: Number(weight),
          height: height ? Number(height) : null,
          recommendedSize: currentRecSize,
          topSize,
          bottomSize,
          fitPreference
        });
      }

      onClose();
    } catch (err) {
      console.error("Error saving fit profile:", err);
      alert("Failed to save size profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wfit-backdrop" onClick={onClose}>
      <div className="wfit-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="wfit-header">
          <div className="wfit-header-title">
            <Ruler size={22} className="wfit-ruler-icon" />
            <div>
              <h3>Find Your Recommended Size</h3>
              <span>Upperwear & Lowerwear size recommendations based on weight</span>
            </div>
          </div>
          <button className="wfit-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="wfit-form">
          <div className="wfit-field-group">
            <label>
              <Scale size={16} /> Your Weight (in kg) *
            </label>
            <input
              type="number"
              min="20"
              max="200"
              required
              placeholder="e.g. 68"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className="wfit-field-group">
            <label>Your Height (in cm) — Optional</label>
            <input
              type="number"
              min="100"
              max="230"
              placeholder="e.g. 172"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
          </div>

          <div className="wfit-field-group">
            <label>Fit Preference</label>
            <div className="wfit-fit-pills">
              {['Slim', 'Regular', 'Relaxed'].map((fit) => (
                <button
                  type="button"
                  key={fit}
                  className={`wfit-fit-pill ${fitPreference === fit ? 'active' : ''}`}
                  onClick={() => setFitPreference(fit)}
                >
                  {fit}
                </button>
              ))}
            </div>
          </div>

          {/* Differentiated Upperwear vs Lowerwear Size Card */}
          {topSize && bottomSize && (
            <div className="wfit-dual-card">
              <div className="wfit-card-section">
                <span className="wfit-card-label">Tops & Dresses</span>
                <h4 className="wfit-card-size">Size {topSize}</h4>
              </div>
              <div className="wfit-card-divider" />
              <div className="wfit-card-section">
                <span className="wfit-card-label">Bottomwear / Skirts / Pants</span>
                <h4 className="wfit-card-size">Size {bottomSize}</h4>
              </div>
            </div>
          )}

          {/* Footer Action */}
          <div className="wfit-footer">
            <button type="button" className="wfit-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="wfit-save-btn" 
              disabled={!weight || saving}
            >
              {saving ? 'Saving...' : (isAuth ? 'Save to My Profile & Select Size' : 'Apply Recommended Size')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WeightFitModal;
