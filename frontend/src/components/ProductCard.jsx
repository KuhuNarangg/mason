import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice } from '../utils/formatPrice';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const [isHovered, setIsHovered] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const wishlisted = isWishlisted(product._id);
  const inStock = product.variants.some(v => v.stock > 0);
  const firstVariant = product.variants.find(v => v.stock > 0) || product.variants[0];

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (inStock && firstVariant) {
      addToCart(product._id, firstVariant.size, firstVariant.color, 1);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggle(product._id);
  };

  const NO_IMAGE = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22400%22%20viewBox%3D%220%200%20300%20400%22%3E%3Crect%20fill%3D%22%23F5EDE4%22%20width%3D%22300%22%20height%3D%22400%22%2F%3E%3Ctext%20fill%3D%22%23A99B90%22%20font-family%3D%22serif%22%20font-size%3D%2216%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%225%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';

  const primaryImg = product.images?.[0] || NO_IMAGE;
  const secondaryImg = product.images?.length > 1 ? product.images[1] : primaryImg;

  return (
    <Link
      to={`/product/${product.slug}`}
      className="mason-product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-image-container">
        {/* Primary Image */}
        <img
          src={primaryImg}
          alt={product.name}
          className={`product-image primary ${imgLoaded ? 'loaded' : ''}`}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE; }}
        />
        {/* Secondary Image (hover) — eager loaded so hover is instant */}
        {secondaryImg !== primaryImg && (
          <img
            src={secondaryImg}
            alt={product.name}
            className={`product-image secondary ${isHovered ? 'visible' : ''}`}
            loading="eager"
            fetchPriority="low"
            onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE; }}
          />
        )}

        {/* Shimmer placeholder */}
        {!imgLoaded && <div className="image-shimmer" />}

        {/* Badges */}
        <div className="product-badges">
          {product.isTrending && <span className="badge trending">Trending</span>}
          {product.isFeatured && <span className="badge featured">New</span>}
        </div>

        {/* Wishlist */}
        <button
          className={`wishlist-btn ${wishlisted ? 'active' : ''} ${(isHovered || wishlisted) ? 'visible' : ''}`}
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
        >
          <Heart size={18} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Quick Add */}
        <div className={`quick-add ${isHovered ? 'visible' : ''}`}>
          <button
            className="quick-add-btn"
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            <ShoppingBag size={16} />
            {inStock ? 'Add to Bag' : 'Out of Stock'}
          </button>
        </div>
      </div>

      <div className="product-details">
        <span className="product-brand">{product.brand}</span>
        <h3 className="product-name">{product.name}</h3>
        <div className="product-pricing">
          <span className="product-price">{formatPrice(product.price)}</span>
          {product.discount > 0 && (
            <>
              <span className="product-original">{formatPrice(product.originalPrice)}</span>
              <span className="product-discount">{product.discount}% off</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
