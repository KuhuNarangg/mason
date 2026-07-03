import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, Filter, X } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import './Catalogue.css';

const PRICE_CATEGORIES = [
  { label: 'Under ₹200', min: 0, max: 200, slug: 'under-200' },
  { label: '₹200–₹500', min: 200, max: 500, slug: '200-500' },
  { label: '₹500–₹1000', min: 500, max: 1000, slug: '500-1000' },
  { label: '₹1000–₹3000', min: 1000, max: 3000, slug: '1000-3000' },
  { label: '₹3000–₹5000', min: 3000, max: 5000, slug: '3000-5000' },
  { label: 'Above ₹5000', min: 5000, max: Infinity, slug: 'above-5000' }
];

const CATEGORY_ICONS = {
  'Dresses': '👗',
  'Frocks': '👶',
  'Tops': '👚',
  'Skirts': '👗',
  'Co-ords': '🧥',
  'Kurtis': '👘',
  'Sarees': '🥻',
  'Jeans': '👖',
  'Shirts': '👔',
  'T-Shirts': '👕',
  'Footwear': '👠',
  'Accessories': '👜',
  'Ethnic Wear': '🥻',
  'Western Wear': '👗',
  'Festive Wear': '✨',
  'All Products': '🌟'
};

const Catalogue = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active query parameters
  const activeCategoryParam = searchParams.get('category');
  const activePriceParam = searchParams.get('price');
  const activeSearchParam = searchParams.get('search') || '';

  useEffect(() => {
    // Load categories instantly
    api.get('/categories')
      .then(res => {
        const fetched = res.data.categories || [];
        const customCategories = [
          { _id: 'custom-all', name: 'All Products', slug: 'all' },
          { _id: 'custom-festive', name: 'Festive Wear', slug: 'festive' },
          { _id: 'custom-accessories', name: 'Accessories', slug: 'accessories' }
        ];
        const extraCats = customCategories.filter(c => !fetched.some(f => f.slug === c.slug));
        setCategories([...extraCats, ...fetched]);
        setLoadingCats(false);
      })
      .catch(err => {
        console.error('Failed to load categories', err);
        setLoadingCats(false);
      });

    // Load products in the background for counts and filtering
    api.get('/products', { params: { limit: 1000 } })
      .then(res => {
        setProducts(res.data.products || []);
        setLoadingProducts(false);
      })
      .catch(err => {
        console.error('Failed to load products', err);
        setLoadingProducts(false);
      });
  }, []);

  // Helpers to get item counts
  const isProductInCategory = (p, cat) => {
    if (!cat) return false;
    
    if (cat.slug === 'all') return true;
    if (cat.slug === 'festive') {
      const searchStr = `${p.tags?.join(' ')} ${p.name} ${p.description} ${p.category?.name}`.toLowerCase();
      return searchStr.includes('festive') || searchStr.includes('wedding');
    }
    if (cat.slug === 'accessories') {
      const searchStr = `${p.type} ${p.category?.name}`.toLowerCase();
      return searchStr.includes('accessory') || searchStr.includes('accessories');
    }

    const pCatId = p.category?._id || p.category;
    const pSubCatId = p.subcategory?._id || p.subcategory;
    if (String(pCatId) === String(cat._id) || String(pSubCatId) === String(cat._id)) {
      return true;
    }
    
    const catSlug = String(cat.slug || '').toLowerCase();
    const pType = String(p.type || '').toLowerCase();
    const normalizedSlug = catSlug.replace(/s$/, '');
    const normalizedType = pType.replace(/s$/, '');
    
    if (normalizedType === normalizedSlug) return true;
    if (pType === 'dress' && catSlug === 'dresses') return true;
    if (pType === 'trouser' && catSlug === 'trousers') return true;
    
    return false;
  };

  const getCategoryCount = (catId) => {
    const cat = categories.find(c => String(c._id) === String(catId));
    return products.filter(p => isProductInCategory(p, cat)).length;
  };

  const getCategoryProductImage = (catId) => {
    const cat = categories.find(c => String(c._id) === String(catId));
    if (cat?.slug === 'accessories') return '/hero5.jpg';
    if (cat?.slug === 'festive') return '/hero4.jpg';
    if (cat?.slug === 'all') return '/hero1.jpg';

    const productWithImg = products.find(p => isProductInCategory(p, cat) && p.images && p.images.length > 0);
    return productWithImg ? productWithImg.images[0] : null;
  };

  const getPriceCount = (min, max) => {
    return products.filter(p => {
      const price = p.price || p.originalPrice;
      return price >= min && price <= max;
    }).length;
  };

  const getPriceProductImage = (min, max) => {
    const productWithImg = products.find(p => {
      const price = p.price || p.originalPrice;
      return price >= min && price <= max && p.images && p.images.length > 0;
    });
    return productWithImg ? productWithImg.images[0] : null;
  };

  // Find Category details by Slug or ID
  const getCategoryBySlugOrId = (slugOrId) => {
    return categories.find(c => c._id === slugOrId || c.slug === slugOrId);
  };

  // Navigation handlers
  const handleCategorySelect = (slugOrId) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('category', slugOrId);
    setSearchParams(newParams);
  };

  const handlePriceSelect = (slug) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('price', slug);
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (searchTerm) => {
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm.trim()) {
      newParams.set('search', searchTerm.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const goBackToLanding = () => {
    setSearchParams(new URLSearchParams());
  };

  // Determine active view mode
  const isGridView = activeCategoryParam || activePriceParam || activeSearchParam;

  useEffect(() => {
    if (isGridView) {
      document.body.classList.add('global-dark-theme');
    } else {
      document.body.classList.remove('global-dark-theme');
    }
    return () => document.body.classList.remove('global-dark-theme');
  }, [isGridView]);

  // Filter products dynamically
  const filteredProducts = products.filter(p => {
    // 1. Search Query Filter
    if (activeSearchParam) {
      const searchLower = activeSearchParam.toLowerCase();
      const nameMatch = p.name?.toLowerCase().includes(searchLower);
      const brandMatch = p.brand?.toLowerCase().includes(searchLower);
      const typeMatch = p.type?.toLowerCase().includes(searchLower);
      
      // Category Name Match
      const matchedCat = categories.find(c => isProductInCategory(p, c));
      const categoryMatch = matchedCat?.name?.toLowerCase().includes(searchLower);

      if (!nameMatch && !brandMatch && !typeMatch && !categoryMatch) {
        return false;
      }
    }

    // 2. Category Filter
    if (activeCategoryParam) {
      const activeCat = getCategoryBySlugOrId(activeCategoryParam);
      if (activeCat && !isProductInCategory(p, activeCat)) {
        return false;
      }
    }

    // 3. Price Filter
    if (activePriceParam) {
      const activePriceObj = PRICE_CATEGORIES.find(pc => pc.slug === activePriceParam);
      if (activePriceObj) {
        const price = p.price || p.originalPrice;
        const { min, max } = activePriceObj;
        const inRange = price >= min && price <= max;
        if (!inRange) return false;
      }
    }

    return true;
  });

  if (loadingCats || (isGridView && loadingProducts)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ marginBottom: '1rem' }} />
        <p className="text-muted">Loading MASON Catalogue...</p>
      </div>
    );
  }

  // --- RENDERING LANDING PAGE ---
  if (!isGridView) {
    return (
      <div className="catalogue-container fade-in">
        <div className="catalogue-header">
          <h1 className="catalogue-title">Catalogue</h1>
          <p className="catalogue-subtitle">Browse Owl Stitch Editorial Collections</p>
        </div>

        {/* Search Bar */}
        <div className="catalogue-search-bar">
          <Search className="catalogue-search-icon" size={20} />
          <input
            type="text"
            className="catalogue-search-input"
            placeholder="Search by product name, category, brand..."
            defaultValue={activeSearchParam}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchSubmit(e.target.value);
            }}
          />
        </div>

        {/* Category Cards */}
        <h2 className="section-title">Shop by Category</h2>
        <div className="category-grid">
          {categories
            .sort((a, b) => {
              const order = { 'Dresses': 1, 'Ethnics': 2, 'Tops': 3, 'Trousers': 4 };
              return (order[a.name] || 5) - (order[b.name] || 5);
            })
            .map(cat => {
            const imageUrl = cat.image || getCategoryProductImage(cat._id);
            const icon = CATEGORY_ICONS[cat.name] || '🛍️';
            return (
              <div
                key={cat._id}
                className="category-card"
                onClick={() => handleCategorySelect(cat.slug || cat._id)}
              >
                <div className="category-card-visual">
                  {imageUrl ? (
                    <img src={imageUrl} alt={cat.name} className="category-card-img" />
                  ) : (
                    <div className="category-card-placeholder" style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #FAF6F0 0%, #F3EDE4 100%)' }} />
                  )}
                </div>
                <div className="category-card-info">
                  <span className="category-card-name">{cat.name}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Price Categories */}
        <h2 className="section-title">Shop by Price</h2>
        <div className="price-grid">
          {PRICE_CATEGORIES.map((priceObj, idx) => {
            const imageUrl = getPriceProductImage(priceObj.min, priceObj.max);
            return (
              <div
                key={idx}
                className="price-card"
                onClick={() => handlePriceSelect(priceObj.slug)}
              >
                <div className="price-card-visual">
                  {imageUrl ? (
                    <img src={imageUrl} alt={priceObj.label} className="price-card-img" />
                  ) : (
                    <span className="price-card-placeholder">🏷️</span>
                  )}
                </div>
                <div className="price-card-info">
                  <span className="price-card-label">{priceObj.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- RENDERING PRODUCT GRID VIEW ---
  const activeCategoryObj = activeCategoryParam ? getCategoryBySlugOrId(activeCategoryParam) : null;
  const activePriceObj = activePriceParam ? PRICE_CATEGORIES.find(pc => pc.slug === activePriceParam) : null;

  return (
    <div className="catalogue-container fade-in">
      {/* Breadcrumb / Back button */}
      <div className="catalogue-breadcrumbs">
        <button onClick={goBackToLanding} className="breadcrumb-back-btn">
          <ArrowLeft size={16} /> Catalogue
        </button>
        {activeCategoryObj && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{activeCategoryObj.name}</span>
          </>
        )}
        {activePriceObj && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{activePriceObj.label}</span>
          </>
        )}
        {activeSearchParam && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Search: "{activeSearchParam}"</span>
          </>
        )}
      </div>

      {/* Dynamic Mobile Header & Filter Toggle */}
      <div className="mobile-filter-bar">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 500 }}>
            {activeCategoryObj ? activeCategoryObj.name : activePriceObj ? activePriceObj.label : 'Search Results'}
          </h2>
          <p className="text-muted" style={{ fontSize: '0.8rem' }}>{filteredProducts.length} Products</p>
        </div>
        <button className="mobile-filter-btn" onClick={() => setMobileFilterOpen(true)}>
          <Filter size={16} /> Filters
        </button>
      </div>

      <div className="catalogue-layout">
        {/* Desktop Sidebar Filters */}
        <aside className="catalogue-sidebar desktop-only">
          <div className="filter-section">
            <h3 className="filter-section-title">Categories</h3>
            <div className="filter-option-list">
              {categories.map(cat => (
                <label key={cat._id} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    className="filter-checkbox-input"
                    checked={activeCategoryParam === (cat.slug || cat._id)}
                    onChange={() => {
                      if (activeCategoryParam === (cat.slug || cat._id)) {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('category');
                        setSearchParams(newParams);
                      } else {
                        handleCategorySelect(cat.slug || cat._id);
                      }
                    }}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-section">
            <h3 className="filter-section-title">Price Range</h3>
            <div className="filter-option-list">
              {PRICE_CATEGORIES.map((priceObj, idx) => (
                <label key={idx} className="filter-checkbox-label">
                  <input
                    type="checkbox"
                    className="filter-checkbox-input"
                    checked={activePriceParam === priceObj.slug}
                    onChange={() => {
                      if (activePriceParam === priceObj.slug) {
                        const newParams = new URLSearchParams(searchParams);
                        newParams.delete('price');
                        setSearchParams(newParams);
                      } else {
                        handlePriceSelect(priceObj.slug);
                      }
                    }}
                  />
                  <span>{priceObj.label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={clearAllFilters}
            className="btn btn-outline w-100"
            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
          >
            Clear All Filters
          </button>
        </aside>

        {/* Product Grid Area */}
        <div>
          {/* Active Filter Badges */}
          <div className="active-filters">
            {activeCategoryObj && (
              <span className="filter-badge">
                {activeCategoryObj.name}
                <button
                  className="filter-badge-remove"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('category');
                    setSearchParams(newParams);
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {activePriceObj && (
              <span className="filter-badge">
                {activePriceObj.label}
                <button
                  className="filter-badge-remove"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('price');
                    setSearchParams(newParams);
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {activeSearchParam && (
              <span className="filter-badge">
                Search: "{activeSearchParam}"
                <button
                  className="filter-badge-remove"
                  onClick={() => {
                    const newParams = new URLSearchParams(searchParams);
                    newParams.delete('search');
                    setSearchParams(newParams);
                  }}
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          {/* Grid Render */}
          {filteredProducts.length === 0 ? (
            <div className="catalogue-empty">
              <div className="catalogue-empty-icon">🔍</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Products Found</h3>
              <p className="text-muted" style={{ marginBottom: '1.5rem' }}>We couldn't find any products matching your selection.</p>
              <button onClick={clearAllFilters} className="btn btn-primary">Clear All Filters</button>
            </div>
          ) : (
            <div className="catalogue-products-grid">
              {filteredProducts.map(p => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      <div className={`mobile-filter-overlay ${mobileFilterOpen ? 'open' : ''}`} onClick={() => setMobileFilterOpen(false)} />
      <div className={`mobile-filter-drawer ${mobileFilterOpen ? 'open' : ''}`}>
        <div className="mobile-filter-drawer-header">
          <span className="mobile-filter-drawer-title">Filters</span>
          <button className="btn-icon" onClick={() => setMobileFilterOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="filter-section">
          <h3 className="filter-section-title">Categories</h3>
          <div className="filter-option-list">
            {categories.map(cat => (
              <label key={cat._id} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  className="filter-checkbox-input"
                  checked={activeCategoryParam === (cat.slug || cat._id)}
                  onChange={() => {
                    if (activeCategoryParam === (cat.slug || cat._id)) {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('category');
                      setSearchParams(newParams);
                    } else {
                      handleCategorySelect(cat.slug || cat._id);
                    }
                  }}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h3 className="filter-section-title">Price Range</h3>
          <div className="filter-option-list">
            {PRICE_CATEGORIES.map((priceObj, idx) => (
              <label key={idx} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  className="filter-checkbox-input"
                  checked={activePriceParam === priceObj.slug}
                  onChange={() => {
                    if (activePriceParam === priceObj.slug) {
                      const newParams = new URLSearchParams(searchParams);
                      newParams.delete('price');
                      setSearchParams(newParams);
                    } else {
                      handlePriceSelect(priceObj.slug);
                    }
                  }}
                />
                <span>{priceObj.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            clearAllFilters();
            setMobileFilterOpen(false);
          }}
          className="btn btn-outline w-100"
          style={{ marginTop: 'auto', padding: '0.75rem' }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default Catalogue;
