import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/SEO';

const CustomizationProcess = () => {
  return (
    <div className="policy-page fade-in">
      <SEO 
        title="Our Customization Process"
        description="Learn about our bespoke customization process. From fabric selection to final fitting, discover how we bring your unique fashion vision to life."
        url="/customization-process"
      />
      <div className="container policy-container">
        <h1 className="policy-title">Our Customization Process</h1>
        <div className="policy-content">
          <p className="lead" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
            At Owl Stitch by Mason, we believe that true luxury lies in personalization. Our customization process is designed to turn your fashion dreams into reality through a seamless, collaborative journey.
          </p>

          <h3 style={{ marginTop: '2rem', borderBottom: '1px solid var(--champagne)', paddingBottom: '0.5rem' }}>1. The Consultation</h3>
          <p>
            It begins with a conversation. Share your inspiration, preferred silhouettes, and the occasion. Whether you are looking for a bespoke bridal outfit or a personalized daily wear piece, our styling experts work closely with you to understand your aesthetic.
          </p>

          <h3 style={{ marginTop: '2rem', borderBottom: '1px solid var(--champagne)', paddingBottom: '0.5rem' }}>2. Design & Fabric Selection</h3>
          <p>
            Once the concept is clear, we move to the canvas. You can select from our premium curated range of sustainable cottons, luxurious silks, and traditional handlooms. We guide you through color palettes, embroidery options, and print placements to ensure every detail reflects your personality.
          </p>

          <h3 style={{ marginTop: '2rem', borderBottom: '1px solid var(--champagne)', paddingBottom: '0.5rem' }}>3. Measurement & Tailoring</h3>
          <p>
            A perfect fit is non-negotiable. You provide your measurements using our guided sizing chart. Our master tailors then craft your garment with precision, applying generations of sartorial expertise. Every seam, hem, and stitch is executed with meticulous care.
          </p>

          <h3 style={{ marginTop: '2rem', borderBottom: '1px solid var(--champagne)', paddingBottom: '0.5rem' }}>4. Quality Check & Delivery</h3>
          <p>
            Before your custom piece leaves our studio, it undergoes a rigorous quality assurance check. We ensure the fabric, fit, and finish meet the highest standards of the House of Mason. Finally, the garment is carefully packaged and shipped securely to your doorstep.
          </p>

          <div style={{ marginTop: '3rem', textAlign: 'center', padding: '2rem', background: 'var(--champagne-light)', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '1rem' }}>Ready to create something unique?</h4>
            <Link to="/customisation" className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>Start Customizing</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationProcess;
