import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../utils/api';
import './ShopByCategoriesSection.css';

// Default curated fallback categories with real store images
const DEFAULT_CATEGORIES = [
  {
    _id: 'cat_dresses',
    name: 'Dresses & Gowns',
    slug: 'dresses',
    gender: 'women',
    image: '/greendress1.jpg',
    subcategories: [{ name: 'Evening Gowns' }, { name: 'Slip Dresses' }, { name: 'Party Dresses' }],
    description: 'Bespoke silhouettes & flowing evening gowns'
  },
  {
    _id: 'cat_ethnics',
    name: 'Heritage Ethnic Wear',
    slug: 'ethnics',
    gender: 'women',
    image: '/blueethic1.jpg',
    subcategories: [{ name: 'Lehengas' }, { name: 'Kurta Sets' }, { name: 'Anarkalis' }],
    description: 'Intricate embroidery & royal Indian wear'
  },
  {
    _id: 'cat_party',
    name: 'Evening Glamour',
    slug: 'party-wear',
    gender: 'women',
    image: '/champagnedress1.jpg',
    subcategories: [{ name: 'Cocktail Wear' }, { name: 'Velvet Gowns' }, { name: 'Satin Edits' }],
    description: 'Statement pieces designed for unforgettable nights'
  },
  {
    _id: 'cat_tops',
    name: 'Chic Tops & Blouses',
    slug: 'tops',
    gender: 'women',
    image: '/home1.jpg',
    subcategories: [{ name: 'Corset Tops' }, { name: 'Silk Blouses' }, { name: 'Crop Tops' }],
    description: 'Versatile tops for day-to-night styling'
  },
  {
    _id: 'cat_custom',
    name: 'Bespoke Atelier',
    slug: 'custom-tailoring',
    gender: 'women',
    image: '/home3.jpg',
    subcategories: [{ name: 'Made to Measure' }, { name: 'Custom Prints' }, { name: 'Couple Sets' }],
    description: 'Handcrafted tailored pieces made to your exact size'
  },
  {
    _id: 'cat_trousers',
    name: 'Tailored Trousers',
    slug: 'trousers',
    gender: 'women',
    image: '/beigedress1.jpg',
    subcategories: [{ name: 'Wide Leg Pants' }, { name: 'Co-Ord Sets' }, { name: 'High Waist' }],
    description: 'Effortless tailoring & crisp modern fits'
  }
];

const ShopByCategoriesSection = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const [catRes, prodRes] = await Promise.allSettled([
          api.get('/categories/tree'),
          api.get('/products?limit=30')
        ]);

        let fetchedTree = [];
        let fetchedProducts = [];

        if (catRes.status === 'fulfilled' && catRes.value?.data?.categories) {
          fetchedTree = catRes.value.data.categories;
        }
        if (prodRes.status === 'fulfilled' && prodRes.value?.data?.products) {
          fetchedProducts = prodRes.value.data.products;
        }

        if (fetchedTree.length > 0) {
          const enhanced = fetchedTree.map((cat, idx) => {
            let catImage = cat.image;

            if (!catImage) {
              const matchingProd = fetchedProducts.find(
                p => (p.category === cat._id || p.type === cat.slug || (p.type && cat.name && p.type.toLowerCase().includes(cat.name.toLowerCase())))
              );
              if (matchingProd && matchingProd.images && matchingProd.images.length > 0) {
                catImage = matchingProd.images[0];
              } else if (DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length]) {
                catImage = DEFAULT_CATEGORIES[idx % DEFAULT_CATEGORIES.length].image;
              } else {
                catImage = '/home1.jpg';
              }
            }

            return {
              ...cat,
              image: catImage
            };
          });

          setCategories(enhanced);
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
      } catch (err) {
        console.error('Error fetching shop categories:', err);
        setCategories(DEFAULT_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, []);

  // Smooth scroll handler
  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Automatic slow scrolling interval
  useEffect(() => {
    if (isPaused || loading || categories.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 15) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: 310, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, loading, categories]);

  const getCategoryUrl = (cat) => {
    if (cat.slug === 'custom-tailoring') return '/customisation';
    const params = new URLSearchParams();
    if (cat._id && !cat._id.startsWith('cat_')) {
      params.set('category', cat._id);
    } else if (cat.slug) {
      params.set('type', cat.slug);
    }
    const genderPath = cat.gender || 'all';
    const queryString = params.toString();
    return `/category/${genderPath}${queryString ? `?${queryString}` : ''}`;
  };

  return (
    <section 
      className="m-shop-categories reveal-up"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container">
        {/* Section Header */}
        <div className="m-shop-categories__header">
          <div className="m-shop-categories__header-info">
            <span className="m-label m-shop-categories__badge">
              <Sparkles size={14} style={{ display: 'inline', marginRight: 6 }} />
              Curated Collections
            </span>
            <h2 className="m-section-title">
              Shop by <em>Category</em>
            </h2>
          </div>

          {/* Controls: Left / Right Arrows & View All */}
          <div className="m-shop-categories__controls">
            <div className="m-slider-arrows">
              <button 
                className="m-slider-arrow" 
                onClick={() => handleScroll('left')}
                aria-label="Previous Category"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                className="m-slider-arrow" 
                onClick={() => handleScroll('right')}
                aria-label="Next Category"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <Link to="/categories" className="m-nav-link-cta m-shop-categories__view-all">
              View All <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        {/* Single-Row Scrollable Track */}
        {loading ? (
          <div className="m-loading-state">
            <div className="spinner" />
          </div>
        ) : (
          <div className="m-shop-categories__scroll-wrap">
            <div className="m-shop-categories__track" ref={scrollRef}>
              {categories.map((cat, index) => (
                <Link
                  key={cat._id || cat.slug || index}
                  to={getCategoryUrl(cat)}
                  className="m-category-card"
                >
                  <div className="m-category-card__bg-wrap">
                    <img
                      src={cat.image || '/home1.jpg'}
                      alt={cat.name}
                      className="m-category-card__img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length].image;
                      }}
                    />
                    <div className="m-category-card__overlay" />
                  </div>

                  <div className="m-category-card__content">
                    <div className="m-category-card__tags">
                      <span className="m-category-card__tag">
                        {cat.gender === 'women' ? "Women's" : (cat.gender === 'men' ? "Men's" : "Signature")}
                      </span>
                    </div>

                    <h3 className="m-category-card__title">{cat.name}</h3>

                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="m-category-card__subs">
                        {cat.subcategories.slice(0, 2).map((sub, sIdx) => (
                          <span key={sIdx} className="m-category-card__sub-pill">
                            {sub.name || sub}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="m-category-card__action">
                      <span>Explore</span>
                      <ArrowRight size={14} className="m-category-card__arrow" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ShopByCategoriesSection;
