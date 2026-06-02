import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CustomizeSection.css';

const CustomizeSection = () => {
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState('champagne');
  const [selectedStyle, setSelectedStyle] = useState('minimalist');

  const colors = [
    { id: 'champagne', name: 'Champagne', hex: '#F7E7CE' },
    { id: 'rose-gold', name: 'Rose Gold', hex: '#B76E79' },
    { id: 'midnight', name: 'Midnight Blue', hex: '#191970' },
    { id: 'emerald', name: 'Emerald', hex: '#50C878' }
  ];

  const styles = [
    { id: 'minimalist', name: 'Minimalist' },
    { id: 'avant-garde', name: 'Avant-Garde' },
    { id: 'classic', name: 'Classic Elegance' }
  ];

  return (
    <section id="customize" className="m-customize reveal-up">
      <div className="container">
        <div className="m-customize__inner">
          <div className="m-customize__content">
            <span className="m-label">Bespoke By Mason</span>
            <h2 className="m-section-title" style={{ marginBottom: '1.5rem' }}>Want to <em>Customize</em> Your Design?</h2>
            <p className="m-customize__desc">
              Every woman is unique, and your wardrobe should reflect that. Personalize our silhouettes with your preferred colors, fabrics, and styling details. Experience true luxury tailored just for you.
            </p>
            
            <div className="m-customize__options">
              <div className="m-customize__group">
                <span className="m-customize__group-title">Select Color Palette</span>
                <div className="m-customize__colors">
                  {colors.map(color => (
                    <button
                      key={color.id}
                      className={`m-color-btn ${selectedColor === color.id ? 'active' : ''}`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => setSelectedColor(color.id)}
                      title={color.name}
                      aria-label={`Select ${color.name}`}
                    />
                  ))}
                </div>
              </div>

              <div className="m-customize__group">
                <span className="m-customize__group-title">Select Design Style</span>
                <div className="m-customize__styles">
                  {styles.map(style => (
                    <button
                      key={style.id}
                      className={`m-style-btn ${selectedStyle === style.id ? 'active' : ''}`}
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary m-customize__cta"
              onClick={() => navigate('/customisation')}
            >
              Request Custom Design
            </button>
          </div>
          
          <div className="m-customize__image-wrap">
            <div className={`m-customize__preview-box color-${selectedColor}`}>
              <div className="m-customize__preview-text">
                Your bespoke creation in {colors.find(c => c.id === selectedColor)?.name} 
                <br/> 
                <em>{styles.find(s => s.id === selectedStyle)?.name}</em>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomizeSection;
