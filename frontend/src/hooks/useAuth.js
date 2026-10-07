import { useState } from 'react';
import { authService } from '../services/auth';

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('citizen_access_token') || localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (nik, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(nik, password);
      const accessToken = res.access_token || res.token;
      setToken(accessToken);
      setUser(res.data);
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
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
