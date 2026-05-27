import { Link } from 'react-router-dom';
import './policies/PolicyPage.css';

const About = () => {
  return (
    <div className="policy-page container">
      <div className="policy-hero">
        <span className="policy-label">The House of Mason</span>
        <h1 className="policy-title">Discover Our <em>Story</em></h1>
        <p className="policy-subtitle">
          Born from a passion for feminine elegance, Mason is where artistry meets wearability.
        </p>
      </div>

      <div className="policy-content" style={{ maxWidth: '800px', margin: '0 auto' }}>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)' }}>
            Who We Are
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9, marginBottom: '1rem' }}>
            Mason is a premium women's wear brand built on the belief that every woman deserves to feel extraordinary — not just on special occasions, but every single day. We design clothes that celebrate the art of femininity: silhouettes that flatter, fabrics that feel luxurious, and details that whisper craftsmanship.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
            We are not fast fashion. We are the opposite — considered, curated, and created to last.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)' }}>
            Our Philosophy
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9, marginBottom: '1rem' }}>
            We believe luxury is a feeling, not a price tag. That's why every Mason piece — from our flowing evening dresses to our heritage ethnic sets — is meticulously constructed with premium-grade fabrics, thoughtful cuts, and an obsessive attention to finishing.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.9 }}>
            Our collections draw from the rich vocabulary of Indian artistry while speaking the language of modern womanhood. We make pieces that belong equally at a rooftop celebration and a quiet evening in.
          </p>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, marginBottom: '1rem', color: 'var(--ink)' }}>
            Our Promise
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
            {[
              { icon: '✦', title: 'Premium Fabrics', desc: 'Only materials that feel as good as they look.' },
              { icon: '✦', title: 'Inclusive Sizing', desc: 'Silhouettes designed for real bodies, every shape.' },
              { icon: '✦', title: 'Ethical Production', desc: 'Made with care for the people who make it.' },
              { icon: '✦', title: 'Easy Returns', desc: '14-day hassle-free return policy on all items.' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '1.5rem', background: 'var(--cream)', borderRadius: '4px' }}>
                <div style={{ color: 'var(--rose-gold)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, marginBottom: '0.5rem', fontSize: '1rem' }}>{item.title}</h4>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section style={{ textAlign: 'center', padding: '3rem 0', borderTop: '1px solid var(--champagne)' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, marginBottom: '1rem' }}>
            Ready to explore?
          </h2>
          <p style={{ color: 'var(--text-tertiary)', marginBottom: '2rem' }}>
            Browse our latest collections and find the piece that speaks to you.
          </p>
          <Link to="/category/women" className="btn btn-primary">
            Shop The Collection
          </Link>
        </section>

      </div>
    </div>
  );
};

export default About;
