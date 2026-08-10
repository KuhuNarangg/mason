import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Truck, RotateCcw, Star, X, Ruler, ShieldCheck, Ban, Camera, Sparkles } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/formatPrice';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/Breadcrumbs';
import SEO from '../components/SEO';
import VirtualTryOnModal from '../components/VirtualTryOnModal';
import WeightFitModal, { calculateRecommendedSize, isBottomwearType } from '../components/WeightFitModal';
import { generateProductSchema, generateBreadcrumbSchema, generateProductGroupSchema, generateImageObjectSchema } from '../utils/schema';
import './ProductDetail.css';

// Default size guides by type + gender
const DEFAULT_SIZE_GUIDES = {
  'men-shirt': [
    { size: 'S', chest: '91-96', waist: '76-81', hip: '–', length: '70' },
    { size: 'M', chest: '97-102', waist: '82-87', hip: '–', length: '72' },
    { size: 'L', chest: '103-108', waist: '88-93', hip: '–', length: '74' },
    { size: 'XL', chest: '109-114', waist: '94-99', hip: '–', length: '76' },
    { size: 'XXL', chest: '115-120', waist: '100-105', hip: '–', length: '78' },
  ],
  'men-tshirt': [
    { size: 'S', chest: '91-96', waist: '–', hip: '–', length: '68' },
    { size: 'M', chest: '97-102', waist: '–', hip: '–', length: '70' },
    { size: 'L', chest: '103-108', waist: '–', hip: '–', length: '72' },
    { size: 'XL', chest: '109-114', waist: '–', hip: '–', length: '74' },
    { size: 'XXL', chest: '115-120', waist: '–', hip: '–', length: '76' },
  ],
  'men-trousers': [
    { size: '28', chest: '–', waist: '71', hip: '89', length: '100' },
    { size: '30', chest: '–', waist: '76', hip: '94', length: '102' },
    { size: '32', chest: '–', waist: '81', hip: '99', length: '104' },
    { size: '34', chest: '–', waist: '86', hip: '104', length: '106' },
    { size: '36', chest: '–', waist: '91', hip: '109', length: '108' },
  ],
  'men-kurta': [
    { size: 'S', chest: '96', waist: '91', hip: '–', length: '96' },
    { size: 'M', chest: '101', waist: '96', hip: '–', length: '99' },
    { size: 'L', chest: '106', waist: '101', hip: '–', length: '102' },
    { size: 'XL', chest: '112', waist: '106', hip: '–', length: '105' },
    { size: 'XXL', chest: '117', waist: '112', hip: '–', length: '108' },
  ],
  'women-dress': [
    { size: 'XS', chest: '81', waist: '63', hip: '89', length: '88' },
    { size: 'S', chest: '86', waist: '68', hip: '94', length: '90' },
    { size: 'M', chest: '91', waist: '73', hip: '99', length: '92' },
    { size: 'L', chest: '96', waist: '78', hip: '104', length: '94' },
    { size: 'XL', chest: '101', waist: '83', hip: '109', length: '96' },
  ],
  'women-top': [
    { size: 'XS', chest: '81', waist: '63', hip: '–', length: '56' },
    { size: 'S', chest: '86', waist: '68', hip: '–', length: '58' },
    { size: 'M', chest: '91', waist: '73', hip: '–', length: '60' },
    { size: 'L', chest: '96', waist: '78', hip: '–', length: '62' },
    { size: 'XL', chest: '101', waist: '83', hip: '–', length: '64' },
  ],
  'women-kurta': [
    { size: 'S', chest: '86', waist: '68', hip: '94', length: '102' },
    { size: 'M', chest: '91', waist: '73', hip: '99', length: '105' },
    { size: 'L', chest: '96', waist: '78', hip: '104', length: '108' },
    { size: 'XL', chest: '101', waist: '83', hip: '109', length: '111' },
    { size: 'XXL', chest: '106', waist: '88', hip: '114', length: '114' },
  ],
  'women-ethnic': [
    { size: 'S', chest: '86', waist: '68', hip: '94', length: '102' },
    { size: 'M', chest: '91', waist: '73', hip: '99', length: '105' },
    { size: 'L', chest: '96', waist: '78', hip: '104', length: '108' },
    { size: 'XL', chest: '101', waist: '83', hip: '109', length: '111' },
    { size: 'XXL', chest: '106', waist: '88', hip: '114', length: '114' },
  ],
  'kids-default': [
    { size: '2-3Y', chest: '53', waist: '50', hip: '–', length: '38' },
    { size: '4-5Y', chest: '58', waist: '53', hip: '–', length: '42' },
    { size: '6-7Y', chest: '63', waist: '56', hip: '–', length: '48' },
    { size: '8-9Y', chest: '68', waist: '59', hip: '–', length: '54' },
    { size: '10-12Y', chest: '73', waist: '62', hip: '–', length: '60' },
  ],
  'default': [
    { size: 'S', chest: '88-93', waist: '73-78', hip: '88-93', length: '68' },
    { size: 'M', chest: '94-99', waist: '79-84', hip: '94-99', length: '70' },
    { size: 'L', chest: '100-105', waist: '85-90', hip: '100-105', length: '72' },
    { size: 'XL', chest: '106-111', waist: '91-96', hip: '106-111', length: '74' },
    { size: 'XXL', chest: '112-117', waist: '97-102', hip: '112-117', length: '76' },
  ],
};

