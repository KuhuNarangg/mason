import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Volume2, VolumeX } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import CustomizeSection from '../components/CustomizeSection';
import ShopByCategoriesSection from '../components/ShopByCategoriesSection';
import SEO from '../components/SEO';
import { generateOrganizationSchema, generateWebSiteSchema } from '../utils/schema';
import './Home.css';

const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [cinematicMedia, setCinematicMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentHero, setCurrentHero] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);
  const bgVideoRef = useRef(null);
  const featureSectionRef = useRef(null);

  const toggleAudio = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (videoRef.current) {
      const nextMuted = !videoRef.current.muted;
      videoRef.current.muted = nextMuted;
      setIsMuted(nextMuted);
      if (!nextMuted) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
    }
  };

  const togglePlay = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
        if (bgVideoRef.current) bgVideoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
        if (bgVideoRef.current) bgVideoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Scroll & Mount Autoplay Observer for Main Character Video
  useEffect(() => {
    const playVideos = () => {
      if (videoRef.current) {
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {});
      }
      if (bgVideoRef.current) {
        bgVideoRef.current.play().catch(() => {});
      }
    };

    // Attempt immediate play on mount
    playVideos();

    if (!featureSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playVideos();
          } else {
            if (videoRef.current) videoRef.current.pause();
            if (bgVideoRef.current) bgVideoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(featureSectionRef.current);
    return () => observer.disconnect();
  }, []);

  const heroImages = [
    '/hero1.jpg',
    '/hero2.jpg',
    '/hero3.jpg',
    '/hero4.jpg',
    '/hero5.jpg'
  ];

  // Preload Hero Images
  useEffect(() => {
    heroImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [featRes, trendRes, newRes, mediaRes] = await Promise.allSettled([
          api.get('/products?featured=true&limit=8'),
          api.get('/products?trending=true&limit=8'),
          api.get('/products?sort=newest&limit=8'),
          api.get('/homemedia')
        ]);

        if (featRes.status === 'fulfilled') setFeatured(featRes.value.data.products);
        if (trendRes.status === 'fulfilled') setTrending(trendRes.value.data.products);
        if (newRes.status === 'fulfilled') setNewArrivals(newRes.value.data.products);
        if (mediaRes.status === 'fulfilled') setCinematicMedia(mediaRes.value.data.media || []);
      } catch (err) {
        console.error('Failed to fetch home data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Hero Slider Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroImages.length);
    }, 6000); // 6 second slow fade
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Intersection observer for scroll reveals
  useEffect(() => {
    let observer;
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05 }
      );
      document.querySelectorAll('.reveal-up:not(.in-view)').forEach(el => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [loading]);

  const reviews = [
    { name: 'Priya S.', text: 'I ordered the Midnight Velvet Gown for my engagement party in Delhi, and the silhouette, the fabric, the elegance—everything is completely unmatched. Mason has elevated my entire wardrobe. The fit was perfect right out of the box.', label: 'Verified Buyer • New Delhi • Purchased Midnight Velvet Gown' },
    { name: 'Ananya M.', text: 'I felt like an absolute goddess wearing their evening gown. The craftsmanship is true luxury without the absurd price tag.', label: 'Verified Buyer' },
    { name: 'Rhea K.', text: 'Every piece tells a story of heritage and modern femininity. A breathtaking collection.', label: 'Verified Buyer' }
  ];

  return (
    <div className="m-home">
      <SEO 
        title="Custom Tailoring & Heritage Ethnic Wear | Owl Stitch by Mason" 
        description="Discover premium custom tailoring, heritage ethnic outfits, and modern women's wear at Owl Stitch by Mason. Shop handcrafted dresses and custom designs." 
        url="/" 
        schema={[generateOrganizationSchema(), generateWebSiteSchema()]} 
      />
      
      {/* 1. CINEMATIC HERO SLIDER */}
      <section className="m-hero">
        {heroImages.map((src, index) => {
          const isPrev = index === (currentHero === 0 ? heroImages.length - 1 : currentHero - 1);
          let className = "m-hero__slide";
          if (index === currentHero) className += " active";
          if (isPrev) className += " prev";

          return (
            <div 
              key={index} 
              className={className}
              style={{ backgroundImage: `url(${src})` }}
            />
          );
        })}
        
        <div className="m-hero__overlay" />

        <div className="container h-100 d-flex flex-col justify-center align-center">
          <div className="m-hero__content">
            <h1 className="m-hero__title">
              <span className="m-hero__line">The Art of</span>
              <span className="m-hero__line m-hero__line--italic"><em>Femininity</em></span>
            </h1>

            <div className="m-hero__info">
              <Link to="/category/women" className="m-hero__cta">
                Shop The Collection
              </Link>
            </div>
          </div>
        </div>

        <div className="m-hero__indicators">
          {heroImages.map((_, index) => (
            <button 
              key={index} 
              className={`m-hero__dot ${index === currentHero ? 'active' : ''}`}
              onClick={() => setCurrentHero(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* 1.5 MAIN CHARACTER FEATURE SECTION (Video + Editorial Text Side-by-Side) */}
      <section className="m-reddress-feature" ref={featureSectionRef}>
        <div className="container">
          <div className="m-reddress-feature__grid">
            {/* Video Side (Full Un-cropped Video - Guaranteed Autoplay + Sound & Play Controls) */}
            <div className="m-reddress-feature__video-wrap reveal-up" onClick={togglePlay}>
              <video 
                ref={(el) => {
                  if (el) {
                    el.muted = true;
                    el.defaultMuted = true;
                    bgVideoRef.current = el;
                  }
                }}
                src="/reddress.mp4" 
                autoPlay 
                loop 
                muted
                defaultMuted
                playsInline 
                webkit-playsinline="true"
                disablePictureInPicture
                disableRemotePlayback
                className="m-reddress-feature__video-bg"
              />
              <video 
                ref={(el) => {
                  if (el) {
                    el.muted = isMuted;
                    el.defaultMuted = isMuted;
                    videoRef.current = el;
                  }
                }}
                src="/reddress.mp4" 
                autoPlay 
                loop 
                muted={isMuted}
                defaultMuted={isMuted}
                playsInline 
                webkit-playsinline="true"
                disablePictureInPicture
                disableRemotePlayback
                className="m-reddress-feature__video-fg"
              />
              <div className="m-reddress-feature__video-badge">The Mason Experience</div>

              <div className="m-reddress-feature__controls-row">
                <button 
                  type="button" 
                  className="m-reddress-feature__control-btn" 
                  onClick={toggleAudio}
                  aria-label={isMuted ? "Unmute Sound" : "Mute Sound"}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isMuted ? 'Unmute' : 'Sound On'}</span>
                </button>
              </div>
            </div>

            {/* Editorial Text Side */}
            <div className="m-reddress-feature__content reveal-up" style={{ transitionDelay: '0.2s' }}>
              <span className="m-label">The Mason Experience</span>
              <h2 className="m-section-title m-reddress-title">
                Be The <em>Main Character</em>
              </h2>
              <p className="m-reddress-feature__desc">
                At Mason, every design is created with one purpose — to make you feel like the main character of your story. Whether it’s your birthday celebration, engagement, anniversary, or a memorable night out, step into the room with effortless allure.
              </p>
              <p className="m-reddress-feature__short-desc">
                Statement designs created to make you feel like the main character of your story.
              </p>

              <div className="m-reddress-feature__highlights">
                <div className="m-reddress-feature__highlight">
                  <div>
                    <strong>Birthday & Event Spotlight</strong>
                    <p>Head-turning statement outfits designed for your most unforgettable milestones.</p>
                  </div>
                </div>
                <div className="m-reddress-feature__highlight">
                  <div>
                    <strong>Custom Tailored To You</strong>
                    <p>Bespoke sizing and made-to-measure tailoring crafted by our master artisans.</p>
                  </div>
                </div>
              </div>

              <div className="m-reddress-feature__actions">
                <Link to="/category/women" className="btn btn-primary">
                  Shop Main Character Edits
                </Link>
                <Link to="/custom-tailoring" className="btn btn-outline">
                  Customize Your Outfit
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- DESKTOP ONLY SECTIONS --- */}
      <div className="desktop-only-sections">
        {/* SHOP BY CATEGORIES SECTION (Before New Arrivals) */}
        <ShopByCategoriesSection />

        {/* 2. NEW ARRIVALS (Horizontal Scroll) */}
        <section className="m-new-arrivals">
          <div className="container m-new-arrivals__header reveal-up">
            <div>
              <span className="m-label">Just In</span>
              <h2 className="m-section-title">New <em>Arrivals</em></h2>
            </div>
            <Link to="/category/all?sort=newest" className="m-nav-link-cta">
              View All <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>

          <div className="m-new-arrivals__scroll">
            <div className="m-new-arrivals__track">
              {loading ? (
                <div className="m-loading-state"><div className="spinner" /></div>
              ) : newArrivals.length > 0 ? (
                newArrivals.map((product, i) => (
                  <div key={product._id} className="m-new-arrivals__item reveal-up" style={{ transitionDelay: `${i * 0.05}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))
              ) : (
                <div className="m-empty-state">New products coming soon.</div>
              )}
            </div>
          </div>
          <div className="m-new-arrivals__drag-hint">← Swipe to explore →</div>
        </section>

        {/* 3. CURATED COLLECTIONS (Custom Tailoring & Heritage Wear) */}
        <section className="m-collections container">
          <div className="m-collections__grid">
            <div className="m-col-text reveal-up">
              <h2 className="m-section-title">Custom <em>Tailoring</em> & Heritage Wear</h2>
              <p className="m-col-text__desc">Discover our signature edits by Mason, designed to empower and inspire. From breathtaking evening wear to timeless heritage pieces, find the silhouette that speaks to your soul.</p>
              <Link to="/category/all" className="btn-ghost">Explore All Collections</Link>
            </div>

            <Link to="/category/all?type=party-wear" className="m-col-card m-col-card--large reveal-up">
              <img src="/home1.jpg" alt="Evening Glamour" className="m-col-card__img" loading="lazy" />
              <div className="m-col-card__overlay">
                <span className="m-col-card__label">The Evening Edit</span>
                <h3 className="m-col-card__title">Midnight <em>Glamour</em></h3>
              </div>
            </Link>

            <Link to="/category/all?type=ethnic" className="m-col-card m-col-card--small reveal-up" style={{ transitionDelay: '0.2s' }}>
              <img src="/home2.jpg" alt="Heritage Romance" className="m-col-card__img" loading="lazy" />
              <div className="m-col-card__overlay">
                <span className="m-col-card__label">The Heritage Edit</span>
                <h3 className="m-col-card__title">Modern <em>Romance</em></h3>
              </div>
            </Link>
          </div>
        </section>

        {/* 4. EXPERIENCE LUXURY (Discover Our Story) */}
        <section className="m-experience">
          <div className="m-experience__grid">
            <div className="m-experience__img-wrap reveal-up">
              <img src="/home3.jpg" alt="Experience Luxury" className="m-experience__img" loading="lazy" />
            </div>
            <div className="m-experience__content reveal-up" style={{ transitionDelay: '0.2s' }}>
              <span className="m-label">The House of Mason</span>
              <h2 className="m-section-title">Uncompromising <em>Quality</em></h2>
              <p>We believe luxury is a feeling, not just a price tag. Every piece in our collection is meticulously crafted with premium fabrics, figure-flattering cuts, and an obsessive attention to detail.</p>
              <p>Designed to make you feel like the most beautiful woman in the room.</p>
              <Link to="/about" className="btn btn-outline" style={{ marginTop: '2rem' }}>Discover Our Story</Link>
            </div>
          </div>
        </section>

        {/* 4.5. THE MASON CINEMATIC EXPERIENCE */}
        {(loading || cinematicMedia.length > 0) && (
          <section className="m-cinematic" style={{ padding: '4rem 0', background: '#0a0a0a', color: '#fff', overflow: 'hidden' }}>
            <div className="container">
              <div className="reveal-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <span className="m-label" style={{ color: '#C08A74', letterSpacing: '3px' }}>Visual Lookbook</span>
                <h2 className="m-section-title" style={{ color: '#fff' }}>The Mason <em>Cinematic</em> Experience</h2>
                <p style={{ maxWidth: '600px', margin: '1rem auto 0', color: '#a3a3a3' }}>
                  Immerse yourself in our world. Discover the movement, the texture, and the unparalleled grace of our latest collections in motion.
                </p>
              </div>

              {loading ? (
                <div className="m-loading-state"><div className="spinner" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /></div>
              ) : (
                <div className="m-cinematic__grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 250px))', 
                  justifyContent: 'center',
                  gap: '2rem',
                  alignItems: 'center'
                }}>
                  {cinematicMedia.map((media, i) => (
                    <div key={media._id} className="reveal-up" style={{ 
                      position: 'relative', 
                      borderRadius: '16px', 
                      overflow: 'hidden',
                      aspectRatio: '9/16',
                      boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                      transitionDelay: `${i * 0.1}s`,
                      transform: i % 2 !== 0 ? 'translateY(2rem)' : 'none'
                    }}>
                      {media.type === 'video' ? (
                        <video 
                          src={media.url} 
                          autoPlay 
                          loop 
                          muted 
                          playsInline 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <img 
                          src={media.url} 
                          alt={media.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          loading="lazy"
                        />
                      )}
                      {media.title && (
                        <div style={{ 
                          position: 'absolute', 
                          bottom: 0, 
                          left: 0, 
                          right: 0, 
                          padding: '3rem 1.5rem 1.5rem', 
                          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '1.1rem',
                          letterSpacing: '0.5px'
                        }}>
                          {media.title}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. FEATURED PRODUCTS */}
        {(loading || featured.length > 0) && (
          <section className="m-featured">
            <div className="container">
              <div className="m-featured__header reveal-up">
                <div>
                  <span className="m-label">Editor's Picks</span>
                  <h2 className="m-section-title">Featured <em>Collection</em></h2>
                </div>
                <Link to="/category/all?featured=true" className="m-nav-link-cta">
                  Explore All <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>

              {loading ? (
                <div className="m-loading-state"><div className="spinner" /></div>
              ) : (
                <div className="m-featured__grid">
                  {featured.map((product, i) => (
                    <div key={product._id} className="m-featured__item reveal-up" style={{ transitionDelay: `${i * 0.07}s` }}>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* 6. TRENDING NOW */}
        <section className="m-trending">
          <div className="container m-trending__header reveal-up">
            <h2 className="m-section-title">Trending <em>Now</em></h2>
            <div className="m-drag-hint">Swipe to explore</div>
          </div>

          <div className="m-trending__scroll">
            <div className="m-trending__track">
              {loading ? (
                <div className="m-loading-state"><div className="spinner" /></div>
              ) : (
                trending.map((product, i) => (
                  <div key={product._id} className="m-trending__item reveal-up" style={{ transitionDelay: `${i * 0.05}s` }}>
                    <ProductCard product={product} />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* 7. EDITORIAL CAMPAIGN */}
        <section className="m-campaign reveal-up">
          <div className="m-campaign__bg" style={{ backgroundImage: `url('/home4.jpg')` }} />
          <div className="m-campaign__overlay" />
          <div className="m-campaign__content">
            <h2 className="m-campaign__title"><em>Sensuality</em> in Every Stitch.</h2>
            <Link to="/category/women" className="m-hero__cta">
              Shop The Campaign
            </Link>
          </div>
        </section>

        <section className="m-reviews">
          <div className="container">
            <h2 className="m-section-title text-center reveal-up mb-12">The Mason <em>Muse</em></h2>
            <div className="m-reviews__grid">
              {reviews.map((r, i) => (
                <article key={i} className="m-review-card reveal-up" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="m-review-card__stars">★★★★★</div>
                  <p className="m-review-card__text">"{r.text}"</p>
                  <div className="m-review-card__author">
                    <strong>{r.name}</strong>
                    <span>{r.label}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 9. FABRIC & FIT FAQ */}
        <section className="m-faq py-5" style={{ background: '#fcfcfc', borderTop: '1px solid #eaeaea' }}>
          <div className="container reveal-up">
            <h2 className="m-section-title text-center mb-4">Fabric & <em>Fit</em> Guide</h2>
            <div className="faq-grid" style={{ display: 'grid', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
              <div className="faq-item">
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#111827' }}>What materials do you use for your premium ethnic wear?</h4>
                <p style={{ color: '#4b5563', lineHeight: '1.6' }}>We exclusively use high-quality, breathable fabrics like Chanderi silk, premium pure cotton, and georgette. Our focus is on sourcing natural fibers that ensure long-lasting comfort and an elegant drape, perfect for India's varied climate.</p>
              </div>
              <div className="faq-item">
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#111827' }}>How do I know my correct size?</h4>
                <p style={{ color: '#4b5563', lineHeight: '1.6' }}>Every product page features a detailed size chart with exact garment measurements. Since our silhouettes are designed to be flattering yet comfortable, we recommend choosing your standard size, or utilizing our custom tailoring service for a precise, made-to-measure fit.</p>
              </div>
            </div>
          </div>
        </section>
      </div> {/* End desktop-only-sections */}

      {/* --- MOBILE ONLY SECTIONS --- */}
      <div className="mobile-only-sections">
        {/* 1. Initial Product Section (Trending) */}
        <section className="m-trending pt-4 pb-4">
          <div className="container m-trending__header">
            <h2 className="m-section-title">Trending <em>Now</em></h2>
          </div>
          <div className="m-trending__scroll">
            <div className="m-trending__track">
              {loading ? (
                <div className="m-loading-state"><div className="spinner" /></div>
              ) : (
                trending.map(product => (
                  <div key={product._id} className="m-trending__item">
                    <ProductCard product={product} />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* 2. Full Width Banner */}
        <div className="mobile-banner w-100">
          <img src="/home4.jpg" alt="Campaign" style={{ width: '100%', height: 'auto', display: 'block' }} loading="lazy" />
        </div>

        {/* SHOP BY CATEGORIES SECTION (Before New Arrivals) */}
        <ShopByCategoriesSection />

        {/* 3. New Arrivals Grid */}
        <section className="mobile-new-arrivals" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div className="container text-center mb-5">
            <span className="m-label">Just In</span>
            <h2 className="m-section-title">New <em>Arrivals</em></h2>
          </div>
          <div className="container">
            <div className="mobile-product-grid">
              {newArrivals.slice(0, 8).map(product => (
                <div key={product._id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="text-center" style={{ marginTop: '3rem', marginBottom: '4rem' }}>
              <Link to="/category/all?sort=newest" className="btn btn-outline" style={{ width: '100%' }}>
                Show All Products
              </Link>
            </div>
          </div>
        </section>

        {/* 4. Lifestyle Images */}
        <section className="mobile-lifestyle-images pb-5" style={{ marginTop: '2rem' }}>
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <img src="/home1.jpg" alt="Lifestyle" style={{ width: '100%', borderRadius: '8px' }} loading="lazy" />
            <img src="/home2.jpg" alt="Lifestyle" style={{ width: '100%', borderRadius: '8px' }} loading="lazy" />
          </div>
        </section>
      </div>

      {/* CUSTOM TAILORING SECTION */}
      <CustomizeSection />

    </div>
  );
};

export default Home;
