import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import './Wishlist.css';

const Wishlist = () => {
  const { wishlist, toggle } = useWishlist();
  const { addToCart } = useCart();
  const { isAuth } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuth) {
      navigate('/login');
      return;
    }

    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/products/wishlist/details');
        setProducts(data.products);
      } catch (err) {
        console.error('Failed to fetch wishlist products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlist, isAuth, navigate]);

  const handleRemove = (id) => {
    toggle(id);
    setProducts(prev => prev.filter(p => p._id !== id));
  };

  const handleMoveToCart = (product) => {
    // We'll use the first available size/color for simplicity
    const size = product.variants?.[0]?.size || 'M';
    const color = product.variants?.[0]?.color || 'Default';
    
    addToCart(product, 1, size, color);
    handleRemove(product._id);
  };

  if (loading) {
    return <div className="container wishlist-page-container text-center fade-in">Loading wishlist...</div>;
  }

  if (products.length === 0) {
    return (
      <div className="container wishlist-page-container text-center fade-in reveal active" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 2rem' }}>
        <h2 className="font-heading mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: 'var(--ink)', lineHeight: '1.2' }}>Playing hard to get?</h2>
        <p className="text-muted mb-5" style={{ fontSize: 'var(--text-lg)', maxWidth: '500px', lineHeight: '1.6' }}>Your wishlist is completely empty. Let's find you something you can't resist.</p>
        <Link to="/category/all" className="btn btn-primary" style={{ padding: '1.2rem 3rem', letterSpacing: '0.1em' }}>
          EXPLORE COLLECTIONS
        </Link>
      </div>
    );
  }

  return (
    <div className="container wishlist-page-container fade-in">
      <div className="section-header mb-5 d-flex justify-between align-center">
        <div>
          <h1 className="font-heading mb-2">My Wishlist</h1>
          <p className="text-muted">{products.length} Items</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-outline-primary btn-sm d-flex align-center gap-2" style={{ background: 'none', border: '1px solid', cursor: 'pointer' }}>
          <ArrowLeft size={18} /> BACK
        </button>
      </div>

      <div className="wishlist-grid">
        {products.map(product => {
          const defaultSize = product.variants?.[0]?.size || 'M';
          return (
            <div key={product._id} className="wishlist-card">
              <Link to={`/product/${product.slug}`}>
                <img src={product.images?.[0] || 'https://via.placeholder.com/200?text=No+Image'} alt={product.name} className="wishlist-card-img" />
              </Link>
              <div className="wishlist-card-info">
                <span className="wishlist-brand">{product.brand}</span>
                <Link to={`/product/${product.slug}`} className="wishlist-title">{product.name}</Link>
                <span className="wishlist-price">{formatPrice(product.price)}</span>
                
                <div className="wishlist-actions">
                  {product.variants?.length > 0 && (
                    <select 
                      className="wishlist-size-select"
                      onChange={(e) => {
                        product._selectedSize = e.target.value;
                      }}
                      defaultValue={defaultSize}
                    >
                      {product.variants.map((v, i) => (
                        <option key={i} value={v.size}>Size: {v.size}</option>
                      ))}
                    </select>
                  )}
                  
                  <div className="wishlist-btn-row">
                    <button 
                      className="wishlist-btn primary"
                      onClick={() => {
                        const size = product._selectedSize || defaultSize;
                        const color = product.variants?.[0]?.color || 'Default';
                        addToCart(product._id, size, color, 1);
                        handleRemove(product._id);
                      }}
                    >
                      Add To Bag
                    </button>
                    <button 
                      className="wishlist-btn secondary"
                      onClick={() => handleRemove(product._id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
