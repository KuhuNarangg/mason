import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user, isAuth } = useAuth();
  const [wishlist, setWishlist] = useState(user?.wishlist || []);

  useEffect(() => {
    if (user?.wishlist) {
      setWishlist(user.wishlist);
    } else if (!isAuth) {
      setWishlist([]);
    }
  }, [user, isAuth]);

  const toggle = async (productId) => {
    if (!isAuth) { toast.error('Please login to use wishlist'); return; }
    try {
      const { data } = await api.put(`/products/${productId}/wishlist`);
      setWishlist(data.wishlist);
      
      // Update user in localStorage with new wishlist
      const updatedUser = { ...user, wishlist: data.wishlist };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      const isAdded = data.wishlist.includes(productId);
      toast.success(isAdded ? '❤️ Added to wishlist' : 'Removed from wishlist');
    } catch { toast.error('Failed to update wishlist'); }
  };

  const isWishlisted = (id) => wishlist.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlist, toggle, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
