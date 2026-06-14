import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Package, Store as StoreIcon } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import './StorePage.css';

const StorePage = () => {
  const { slug } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [productCount, setProductCount] = useState(0);
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/vendor/store/${slug}?sort=${sort}&limit=48`);
        setVendor(data.vendor);
        setProducts(data.products);
        setProductCount(data.productCount);
      } catch (err) {
        if (err.response?.status === 404) setNotFound(true);
        console.error('Failed to fetch store', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [slug, sort]);

  if (loading) {
    return (
      <div className="container mt-4 mb-5 text-center py-5">
        <div className="spinner mb-3"></div>
        <p className="text-muted">Loading store...</p>
      </div>
    );
  }

  if (notFound || !vendor) {
    return (
      <div className="container mt-4 mb-5 text-center py-5 reveal active">
        <StoreIcon size={48} strokeWidth={1} style={{ opacity: 0.3 }} className="mb-3" />
        <h3 className="font-heading">Store not found</h3>
        <p className="text-muted">This vendor store doesn't exist or is no longer active.</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Store Banner */}
      <div className="store-banner" style={vendor.storeBanner ? { backgroundImage: `url(${vendor.storeBanner})` } : {}}>
        <div className="store-banner__overlay" />
      </div>

      <div className="container">
        <div className="store-header reveal active">
          <div className="store-header__avatar">
            {vendor.avatar ? (
              <img src={vendor.avatar} alt={vendor.name} />
            ) : (
              <span>{vendor.name?.charAt(0)?.toUpperCase()}</span>
            )}
          </div>
          <div className="store-header__info">
            <h1 className="store-header__name font-heading">{vendor.name}</h1>
            {vendor.storeDescription && <p className="store-header__desc text-muted">{vendor.storeDescription}</p>}
            <div className="store-header__meta">
              <span className="store-meta-item">
                <Star size={16} fill={vendor.rating > 0 ? 'currentColor' : 'none'} />
                {vendor.rating ? vendor.rating.toFixed(1) : 'New'} {vendor.totalReviews > 0 && `(${vendor.totalReviews} reviews)`}
              </span>
              <span className="store-meta-item">
                <Package size={16} />
                {productCount} Product{productCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="category-header d-flex justify-between align-center mb-5 reveal active">
          <h2 className="category-title" style={{ fontSize: '1.5rem' }}>All Products</h2>
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

        <div className="products-container mb-5">
          {products.length === 0 ? (
            <div className="text-center py-5 w-100 reveal active">
              <h3 className="font-heading">No products yet</h3>
              <p className="text-muted">This store hasn't added any products yet.</p>
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

export default StorePage;
