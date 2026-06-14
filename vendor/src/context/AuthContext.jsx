import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [vendor, setVendor] = useState(() => {
    const saved = localStorage.getItem('vendorUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/vendor/profile');
      setVendor(data.vendor);
      localStorage.setItem('vendorUser', JSON.stringify(data.vendor));
    } catch {
      // ignore — token may be invalid, interceptor handles redirect
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('vendorToken');
    if (token) {
      refreshProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshProfile]);

  const login = (token, user) => {
    localStorage.setItem('vendorToken', token);
    localStorage.setItem('vendorUser', JSON.stringify(user));
    setVendor(user);
  };

  const logout = () => {
    localStorage.removeItem('vendorToken');
    localStorage.removeItem('vendorUser');
    setVendor(null);
  };

  return (
    <AuthContext.Provider value={{ vendor, setVendor, login, logout, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
