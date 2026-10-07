import { citizenApiClient } from './apiClient';

const USER_ROLES = new Set(['user', 'warga']);

function persistCitizenSession(data) {
  const token = data?.access_token || data?.token;
  if (!token || !data?.data || !USER_ROLES.has(data.data.role)) {
    throw new Error('Akun admin harus masuk melalui Portal Admin.');
  }
  localStorage.setItem('user', JSON.stringify(data.data));
  localStorage.setItem('citizen_access_token', token);
  localStorage.setItem('token', token);
  localStorage.setItem('access_token', token);
  return data;
}

export const authService = {
  async login(nik, password) {
    const response = await citizenApiClient.post('/login', { nik, password });
    return persistCitizenSession(response.data);
  },

  async register(userData) {
    const response = await citizenApiClient.post('/register', userData);
    return response.data;
  },

  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  async getUserByNik(nik) {
    const response = await citizenApiClient.get(`/user/${nik}`);
    return response.data;
  },

  async getProfile() {
    const response = await citizenApiClient.get('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await citizenApiClient.patch('/auth/me', profileData);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async updateProfilePhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await citizenApiClient.post('/auth/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async removeProfilePhoto() {
    const response = await citizenApiClient.delete('/auth/me/photo');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async registerFcmToken(token) {
    const response = await citizenApiClient.post('/notifications/fcm/token', { token });
    return response.data;
  },

  logout() {
    ['user', 'citizen_access_token', 'token', 'access_token'].forEach((key) => localStorage.removeItem(key));
  },
};
