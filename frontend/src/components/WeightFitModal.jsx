import { useState, useEffect } from 'react';
import { X, Ruler, Sparkles, Check, Scale } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './WeightFitModal.css';

// Helper function: Calculate recommended size based on weight (kg) & fit preference
export const calculateRecommendedSize = (weightKg, fitPref = 'Regular') => {
  const w = Number(weightKg);
  if (!w || isNaN(w) || w <= 0) return null;

  let baseSize = 'M';
  if (w <= 54) baseSize = 'S';
  else if (w <= 67) baseSize = 'M';
  else if (w <= 81) baseSize = 'L';
  else if (w <= 94) baseSize = 'XL';
  else baseSize = 'XXL';

  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  let idx = sizes.indexOf(baseSize);

  if (fitPref === 'Relaxed' && idx < sizes.length - 1) {
    idx = Math.min(sizes.length - 1, idx + 1);
  }
  return sizes[idx];
};

const WeightFitModal = ({ onClose, onSaveSuccess }) => {
  const { user, isAuth, updateUser } = useAuth();

  const [weight, setWeight] = useState(user?.weight || '');
  const [height, setHeight] = useState(user?.height || '');
  const [fitPreference, setFitPreference] = useState(user?.fitPreference || 'Regular');
  const [saving, setSaving] = useState(false);
  const [calculatedSize, setCalculatedSize] = useState(null);

  // Auto calculate when weight or fitPreference changes
  useEffect(() => {
    if (weight) {
      const rec = calculateRecommendedSize(weight, fitPreference);
      setCalculatedSize(rec);
    } else {
      setCalculatedSize(null);
    }
  }, [weight, fitPreference]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!weight) return;

    const recSize = calculateRecommendedSize(weight, fitPreference);
    setSaving(true);

    try {
      if (isAuth) {
        const payload = {
          weight: Number(weight),
          height: height ? Number(height) : null,
          preferredSize: recSize,
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
          recommendedSize: recSize,
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
              <span>Personalized fit calculator based on your weight</span>
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

          {/* Real-time Calculated Size Preview */}
          {calculatedSize && (
            <div className="wfit-recommendation-card">
              <Sparkles size={20} className="wfit-sparkle" />
              <div>
                <span className="wfit-card-label">Your Best Recommended Size</span>
                <h4 className="wfit-card-size">Size {calculatedSize}</h4>
                <p className="wfit-card-desc">
                  Based on your {weight}kg weight and {fitPreference} fit style.
                </p>
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
