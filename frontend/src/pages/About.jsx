import { useEffect } from 'react';
import { Link } from 'react-router-dom';
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
        <Link to="/category/women" className="btn btn-primary">
          Shop The Collection
        </Link>
      </section>

    </div>
  );
};

export default About;
