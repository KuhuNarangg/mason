import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingBag, Truck, RotateCcw, Star, X, Ruler, ShieldCheck, Ban } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice } from '../utils/formatPrice';
import ProductCard from '../components/ProductCard';
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
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();

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

  const uniqueSizes = [...new Set(product.variants.map(v => v.size))];
  const uniqueColors = [...new Set(product.variants.map(v => v.color))];
  const currentVariant = product.variants.find(v => v.size === selectedSize && v.color === selectedColor);
  const isOutOfStock = !currentVariant || currentVariant.stock === 0;

  const handleAddToCart = () => {
    if (currentVariant && !isOutOfStock) {
      addToCart(product._id, selectedSize, selectedColor, 1);
    }
  };

  const wishlisted = isWishlisted(product._id);

  return (
    <div className="container product-detail-container">
      {/* Breadcrumbs */}
      <div className="breadcrumbs mb-4">
        <Link to="/">Home</Link> / 
        <Link to={`/category/${product.gender}`}> {product.gender} </Link> / 
        <span className="text-muted"> {product.name}</span>
      </div>

      <div className="product-detail-grid">
        {/* Images */}
        <div className="product-gallery">
          <div className="thumbnail-list">
            {product.images.map((img, idx) => (
              <img 
                key={idx} 
                src={img} 
                alt={`${product.name} ${idx}`} 
                className={`thumbnail ${activeImage === idx ? 'active' : ''}`}
                onClick={() => setActiveImage(idx)}
              />
            ))}
          </div>
          <div className="main-image-wrap">
            <img src={product.images?.[activeImage] || 'https://via.placeholder.com/400?text=No+Image'} alt={product.name} className="main-image" />
          </div>
        </div>

        {/* Info */}
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

          {/* Size Selector */}
          <div className="selector-group">
            <div className="d-flex justify-between mb-2">
              <span className="font-weight-bold">Select Size</span>
              <button className="text-primary btn-link" onClick={() => setShowSizeGuide(true)}>
                <Ruler size={14} style={{ marginRight: '4px', display: 'inline' }} />Size Chart
              </button>
            </div>
            <div className="size-options">
              {uniqueSizes.map(size => {
                const hasStock = product.variants.some(v => v.size === size && v.stock > 0);
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

          {/* Color Selector */}
          <div className="selector-group mt-4">
            <div className="mb-2"><span className="font-weight-bold">Select Color:</span> {selectedColor}</div>
            <div className="color-options">
              {uniqueColors.map(color => {
                const hex = product.variants.find(v => v.color === color)?.colorHex || '#ccc';
                return (
                  <button
                    key={color}
                    className={`color-btn ${selectedColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  />
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="action-buttons mt-5">
            <button 
              className="btn btn-primary add-to-bag-btn" 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingBag size={18} />
              {isOutOfStock ? 'OUT OF STOCK' : 'ADD TO BAG'}
            </button>
            
            <button 
              className={`btn btn-outline wishlist-action-btn ${wishlisted ? 'wishlisted' : ''}`}
              onClick={() => toggle(product._id)}
            >
              <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
              WISHLIST
            </button>
          </div>

          {/* Delivery & Services */}
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

          {/* Description */}
          <div className="product-description mt-5">
            <h3>Product Details</h3>
            <p>{product.description}</p>
            <ul className="details-list mt-3 text-muted">
              <li>Premium quality fabric</li>
              <li>Machine wash safe</li>
              <li>Style: {product.type}</li>
              <li>Brand: {product.brand}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="product-reviews-section">
        <h3 className="reviews-title">Customer Reviews ({product.numReviews})</h3>
        
        {product.reviews && product.reviews.length === 0 ? (
          <p className="text-muted text-center py-4">No reviews yet. Only customers who have received this item can leave a review.</p>
        ) : (
          <div className="reviews-list">
            {product.reviews?.map((review) => (
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

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="related-products-section">
          <div className="section-header-center">
            <h2 className="section-title text-center">You May Also Like</h2>
            <div className="ethnic-accent"></div>
            <p className="section-subtitle text-center text-muted">Handpicked recommendations based on this product</p>
          </div>
          <div className="premium-product-grid">
            {relatedProducts.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
      {/* Size Guide Modal */}
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
    </div>
  );
};

export default ProductDetail;
