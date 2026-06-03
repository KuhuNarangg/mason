import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import './CategoryPage.css';

const CategoryPage = () => {
  const { gender } = useParams();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const searchQuery = searchParams.get('search');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  
  // Filter States
  const [selectedTypes, setSelectedTypes] = useState(typeParam ? [typeParam] : []);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });

  const categories = ['Dress', 'Top', 'Trouser', 'Ethnic', 'Westernwear'];

  useEffect(() => {
    if (typeParam) {
      setSelectedTypes([typeParam]);
    }
  }, [typeParam]);
  const priceOptions = [
    { label: 'All Prices', min: '', max: '' },
    { label: 'Under ₹1,000', min: '0', max: '1000' },
    { label: '₹1,000 - ₹2,500', min: '1000', max: '2500' },
    { label: '₹2,500 - ₹5,000', min: '2500', max: '5000' },
    { label: 'Over ₹5,000', min: '5000', max: '' },
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = (gender && gender !== 'all') ? `gender=${gender}&` : '';
        
        query += `sort=${sort}&limit=50&`;
        
        if (selectedTypes.length > 0) {
          query += `type=${selectedTypes.join(',')}&`;
        }
        
        if (searchQuery) query += `search=${searchQuery}&`;
        
        if (priceRange.min) query += `minPrice=${priceRange.min}&`;
        if (priceRange.max) query += `maxPrice=${priceRange.max}&`;

        const { data } = await api.get(`/products?${query}`);
        setProducts(data.products);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [gender, sort, selectedTypes, priceRange, searchQuery]);

  const handleTypeChange = (type) => {
    const formattedType = type.toLowerCase();
    setSelectedTypes(prev => 
      prev.includes(formattedType) ? prev.filter(t => t !== formattedType) : [...prev, formattedType]
    );
  };

  let genderTitle = "The Collection";

  if (searchQuery) {
    genderTitle = `Search results for "${searchQuery}"`;
  } else if (selectedTypes.length === 1 && gender === 'all') {
    const typeName = selectedTypes[0];
    genderTitle = typeName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Collection';
  }

  return (
    <div className="container mt-4 mb-5 fade-in">
      <div className="category-header d-flex justify-between align-center mb-5 reveal active">
        <div>
          <h1 className="category-title">{genderTitle}</h1>
          <p className="text-muted mt-1">{products.length} Products Found</p>
        </div>
        <div className="sort-control">
          <label className="text-muted me-2" style={{ fontSize: '0.9rem' }}>Sort by:</label>
          <select className="form-input" value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 1rem' }}>
            <option value="newest">New Arrivals</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="popular">Popularity</option>
            <option value="rating">Customer Rating</option>
          </select>
        </div>
      </div>

      <div className="category-layout">
        {/* Mobile Filter Toggle */}
        <button 
          className="mobile-filter-toggle" 
          onClick={() => setShowFiltersMobile(!showFiltersMobile)}
        >
          {showFiltersMobile ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Sidebar Filters */}
        <aside className={`filters-sidebar reveal active ${showFiltersMobile ? 'open-mobile' : ''}`}>

          <div className="filter-group mb-5">
            <h3 className="filter-title mb-3 font-heading">Sub Categories</h3>
            <div className="filter-list">
              {categories.map(type => (
                <label key={type} className="filter-checkbox-label mb-2 d-flex align-center" style={{ cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedTypes.includes(type.toLowerCase())}
                    onChange={() => handleTypeChange(type)}
                    className="me-2"
                  />
                  <span style={{ fontSize: '0.9rem', color: selectedTypes.includes(type.toLowerCase()) ? 'var(--color-primary)' : 'inherit', fontWeight: selectedTypes.includes(type.toLowerCase()) ? '600' : '400' }}>
                    {type}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group mb-5">
            <h3 className="filter-title mb-3 font-heading">Price Range</h3>
            <div className="filter-list">
              {priceOptions.map((opt, i) => (
                <label key={i} className="filter-radio-label mb-2 d-flex align-center" style={{ cursor: 'pointer' }}>
                  <input 
                    type="radio" 
                    name="price"
                    checked={priceRange.min === opt.min && priceRange.max === opt.max}
                    onChange={() => setPriceRange({ min: opt.min, max: opt.max })}
                    className="me-2"
                  />
                  <span style={{ fontSize: '0.9rem', color: (priceRange.min === opt.min && priceRange.max === opt.max) ? 'var(--color-primary)' : 'inherit', fontWeight: (priceRange.min === opt.min && priceRange.max === opt.max) ? '600' : '400' }}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button 
            className="btn btn-outline w-100 btn-sm"
            onClick={() => { 
              setSelectedTypes([]); 
              setPriceRange({ min: '', max: '' }); 
            }}
            style={{ fontSize: '0.75rem', letterSpacing: '1px' }}
          >
            CLEAR ALL FILTERS
          </button>
        </aside>

        {/* Product Grid */}
        <div className="products-container">
          {loading ? (
            <div className="text-center py-5 w-100">
              <div className="spinner mb-3"></div>
              <p className="text-muted">Loading fresh styles...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5 w-100 reveal active">
              <div style={{ fontSize: '3rem', opacity: 0.3 }} className="mb-3">🔍</div>
              <h3 className="font-heading">No results found</h3>
              <p className="text-muted mb-4">Try adjusting your filters or search criteria.</p>
              <button onClick={() => { setSelectedTypes([]); setPriceRange({ min: '', max: '' }); }} className="btn btn-primary">
                CLEAR ALL FILTERS
              </button>
            </div>
          ) : (
            <div className="premium-product-grid reveal active">
              {products.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;

