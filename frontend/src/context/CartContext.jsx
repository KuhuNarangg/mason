import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuth } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [cartOpen, setCartOpen] = useState(false);

  const fetchCart = async () => {
    if (!isAuth) return;
    try {
      const { data } = await api.get('/cart');
      setCart(data.cart || { items: [] });
    } catch { /* silent */ }
  };

  useEffect(() => { fetchCart(); }, [isAuth]);

  const addToCart = async (productId, variantSize, variantColor, quantity = 1) => {
    try {
      const { data } = await api.post('/cart', { productId, variantSize, variantColor, quantity });
      setCart(data.cart);
      setCartOpen(true);
      toast.success('Added to cart! 🛍️');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      const { data } = await api.put(`/cart/${itemId}`, { quantity });
      setCart(data.cart);
    } catch { toast.error('Update failed'); }
  };

  const removeItem = async (itemId) => {
    try {
      const { data } = await api.delete(`/cart/${itemId}`);
      setCart(data.cart);
      toast.success('Item removed');
    } catch { toast.error('Remove failed'); }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCart({ items: [] });
    } catch { /* silent */ }
  };

  const totalItems = cart.items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const totalAmount = cart.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, cartOpen, setCartOpen, addToCart, updateItem, removeItem, clearCart, totalItems, totalAmount, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
