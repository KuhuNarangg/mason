import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { generateCollectionSchema } from '../utils/schema';
import './CategoryPage.css';

const CategoryPage = () => {
  const { gender } = useParams();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const searchQuery = searchParams.get('search');
  const categoryParam = searchParams.get('category');

  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Filter States
  const [selectedTypes, setSelectedTypes] = useState(typeParam ? [typeParam] : []);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [discountRange, setDiscountRange] = useState({ min: '', max: '' });
  const [minRating, setMinRating] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState(categoryParam ? [categoryParam] : []);

  // Dynamic filter options pulled from backend based on current scope
  const [filterOptions, setFilterOptions] = useState({ brands: [], colors: [], sizes: [], priceRange: { minPrice: 0, maxPrice: 0 } });
  const [categoryTree, setCategoryTree] = useState([]);

  const discountOptions = [
    { label: 'All Discounts', min: '', max: '' },
    { label: '10% and above', min: '10', max: '' },
    { label: '20% and above', min: '20', max: '' },
    { label: '30% and above', min: '30', max: '' },
    { label: '40% and above', min: '40', max: '' },
    { label: '50% and above', min: '50', max: '' },
  ];

  const ratingOptions = [
    { label: 'All Ratings', value: '' },
    { label: '4★ & above', value: '4' },
    { label: '3★ & above', value: '3' },
    { label: '2★ & above', value: '2' },
  ];

  useEffect(() => {
    // Timeout ensures browser scroll restoration doesn't override this
    const timer = setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 10);
    return () => clearTimeout(timer);
  }, [gender]);

  useEffect(() => {
    setSelectedTypes(typeParam ? [typeParam] : []);
  }, [typeParam]);



  // Keep the Categories sidebar in sync with the ?category= URL param
  // (e.g. when navigating between category links without a full page reload)
  useEffect(() => {
    setSelectedCategories(categoryParam ? [categoryParam] : []);
  }, [categoryParam]);

  const priceOptions = [
    { label: 'All Prices', min: '', max: '' },
    { label: 'Under ₹1,000', min: '0', max: '1000' },
    { label: '₹1,000 - ₹2,500', min: '1000', max: '2500' },
    { label: '₹2,500 - ₹5,000', min: '2500', max: '5000' },
    { label: 'Over ₹5,000', min: '5000', max: '' },
  ];

  // Fetch category/subcategory tree for the sidebar checkbox filter
  useEffect(() => {
    const fetchCategoryTree = async () => {
      try {
        const query = (gender && gender !== 'all') ? `?gender=${gender}` : '';
        const { data } = await api.get(`/categories/tree${query}`);
        setCategoryTree(data.categories || data || []);
      } catch (err) {
        console.error('Failed to fetch category tree', err);
      }
    };
    fetchCategoryTree();
  }, [gender]);

  // Fetch dynamic filter options (brands/colors/sizes) for the current scope
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        let query = (gender && gender !== 'all') ? `gender=${gender}&` : '';
        if (selectedCategories.length > 0) query += `category=${selectedCategories.join(',')}&`;
        if (selectedTypes.length > 0) query += `type=${selectedTypes.join(',')}&`;
        const { data } = await api.get(`/products/filters/options?${query}`);
        setFilterOptions(data);
      } catch (err) {
        console.error('Failed to fetch filter options', err);
      }
    };
    fetchFilterOptions();
  }, [gender, selectedCategories, selectedTypes]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let query = (gender && gender !== 'all') ? `gender=${gender}&` : '';

        query += `sort=${sort}&limit=50&`;

        if (selectedCategories.length > 0) query += `category=${selectedCategories.join(',')}&`;

        if (selectedTypes.length > 0) {
          query += `type=${selectedTypes.join(',')}&`;
        }

        if (selectedBrands.length > 0) query += `brand=${selectedBrands.map(encodeURIComponent).join(',')}&`;
        if (selectedColors.length > 0) query += `color=${selectedColors.map(encodeURIComponent).join(',')}&`;
        if (selectedSizes.length > 0) query += `size=${selectedSizes.map(encodeURIComponent).join(',')}&`;

        if (searchQuery) query += `search=${searchQuery}&`;

        if (priceRange.min) query += `minPrice=${priceRange.min}&`;
        if (priceRange.max) query += `maxPrice=${priceRange.max}&`;

        if (discountRange.min) query += `minDiscount=${discountRange.min}&`;
        if (discountRange.max) query += `maxDiscount=${discountRange.max}&`;

        if (minRating) query += `rating=${minRating}&`;
        if (inStockOnly) query += `inStock=true&`;

        const { data } = await api.get(`/products?${query}`);
        setProducts(data.products);
        setTotalProducts(data.total ?? data.products.length);
      } catch (err) {
        console.error('Failed to fetch products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [gender, sort, selectedTypes, selectedBrands, selectedColors, selectedSizes, priceRange, discountRange, minRating, inStockOnly, searchQuery, selectedCategories]);

  const handleTypeChange = (type) => {
    const formattedType = type.toLowerCase();
    setSelectedTypes(prev =>
      prev.includes(formattedType) ? prev.filter(t => t !== formattedType) : [...prev, formattedType]
    );
  };

  const toggleInArray = (setter) => (value) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleBrandChange = toggleInArray(setSelectedBrands);
  const handleColorChange = toggleInArray(setSelectedColors);
  const handleSizeChange = toggleInArray(setSelectedSizes);

  // Picking a Category in the sidebar is a "global" filter — it should override
  // any legacy ?type= quick-filter from the navbar (e.g. "Dresses") so that
  // checking "Tops" while on the Dresses page actually shows Tops products.
  const handleCategoryChange = (categoryId) => {
    setSelectedTypes([]);
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedCategories([]);
    setPriceRange({ min: '', max: '' });
    setDiscountRange({ min: '', max: '' });
    setMinRating('');
    setInStockOnly(false);
  };

  let genderTitle = "The Collection";

  if (searchQuery) {
    genderTitle = `Search results for "${searchQuery}"`;
  } else if (selectedTypes.length === 1 && gender === 'all') {
    const typeName = selectedTypes[0];
    genderTitle = typeName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Collection';
  } else if (gender && gender !== 'all') {
    genderTitle = `${gender.charAt(0).toUpperCase() + gender.slice(1)}'s Collection`;
  }

  const categoryDesc = `Explore our premium ${genderTitle.toLowerCase()}. Uncompromising quality and elevated silhouettes designed for the modern woman. Shop the latest trends, discover luxurious fabrics, and find your perfect fit with our exclusive buying guide.`;

  // Faceted navigation SEO: if any filters are active, noindex the page and
  // point the canonical back to the clean base URL to prevent index bloat.
  const hasActiveFilters = selectedTypes.length > 0 || selectedBrands.length > 0 || 
    selectedColors.length > 0 || selectedSizes.length > 0 || 
    priceRange.min || priceRange.max || discountRange.min || discountRange.max || 
    minRating || inStockOnly || selectedCategories.length > 0 || searchQuery;

  const baseUrl = `/category/${gender || 'all'}`;

  return (
    <div className="container mt-4 mb-5 fade-in category-page-container">
      <SEO 
        title={genderTitle}
        description={categoryDesc}
        url={baseUrl}
        canonical={baseUrl}
        type="website"
        noindex={!!hasActiveFilters}
        schema={generateCollectionSchema(genderTitle, categoryDesc, `https://www.owlstitch.com${baseUrl}`, products)}
      />
      {/* Dynamic Header */}
      <div className="category-header d-flex justify-between align-center mb-5 reveal active">
        <div>
          <h1 className="category-title">{genderTitle}</h1>
          <p className="text-muted mt-1">{totalProducts} Products Found</p>
        </div>
        <div className="sort-control">
          <label className="text-muted me-2" style={{ fontSize: '0.9rem' }}>Sort by:</label>
          <select className="form-input" value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto', padding: '0.5rem 2rem 0.5rem 1rem' }}>
            <option value="newest">New Arrivals</option>
            <option value="priceLow">Price: Low to High</option>
            <option value="priceHigh">Price: High to Low</option>
            <option value="popular">Popularity</option>
            <option value="rating">Customer Rating</option>
            <option value="discount">Discount: High to Low</option>
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

          {categoryTree.length > 0 && (
            <div className="filter-group mb-5">
              <h3 className="filter-title mb-3 font-heading">Categories</h3>
              <div className="filter-list">
                {categoryTree.map(cat => (
                  <label key={cat._id} className="filter-checkbox-label mb-2 d-flex align-center" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat._id)}
                      onChange={() => handleCategoryChange(cat._id)}
                      className="me-2"
                    />
                    <span style={{ fontSize: '0.9rem', color: selectedCategories.includes(cat._id) ? 'var(--color-primary)' : 'inherit', fontWeight: selectedCategories.includes(cat._id) ? '600' : '400' }}>
                      {cat.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {filterOptions.brands?.length > 0 && (
            <div className="filter-group mb-5">
              <h3 className="filter-title mb-3 font-heading">Brand</h3>
              <div className="filter-list">
                {filterOptions.brands.map(brand => (
                  <label key={brand} className="filter-checkbox-label mb-2 d-flex align-center" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandChange(brand)}
                      className="me-2"
                    />
                    <span style={{ fontSize: '0.9rem', color: selectedBrands.includes(brand) ? 'var(--color-primary)' : 'inherit', fontWeight: selectedBrands.includes(brand) ? '600' : '400' }}>
                      {brand}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {filterOptions.colors?.length > 0 && (
            <div className="filter-group mb-5">
              <h3 className="filter-title mb-3 font-heading">Color</h3>
              <div className="filter-list">
                {filterOptions.colors.map(color => (
                  <label key={color} className="filter-checkbox-label mb-2 d-flex align-center" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color)}
                      onChange={() => handleColorChange(color)}
                      className="me-2"
                    />
                    <span style={{ fontSize: '0.9rem', color: selectedColors.includes(color) ? 'var(--color-primary)' : 'inherit', fontWeight: selectedColors.includes(color) ? '600' : '400', textTransform: 'capitalize' }}>
                      {color}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {filterOptions.sizes?.length > 0 && (
            <div className="filter-group mb-5">
              <h3 className="filter-title mb-3 font-heading">Size</h3>
              <div className="filter-list filter-list--swatches">
                {filterOptions.sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`size-swatch ${selectedSizes.includes(size) ? 'active' : ''}`}
                    onClick={() => handleSizeChange(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          <div className="filter-group mb-5">
            <h3 className="filter-title mb-3 font-heading">Discount</h3>
            <div className="filter-list">
              {discountOptions.map((opt, i) => (
                <label key={i} className="filter-radio-label mb-2 d-flex align-center" style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="discount"
                    checked={discountRange.min === opt.min && discountRange.max === opt.max}
                    onChange={() => setDiscountRange({ min: opt.min, max: opt.max })}
                    className="me-2"
                  />
                  <span style={{ fontSize: '0.9rem', color: (discountRange.min === opt.min && discountRange.max === opt.max) ? 'var(--color-primary)' : 'inherit', fontWeight: (discountRange.min === opt.min && discountRange.max === opt.max) ? '600' : '400' }}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group mb-5">
            <h3 className="filter-title mb-3 font-heading">Customer Rating</h3>
            <div className="filter-list">
              {ratingOptions.map((opt, i) => (
                <label key={i} className="filter-radio-label mb-2 d-flex align-center" style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === opt.value}
                    onChange={() => setMinRating(opt.value)}
                    className="me-2"
                  />
                  <span style={{ fontSize: '0.9rem', color: minRating === opt.value ? 'var(--color-primary)' : 'inherit', fontWeight: minRating === opt.value ? '600' : '400' }}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="filter-group mb-5">
            <h3 className="filter-title mb-3 font-heading">Availability</h3>
            <div className="filter-list">
              <label className="filter-checkbox-label mb-2 d-flex align-center" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={() => setInStockOnly(prev => !prev)}
                  className="me-2"
                />
                <span style={{ fontSize: '0.9rem', color: inStockOnly ? 'var(--color-primary)' : 'inherit', fontWeight: inStockOnly ? '600' : '400' }}>
                  In Stock Only
                </span>
              </label>
            </div>
          </div>

          <button
            className="btn btn-outline w-100 btn-sm"
            onClick={clearAllFilters}
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
              <button onClick={clearAllFilters} className="btn btn-primary">
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
