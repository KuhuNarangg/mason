import { useNavigate } from 'react-router-dom';
import { Shirt, Palette, Sparkles, ArrowRight } from 'lucide-react';
import './CustomizeSection.css';

const CustomizeSection = () => {
  const navigate = useNavigate();

  return (
    <section id="customize" className="m-customize reveal-up" style={{ padding: 'var(--space-16) 0', background: 'var(--blush-light)' }}>
      <div className="container">
        <div className="text-center mb-5">
          <span className="m-label" style={{ color: 'var(--rose-gold-dark)' }}>Custom Apparel</span>
          <h2 className="m-section-title">Design Your <em>Vibe</em></h2>
          <p className="m-customize__desc" style={{ maxWidth: '600px', margin: '1rem auto' }}>
            Express yourself with our new interactive custom design flow. Whether it's a couple's collection, a Gen Z quote, or your own artwork — we bring your vision to life on premium fabrics.
          </p>
        </div>

        <div className="d-flex flex-col md:flex-row gap-4 mb-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'center' }}>
          <div className="p-4" style={{ background: 'white', borderRadius: '12px', padding: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--blush)', borderRadius: '50%', color: 'var(--rose-gold-dark)', marginBottom: '1rem' }}>
              <Shirt size={32} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>1. Choose Product</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select from Premium T-Shirts, Hoodies, Oversized fits, or Couple Sets.</p>
          </div>

          <div className="p-4" style={{ background: 'white', borderRadius: '12px', padding: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--blush)', borderRadius: '50%', color: 'var(--rose-gold-dark)', marginBottom: '1rem' }}>
              <Palette size={32} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>2. Customize</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Pick your color, print type (DTF, Embroidery), and upload your design or quote.</p>
          </div>

          <div className="p-4" style={{ background: 'white', borderRadius: '12px', padding: '2rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--blush)', borderRadius: '50%', color: 'var(--rose-gold-dark)', marginBottom: '1rem' }}>
              <Sparkles size={32} strokeWidth={1.5} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>3. Wear It</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>We craft it with care and deliver your bespoke apparel straight to your door.</p>
          </div>
        </div>

        <div className="text-center">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/customisation')}
            style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}
          >
            Start Designing <ArrowRight size={18} className="ms-2" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CustomizeSection;
