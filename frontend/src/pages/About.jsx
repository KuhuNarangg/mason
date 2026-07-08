import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { generateOrganizationSchema } from '../utils/schema';
import './About.css';

const About = () => {
  useEffect(() => {
    // Reveal up animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.reveal-up');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page">
      <SEO 
        title="About Us"
        description="Learn more about Owl Stitch by Mason. We are a premium women's wear brand built on the belief that every woman deserves to feel extraordinary."
        url="/about"
        type="website"
        schema={generateOrganizationSchema()}
      />
      
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-content reveal-up">
          <span className="about-label">The House of Mason</span>
          <h1 className="about-title">
            The Art of <em>Elegance</em>
          </h1>
          <p className="about-subtitle">
            Born from a passion for feminine allure, Mason is where artistry meets wearability. We craft pieces that celebrate you.
          </p>
        </div>
        <div className="about-hero-image-wrapper reveal-up" style={{ transitionDelay: '0.2s' }}>
          <img 
            src="/about-hero.png" 
            alt="Elegant woman in silk dress" 
            className="about-hero-img" 
          />
        </div>
      </section>

      {/* Story Section */}
      <section className="about-story container">
        <div className="about-story-img-wrapper reveal-up">
          <img 
            src="/about-detail.png" 
            alt="Premium silk fabric macro shot" 
            className="about-story-img" 
          />
        </div>
        <div className="about-story-content reveal-up" style={{ transitionDelay: '0.2s' }}>
          <h2 className="about-section-title">Who We Are</h2>
          <p className="about-text">
            Mason is a premium women's wear brand built on the belief that every woman deserves to feel extraordinary — not just on special occasions, but every single day. We design clothes that celebrate the art of femininity: silhouettes that flatter, fabrics that feel luxurious, and details that whisper craftsmanship.
          </p>
          <p className="about-text">
            We are not fast fashion. We are the opposite — considered, curated, and created to last. Each collection is a testament to timeless elegance, designed to empower the modern woman.
          </p>
        </div>
      </section>

      {/* Brand Video Section */}
      <section className="about-video-section reveal-up">
        <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <h2 className="about-section-title">The Craftsmanship</h2>
          <p className="about-text" style={{ maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            Witness the meticulous attention to detail and the quiet elegance woven into every piece of our collection.
          </p>
          <div style={{ position: 'relative', width: '100%', maxWidth: '900px', margin: '0 auto', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <video 
              src="/hero-video.mp4" 
              autoPlay 
              loop 
              muted 
              playsInline 
              style={{ width: '100%', display: 'block', objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* Philosophy Banner */}
      <section className="about-philosophy reveal-up">
        <h2 className="about-philosophy-quote">
          “We believe luxury is a <em>feeling</em>, not a price tag.”
        </h2>
        <p className="about-text" style={{ maxWidth: '600px', margin: '0 auto' }}>
          Our collections draw from the rich vocabulary of modern artistry while speaking the language of classic womanhood. We make pieces that belong equally at a rooftop celebration and a quiet evening in.
        </p>
      </section>

      {/* Promises Grid */}
      <section className="about-promises-section container">
        <div className="text-center reveal-up">
          <h2 className="about-section-title" style={{ display: 'inline-block', margin: '0 auto' }}>Our Promise</h2>
        </div>
        
        <div className="about-promises-grid">
          {[
            { icon: '✦', title: 'Premium Fabrics', desc: 'Only materials that feel as good as they look, sourced from ethical suppliers globally.' },
            { icon: '✂', title: 'Impeccable Fit', desc: 'Silhouettes designed and tailored for real bodies, celebrating every shape with grace.' },
            { icon: '♥', title: 'Ethical Production', desc: 'Made with absolute care, respect, and fair wages for the talented artisans who craft them.' },
            { icon: '⟲', title: 'Hassle-Free Returns', desc: 'Enjoy a seamless 14-day return window because your confidence is our priority.' },
          ].map((item, i) => (
            <div key={i} className="promise-card reveal-up" style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="promise-icon">{item.icon}</div>
              <h4 className="promise-title">{item.title}</h4>
              <p className="promise-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="about-cta reveal-up">
        <h2>Ready to explore?</h2>
        <p>Browse our latest collections and find the piece that speaks to you.</p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
          <a href="https://www.instagram.com/owlstitchofficial?igsh=ZjgyeHZ0ajdxN2tr&utm_source=qr" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: 'var(--ink)', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          </a>
          <a href="https://www.facebook.com/share/1BiAuAZoDx/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: 'var(--ink)', transition: 'transform 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
        </div>
        <Link to="/category/women" className="btn btn-primary">
          Shop The Collection
        </Link>
      </section>

    </div>
  );
};

export default About;
