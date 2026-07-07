import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './CustomizeSection.css';

const CustomizeSection = () => {
  const navigate = useNavigate();

  return (
    <section className="m-customize reveal-up">
      <div className="m-customize__inner container">
        
        {/* Left: Editorial copy */}
        <div className="m-customize__copy">
          <span className="m-label" style={{ color: 'var(--rose-gold-dark)' }}>Bespoke Atelier</span>
          <h2 className="m-section-title">Made to <em>Order</em></h2>
          <p className="m-customize__desc">
            Your vision, our craft. From premium fabrics to hand-finished details — 
            design a piece that is entirely, unapologetically yours.
          </p>

          <div className="m-customize__steps">
            <div className="m-customize__step">
              <span className="m-customize__step-num">01</span>
              <div>
                <h4 className="m-customize__step-title">Select Your Canvas</h4>
                <p className="m-customize__step-desc">Choose from tees, hoodies, oversized fits, or couple sets.</p>
              </div>
            </div>
            <div className="m-customize__step">
              <span className="m-customize__step-num">02</span>
              <div>
                <h4 className="m-customize__step-title">Personalise</h4>
                <p className="m-customize__step-desc">Pick your colour, print type, and upload your artwork or text.</p>
              </div>
            </div>
            <div className="m-customize__step">
              <span className="m-customize__step-num">03</span>
              <div>
                <h4 className="m-customize__step-title">Delivered to You</h4>
                <p className="m-customize__step-desc">Handcrafted with care and shipped to your doorstep.</p>
              </div>
            </div>
          </div>

          <button 
            className="m-customize__cta"
            onClick={() => navigate('/customisation')}
          >
            <span>Begin Your Design</span>
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </div>

        {/* Right: Editorial image */}
        <div className="m-customize__visual">
          <img 
            src="/home3.jpg" 
            alt="Custom crafted apparel" 
            className="m-customize__img"
            loading="lazy"
          />
        </div>

      </div>
    </section>
  );
};

export default CustomizeSection;