const getSizeGuide = (product) => {
  if (product.sizeGuide && product.sizeGuide.length > 0) return product.sizeGuide;
  const key = `${product.gender}-${product.type}`;
  if (DEFAULT_SIZE_GUIDES[key]) return DEFAULT_SIZE_GUIDES[key];
  if (product.gender === 'kids') return DEFAULT_SIZE_GUIDES['kids-default'];
  return DEFAULT_SIZE_GUIDES['default'];
};

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  const { cart, addToCart, updateItem, removeItem } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { isAuth, user } = useAuth();

  const [notifyEmail, setNotifyEmail] = useState('');
  const [submittingRestock, setSubmittingRestock] = useState(false);
  const [restockMessage, setRestockMessage] = useState('');

  useEffect(() => {
    if (user?.email) {
      setNotifyEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(slug);
        const url = isMongoId ? `/products/${slug}` : `/products/slug/${slug}`;
        const { data } = await api.get(url);
        setProduct(data.product);
        setActiveImage(0);
        if (data.product.variants?.length > 0) {
          const firstInStock = data.product.variants.find(v => v.stock > 0) || data.product.variants[0];
          setSelectedSize(firstInStock.size);
          setSelectedColor(firstInStock.color);
        }

        // Fetch related products
        try {
          const relRes = await api.get(`/products/${data.product._id}/related?limit=8`);
          setRelatedProducts(relRes.data.products);
        } catch { setRelatedProducts([]); }

        // Recently Viewed Logic
        try {
          const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
          const newViewed = viewed.filter(p => p._id !== data.product._id);
          newViewed.unshift({
            _id: data.product._id,
            name: data.product.name,
            slug: data.product.slug || data.product._id,
            thumbnail: data.product.images?.[0] || data.product.thumbnail,
            price: data.product.price,
            salePrice: data.product.salePrice,
            brand: data.product.brand
          });
          const limitedViewed = newViewed.slice(0, 10); // Keep last 10
          localStorage.setItem('recentlyViewed', JSON.stringify(limitedViewed));
          setRecentlyViewed(limitedViewed.filter(p => p._id !== data.product._id)); // Don't show current product in recently viewed
        } catch (err) {
          console.error('Recently viewed error', err);
        }

      } catch (err) {
        console.error('Failed to fetch product', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) return <div className="container product-detail-container text-center">Loading product details...</div>;
  if (!product) return <div className="container product-detail-container text-center"><h2>Product not found</h2><p>The product you are looking for does not exist or has been removed.</p></div>;

  const variants = product.variants || [];
  const uniqueSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const uniqueColors = [...new Set(variants.map(v => v.color).filter(Boolean))];
  const currentVariant = variants.find(v => v.size === selectedSize && v.color === selectedColor) || variants[0];
  const isOutOfStock = !currentVariant || currentVariant.stock === 0;

  const handleAddToCart = () => {
    if (currentVariant && !isOutOfStock) {
      addToCart(product._id, selectedSize, selectedColor, 1);
    }
  };

  const handleNotifyRestock = async (e) => {
    e.preventDefault();
    if (!notifyEmail || !currentVariant) return;

    setSubmittingRestock(true);
    setRestockMessage('');
    try {
      const { data } = await api.post(`/products/${product._id}/notify-restock`, {
        variantId: currentVariant._id,
        size: selectedSize,
        color: selectedColor,
        email: notifyEmail
      });
      setRestockMessage(data.message);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to submit subscription request. Please try again.';
      setRestockMessage(errMsg);
    } finally {
      setSubmittingRestock(false);
    }
  };

  const cartItem = cart?.items?.find(
    i => i.product?._id === product._id && i.variantSize === selectedSize && i.variantColor === selectedColor
  );

  const wishlisted = isWishlisted(product._id);

  let displayImages = product.images || [];
  if (selectedColor) {
    const filtered = displayImages.filter(img => img.toLowerCase().includes(selectedColor.toLowerCase()));
    if (filtered.length > 0) {
      displayImages = filtered;
    }
  }

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingPhotos(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data.url) uploadedUrls.push(data.url);
      }
      setReviewPhotos(prev => [...prev, ...uploadedUrls]);
    } catch (err) {
      alert('Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/products/${product._id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment,
        photos: reviewPhotos
      });
      alert(data.message || 'Review submitted successfully. It is pending admin approval.');
      setShowReviewModal(false);
      setReviewComment('');
      setReviewRating(5);
      setReviewPhotos([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const approvedReviews = product.reviews?.filter(r => r.isApproved) || [];

  return (
    <div className="container product-detail-container">
      <SEO 
        title={product.name} 
        description={product.description || product.seoDescription} 
        image={displayImages[0]} 
        type="product" 
        url={`/product/${product.slug || product._id}`} 
        product={product}
        schema={[
          generateProductSchema(product),
          generateBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: product.gender, path: `/category/${product.gender}` },
            { name: product.name, path: `/product/${product.slug || product._id}` }
          ]),
          generateProductGroupSchema(product),
          ...(generateImageObjectSchema(product) || [])
        ]}
      />
      <Breadcrumbs crumbs={[
        { name: "Home", path: "/" },
        { name: product.gender, path: `/category/${product.gender}` },
        { name: product.name, path: `/product/${product.slug || product._id}` }
      ]} />

      <div className="product-detail-grid">
        <div className="product-gallery">
          <div className="thumbnail-list">
            {displayImages.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`${product.name} thumbnail ${idx}`} 
                title={`${product.name} - View ${idx + 1}`}
                className={`thumbnail ${activeImage === idx ? 'active' : ''}`}
                loading="lazy"
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>
          <div className="main-image-wrap">
            <img 
              src={displayImages[activeImage] || displayImages[0] || 'https://placehold.co/400?text=No+Image'} 
              alt={product.name} 
              title={product.name}
              className="main-image" 
              loading="eager"
            />
          </div>
        </div>

        <div className="product-info-panel">
          <h1 className="detail-brand">{product.brand}</h1>
          <h2 className="detail-title">{product.name}</h2>
          
          <div className="detail-price-row mt-3">
            <span className="detail-price">{formatPrice(product.price)}</span>
            {product.discount > 0 && (
              <>
                <span className="detail-original-price">{formatPrice(product.originalPrice)}</span>
                <span className="detail-discount">{product.discount}% OFF</span>
              </>
            )}
          </div>
          <p className="taxes-text text-muted">Inclusive of all taxes</p>

          <div className="divider my-4"></div>

          <div className="selector-group">
            <div className="d-flex justify-between mb-2">
              <span className="font-weight-bold">Select Size</span>
              <button className="text-primary btn-link" onClick={() => setShowSizeGuide(true)}>
                <Ruler size={14} style={{ marginRight: '4px', display: 'inline' }} />Size Chart
              </button>
            </div>

            {/* Recommended Size Banner */}
            {user?.weight || user?.preferredSize ? (
              <div className="p-rec-size-badge mb-3">
                <Sparkles size={15} className="p-rec-sparkle" />
                <span>
                  Recommended {isBottomwearType(product) ? 'Lowerwear' : 'Top/Dress'} Size: <strong>Size {calculateRecommendedSize(user.weight, user.fitPreference, product) || user.preferredSize}</strong>
                  {user.weight ? ` (Based on ${user.weight}kg weight profile)` : ''}
                </span>
                <button type="button" className="p-rec-edit-btn" onClick={() => setShowWeightModal(true)}>
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="p-rec-size-badge p-rec-size-prompt mb-3">
                <Ruler size={15} className="p-rec-sparkle" />
                <span>Find your perfect size based on weight</span>
                <button type="button" className="p-rec-edit-btn" onClick={() => setShowWeightModal(true)}>
                  Find My Size
                </button>
              </div>
            )}

            <div className="size-options">
              {uniqueSizes.map(size => {
                const hasStock = variants.some(v => v.size === size && v.stock > 0);
                return (
                  <button 
                    key={size}
                    className={`size-btn ${selectedSize === size ? 'active' : ''} ${!hasStock ? 'disabled' : ''}`}
                    onClick={() => hasStock && setSelectedSize(size)}
                    disabled={!hasStock}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="selector-group mt-4">
            <div className="mb-2"><span className="font-weight-bold">Select Color:</span> <span style={{ color: 'var(--rose-gold)' }}>{selectedColor}</span></div>
            <div className="color-options">
              {uniqueColors.map(color => {
                const hex = variants.find(v => v.color === color)?.colorHex || '#ccc';
                const isLight = (() => {
                  const h = hex.replace('#', '');
                  if (h.length !== 6) return false;
                  const r = parseInt(h.slice(0,2), 16);
                  const g = parseInt(h.slice(2,4), 16);
                  const b = parseInt(h.slice(4,6), 16);
                  return (r + g + b) / 3 > 220;
                })();
                return (
                  <button
                    key={color}
                    className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                    style={{
                      backgroundColor: hex,
                      border: selectedColor === color
                        ? '2px solid var(--ink)'
                        : isLight
                          ? '1.5px solid var(--champagne)'
                          : '2px solid transparent',
                    }}
                    onClick={() => {
                      setSelectedColor(color);
                      setActiveImage(0);
                    }}
                    title={color}
                  />
                );
              })}
            </div>
          </div>

          <div className="action-buttons mt-5">
            {cartItem ? (
              <button
                className="btn btn-primary add-to-bag-btn"
                onClick={() => navigate('/cart')}
              >
                <ShoppingBag size={18} />
                GO TO BAG
              </button>
            ) : (
              <button
                className="btn btn-primary add-to-bag-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                <ShoppingBag size={18} />
                {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}
              </button>
            )}

            <button
              className={`btn btn-outline wishlist-action-btn ${wishlisted ? 'wishlisted' : ''}`}
              onClick={() => toggle(product._id)}
            >
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              WISHLIST
            </button>

            <button
              className="btn btn-virtual-tryon"
              onClick={() => setIsTryOnOpen(true)}
              title="Open AR Virtual Fitting Room"
            >
              <Camera size={18} className="tryon-camera-icon" />
              <span>TRY IT ON YOURSELF</span>
              <Sparkles size={14} className="tryon-sparkle-badge" />
            </button>
          </div>

          {isOutOfStock && currentVariant && (
            <div className="restock-notify-box mt-4" style={{
              background: 'var(--champagne-light, #fdfaf6)',
              border: '1.5px solid var(--champagne, #e8dfd8)',
              borderRadius: '6px',
              padding: '1.25rem',
              maxWidth: '480px'
            }}>
              <p style={{ fontWeight: 600, color: 'var(--ink, #2c2421)', fontSize: '0.95rem', margin: '0 0 0.5rem' }}>
                Notify me when restocked
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted, #737373)', margin: '0 0 1rem', lineHeight: 1.4 }}>
                We'll email you as soon as this item (Size: {selectedSize} {selectedColor ? `· Color: ${selectedColor}` : ''}) is available.
              </p>
              
              <form onSubmit={handleNotifyRestock} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid var(--champagne, #e8dfd8)',
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: '#fff',
                    color: 'var(--ink)'
                  }}
                />
                <button
                  type="submit"
                  disabled={submittingRestock}
                  style={{
                    background: 'var(--ink, #2c2421)',
                    color: 'var(--ivory, #f9f6f0)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = 0.9}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                >
                  {submittingRestock ? 'Submitting...' : 'Submit'}
                </button>
              </form>
              
              {restockMessage && (
                <p style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  marginTop: '0.75rem',
                  color: (restockMessage.includes('already') || restockMessage.includes('reactivated')) ? '#c08a74' : '#16a34a',
                  margin: '0.75rem 0 0'
                }}>
                  {restockMessage}
                </p>
              )}
            </div>
          )}

          <div className="services-box mt-5">
            <div className="service-item">
              <Truck size={24} className="text-muted" />
              <div>
                <p className="font-weight-bold">Free Delivery</p>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>For orders above ₹1,000</p>
              </div>
            </div>
            <div className="service-item mt-3">
              {product.isReturnable === false ? (
                <>
                  <Ban size={24} style={{ color: '#dc2626' }} />
                  <div>
                    <p className="font-weight-bold" style={{ color: '#dc2626' }}>Non-Returnable</p>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>This product is not eligible for returns</p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldCheck size={24} style={{ color: '#16a34a' }} />
                  <div>
                    <p className="font-weight-bold" style={{ color: '#16a34a' }}>
                      {product.returnWindow || 14} Days Return Policy
                    </p>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>Easy returns, no questions asked</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="product-description mt-5">
            <h3>Product Details</h3>
            <p>
              {(() => {
                const desc = product.description || '';
                // Auto-link keywords for internal SEO
                const keywords = {
                  'silk': '/category/women?types=kurta',
                  'cotton': '/category/women?types=top',
                  'dresses': '/category/women?types=dress',
                  'custom tailoring': '/custom-tailoring'
                };
                
                let renderedDesc = [desc];
                Object.keys(keywords).forEach(kw => {
                  const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
                  renderedDesc = renderedDesc.flatMap(part => {
                    if (typeof part !== 'string') return part;
                    const splits = part.split(regex);
                    return splits.map((s, i) => {
                      if (s.toLowerCase() === kw) {
                        return <Link key={`${kw}-${i}`} to={keywords[kw]} style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>{s}</Link>;
                      }
                      return s;
                    });
                  });
                });
                return renderedDesc;
              })()}
            </p>
            <ul className="details-list mt-3 text-muted">
              <li>Premium quality fabric</li>
              <li>Style: {product.type}</li>
              <li>Brand: {product.brand}</li>
            </ul>
          </div>
          
          <div className="product-care mt-4">
            <h4 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Care Instructions</h4>
            <ul className="details-list text-muted" style={{ fontSize: '0.9rem' }}>
              <li>Machine wash cold with like colors</li>
              <li>Do not bleach or dry clean</li>
              <li>Tumble dry low or hang to dry</li>
              <li>Iron on reverse side if printed</li>
            </ul>
          </div>
          
          <div className="product-faqs mt-4" style={{ padding: '15px', background: '#fdfaf6', borderRadius: '8px', border: '1px solid var(--champagne)' }}>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Frequently Asked Questions</h4>
            <div style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
              <strong>Q: How long does shipping take?</strong>
              <p className="text-muted mb-2">A: Orders are usually processed within 24 hours. Delivery takes 3-5 business days.</p>
              
              <strong>Q: Can I exchange if the size doesn't fit?</strong>
              <p className="text-muted mb-2">A: Yes! We offer a hassle-free {product.returnWindow || 14}-day exchange policy for unused items.</p>
              
              <strong>Q: Are the colors exactly as shown?</strong>
              <p className="text-muted">A: We try our best to ensure color accuracy, but slight variations may occur due to screen settings.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="product-reviews-section">
        <div className="d-flex justify-between align-center mb-4">
          <h3 className="reviews-title" style={{ marginBottom: 0 }}>Customer Reviews ({approvedReviews.length})</h3>
          {isAuth ? (
            <button className="btn btn-outline" onClick={() => setShowReviewModal(true)}>
              Write a Review
            </button>
          ) : (
            <button className="btn btn-outline" onClick={() => navigate('/login')}>
              Log in to review
            </button>
          )}
        </div>
        
        {approvedReviews.length === 0 ? (
          <p className="text-muted text-center py-4">No reviews yet. Be the first to share your thoughts!</p>
        ) : (
          <div className="reviews-list">
            {approvedReviews.map((review) => (
              <div key={review._id} className="review-item">
                <div className="d-flex align-center justify-between mb-2">
                  <div className="font-weight-bold" style={{ fontWeight: '600' }}>{review.name} <span className="text-success small ms-2">✓ Verified Purchase</span></div>
                  <div className="text-muted small">
                    {new Date(review.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                  </div>
                </div>
                <div className="d-flex mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                      key={star} 
                      size={14} 
                      fill={star <= review.rating ? "#f59e0b" : "none"}
                      color={star <= review.rating ? "#f59e0b" : "#d1d5db"} 
                    />
                  ))}
                </div>
                {review.comment && <p className="mb-3 text-muted">{review.comment}</p>}
                
                {review.photos && review.photos.length > 0 && (
                  <div className="d-flex gap-2 flex-wrap mt-2">
                    {review.photos.map((photo, i) => (
                      <a href={photo} target="_blank" rel="noreferrer" key={i}>
                        <img 
                          src={photo} 
                          alt="Review attachment" 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} 
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <section className="related-products-section mt-5" style={{ background: '#fdfaf6', padding: '3rem 0', borderTop: '1px solid #eee' }}>
          <div className="section-header-center">
            <h2 className="section-title text-center">Complete The Look</h2>
            <div className="ethnic-accent"></div>
            <p className="section-subtitle text-center text-muted">Curated outfit suggestions to pair with this piece</p>
          </div>
          <div className="premium-product-grid px-4">
            {/* Show up to 4 related products as outfit suggestions */}
            {relatedProducts.slice(0, 4).map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {relatedProducts.length > 4 && (
        <section className="related-products-section mt-5">
          <div className="section-header-center">
            <h2 className="section-title text-center">You May Also Like</h2>
            <div className="ethnic-accent"></div>
            <p className="section-subtitle text-center text-muted">More pieces from this collection</p>
          </div>
          <div className="premium-product-grid px-4">
            {relatedProducts.slice(4, 8).map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {recentlyViewed.length > 0 && (
        <section className="related-products-section mt-5">
          <div className="section-header-center">
            <h2 className="section-title text-center">Recently Viewed</h2>
            <div className="ethnic-accent"></div>
            <p className="section-subtitle text-center text-muted">Pick up where you left off</p>
          </div>
          <div className="premium-product-grid">
            {recentlyViewed.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {showSizeGuide && (
        <div className="size-guide-overlay" onClick={() => setShowSizeGuide(false)}>
          <div className="size-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="size-guide-header">
              <div>
                <h3>Size Guide</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  {product.sizeGuide?.length > 0 ? 'Custom measurements for this product' : `Standard ${product.gender}'s ${product.type} sizing`} — All measurements in cm
                </p>
              </div>
              <button className="size-guide-close" onClick={() => setShowSizeGuide(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="size-guide-body">
              <table className="size-guide-table">
                <thead>
                  <tr>
                    <th>Size</th>
                    <th>Chest</th>
                    <th>Waist</th>
                    <th>Hip</th>
                    <th>Length</th>
                  </tr>
                </thead>
                <tbody>
                  {getSizeGuide(product).map((row, i) => (
                    <tr key={i} className={selectedSize === row.size ? 'active-size-row' : ''}>
                      <td><strong>{row.size}</strong></td>
                      <td>{row.chest || '–'}</td>
                      <td>{row.waist || '–'}</td>
                      <td>{row.hip || '–'}</td>
                      <td>{row.length || '–'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="size-guide-tips">
                <h4>How to Measure</h4>
                <ul>
                  <li><strong>Chest:</strong> Measure around the fullest part of your chest.</li>
                  <li><strong>Waist:</strong> Measure around your natural waistline.</li>
                  <li><strong>Hip:</strong> Measure around the fullest part of your hips.</li>
                  <li><strong>Length:</strong> Measure from the highest point of the shoulder to the hem.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <div className="size-guide-overlay" onClick={() => !submittingReview && setShowReviewModal(false)}>
          <div className="size-guide-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', padding: '10px' }}>
            <div className="size-guide-header">
              <h3>Write a Review</h3>
              <button className="size-guide-close" onClick={() => !submittingReview && setShowReviewModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="size-guide-body" style={{ padding: '2rem' }}>
              <form onSubmit={submitReview}>
                <div className="mb-4">
                  <label className="font-weight-bold d-block mb-3" style={{ fontSize: '1.4rem' }}>Rating</label>
                  <div className="d-flex gap-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={40}
                        style={{ cursor: 'pointer' }}
                        fill={star <= reviewRating ? "#f59e0b" : "none"}
                        color={star <= reviewRating ? "#f59e0b" : "#d1d5db"}
                        onClick={() => setReviewRating(star)}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="font-weight-bold d-block mb-3" style={{ fontSize: '1.4rem' }}>Photos (Optional)</label>
                  <div className="d-flex gap-2 flex-wrap mb-3">
                    {reviewPhotos.map((url, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img 
                          src={url} 
                          alt="preview" 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setReviewPhotos(prev => prev.filter((_, i) => i !== idx))}
                          style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '20px', height: '20px', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', cursor: 'pointer' }}
                        >×</button>
                      </div>
                    ))}
                    <label style={{ width: '80px', height: '80px', border: '2px dashed #ccc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f9fafb', margin: 0 }}>
                      {uploadingPhotos ? <span style={{fontSize: '0.9rem', color: '#666'}}>...</span> : <span style={{fontSize: '2.5rem', color: '#999', lineHeight: 1}}>+</span>}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                        disabled={uploadingPhotos}
                      />
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="font-weight-bold d-block mb-3" style={{ fontSize: '1.4rem' }}>Comment</label>
                  <textarea
                    className="m-search-input"
                    style={{ width: '100%', height: '140px', padding: '15px', border: '1px solid var(--champagne)', fontSize: '1.3rem', borderRadius: '8px', fontFamily: 'inherit', lineHeight: '1.5' }}
                    placeholder="Tell us what you think about this product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100" style={{ fontSize: '1.4rem', padding: '12px' }} disabled={submittingReview}>
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Virtual Fitting Room AR Modal */}
      {isTryOnOpen && (
        <VirtualTryOnModal 
          product={product} 
          onClose={() => setIsTryOnOpen(false)} 
        />
      )}

      {/* Weight & Fit Recommendation Calculator Modal */}
      {showWeightModal && (
        <WeightFitModal
          currentProduct={product}
          onClose={() => setShowWeightModal(false)}
          onSaveSuccess={(data) => {
            if (data.recommendedSize && uniqueSizes.includes(data.recommendedSize)) {
              setSelectedSize(data.recommendedSize);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProductDetail;
