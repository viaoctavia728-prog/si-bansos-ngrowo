import { useState, useEffect } from 'react';
import apiService from '../services/api';

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (nik, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.login(nik, password);
      if (res.access_token) {
        localStorage.setItem('token', res.access_token);
        setToken(res.access_token);
      }
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
        setUser(res.data);
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  return {
    user,
    token,
    isAuthenticated: !!token || !!user,
    loading,
    error,
    login,
    logout,
  };
}

export default useAuth;
