import { adminApiClient } from '../apiClient';

const ADMIN_USER_KEY = 'admin_user';
const ADMIN_TOKEN_KEY = 'admin_access_token';
const LEGACY_SESSION_KEYS = ['user', 'token', 'access_token', 'citizen_access_token'];

function migrateLegacyAdminSession() {
  if (localStorage.getItem(ADMIN_TOKEN_KEY)) return;
  try {
    const legacyUser = JSON.parse(localStorage.getItem('user') || 'null');
    const legacyToken = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (legacyUser?.role === 'admin' && legacyToken) {
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(legacyUser));
      localStorage.setItem(ADMIN_TOKEN_KEY, legacyToken);
      LEGACY_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    LEGACY_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  }
}

export const adminAuthService = {
  async login(username, password) {
    const response = await adminApiClient.post('/login', { username, password });
    const data = response.data;
    const token = data?.access_token || data?.token;
    if (data?.data?.role !== 'admin' || !token) {
      throw new Error('Akun ini bukan akun admin. Gunakan akun petugas yang sudah terdaftar.');
    }

    this.logout();
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.data));
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    return data;
  },

  getCurrentUser() {
    migrateLegacyAdminSession();
    try {
      return JSON.parse(localStorage.getItem(ADMIN_USER_KEY) || 'null');
    } catch {
      localStorage.removeItem(ADMIN_USER_KEY);
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(this.getCurrentUser()?.role === 'admin' && localStorage.getItem(ADMIN_TOKEN_KEY));
  },

  logout() {
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },
};
