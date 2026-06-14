import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice } from '../utils/formatPrice';
import toast from 'react-hot-toast';
import './Cart.css';

const Cart = () => {
  const { cart, updateItem, removeItem, totalItems, totalAmount } = useCart();
  const { toggle, isWishlisted } = useWishlist();

  const handleSaveForLater = (item) => {
    if (!isWishlisted(item.product._id)) {
      toggle(item.product._id);
    } else {
      toast.success('Already in wishlist!');
    }
    removeItem(item._id);
  };

  if (totalItems === 0) {
    return (
      <div className="container cart-page-container text-center cart-empty">
        <div className="empty-cart-icon mb-4">🛒</div>
        <h2>Your Bag is Empty</h2>
        <p className="text-muted mt-2 mb-4">Looks like you haven't added anything to your bag yet.</p>
        <Link to="/" className="btn btn-primary px-5">Continue Shopping</Link>
      </div>
    );
  }

  const shipping = totalAmount > 1000 ? 0 : 99;
  const finalAmount = totalAmount + shipping;

  return (
    <div className="container cart-page-container">
      <h1 className="cart-title mb-4">Shopping Bag ({totalItems} items)</h1>

      <div className="cart-layout">
        <div className="cart-items">
          {cart.items.map(item => {
            if (!item.product) {
              return (
                <div key={item._id} className="cart-item">
                  <div className="cart-item-details">
                    <p className="text-muted">This product is no longer available.</p>
                    <button type="button" className="remove-btn mt-3" onClick={() => removeItem(item._id)}>
                      <Trash2 size={16} />
                      <span>REMOVE ITEM</span>
                    </button>
                  </div>
                </div>
              );
            }
            return (
            <div key={item._id} className="cart-item">
              <Link to={`/product/${item.product.slug}`} className="cart-item-img">
                <img src={item.product.images?.[0] || item.product.thumbnail || 'https://placehold.co/150?text=No+Image'} alt={item.product.name} />
              </Link>
              
              <div className="cart-item-details">
                <div className="d-flex justify-between align-start">
                  <div>
                    <h3 className="item-brand">{item.product.brand}</h3>
                    <Link to={`/product/${item.product.slug}`} className="item-name">{item.product.name}</Link>
                    <div className="item-variants text-muted mt-1">
                      <span>Size: <b>{item.variantSize}</b></span>
                      <span className="mx-2">|</span>
                      <span>Color: <b>{item.variantColor}</b></span>
                    </div>
                  </div>
                  <div className="item-price">{formatPrice(item.price)}</div>
                </div>

                <div className="d-flex justify-between align-center mt-4">
                  <div className="quantity-control">
                    <button 
                      onClick={() => updateItem(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus size={16} />
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateItem(item._id, item.quantity + 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                  
                  <div className="d-flex align-center" style={{ gap: '1rem' }}>
                    <button type="button" className="save-later-btn" onClick={() => handleSaveForLater(item)}>
                      <Heart size={16} />
                      <span>SAVE FOR LATER</span>
                    </button>
                    <button type="button" className="remove-btn" onClick={() => removeItem(item._id)}>
                      <Trash2 size={16} />
                      <span>REMOVE</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>

        <div className="cart-summary">
          <div className="summary-card">
            <h3 className="summary-title mb-3">Price Details ({totalItems} items)</h3>
            
            <div className="summary-row">
              <span>Total MRP</span>
              <span>{formatPrice(totalAmount)}</span>
            </div>
            
            <div className="summary-row">
              <span>Shipping Fee</span>
              <span className={shipping === 0 ? "text-success" : ""}>
                {shipping === 0 ? "FREE" : formatPrice(shipping)}
              </span>
            </div>

            <div className="divider my-3"></div>
            
            <div className="summary-row total-row">
              <span>Total Amount</span>
              <span>{formatPrice(finalAmount)}</span>
            </div>

            <Link to="/checkout" className="place-order-btn">
              PLACE ORDER <ArrowRight size={16} />
            </Link>
          </div>

          <div className="safe-checkout mt-4 d-flex align-center gap-2 text-muted justify-center">
            <ShieldCheck size={24} className="text-success" />
            <span style={{fontSize: '0.85rem'}}>100% Safe and Secure Payments.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
