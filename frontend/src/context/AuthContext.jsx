import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('distrib_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('distrib_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Failed to verify token:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success) {
      const { token: receivedToken, user: receivedUser } = res.data;
      localStorage.setItem('distrib_token', receivedToken);
      localStorage.setItem('distrib_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('distrib_token');
    localStorage.removeItem('distrib_user');
    setToken(null);
    setUser(null);
  };

  const resetDemoData = async () => {
    try {
      const res = await api.post('/seed/reset');
      // refresh user profile
      const userRes = await api.get('/auth/me');
      if (userRes.data?.success) {
        setUser(userRes.data.user);
      }
      return res.data;
    } catch (err) {
      console.error('Reset seed data error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        resetDemoData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
