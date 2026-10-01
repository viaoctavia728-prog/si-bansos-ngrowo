import axios from 'axios';

// Base URL backend FastAPI (default http://localhost:8000)
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
export const getAssetUrl = (path) => path?.startsWith('http') ? path : `${API_BASE_URL}${path || ''}`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menyisipkan token autentikasi (jika ada)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor untuk menangani error response secara konsisten
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }

    let message = 'Terjadi kesalahan pada sistem.';
    if (error.response) {
      // Backend returned an error response
      message = error.response.data?.detail || error.response.data?.message || `Error ${error.response.status}`;
    } else if (error.request) {
      // No response received (backend down / network issue)
      message = 'Tidak dapat terhubung ke server backend. Pastikan server backend FastAPI dan MySQL sedang berjalan.';
    } else {
      message = error.message;
    }
    const apiError = new Error(message);
    apiError.status = error.response?.status;
    return Promise.reject(apiError);
  }
);

// ==================== AUTH SERVICE ====================
export const authService = {
  // Login dengan NIK dan Password
  async login(nik, password) {
    const payload = { nik, password };
    const response = await apiClient.post('/login', payload);
    const token = response.data?.access_token || response.data?.token;

    if (response.data?.data) {
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('access_token', token);
    }
    return response.data;
  },

  // Register Warga Baru
  async register(userData) {
    const response = await apiClient.post('/register', userData);
    return response.data;
  },

  // Dapatkan profil user tersimpan di session
  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // Ambil data user terbaru dari backend berdasarkan NIK
  async getUserByNik(nik) {
    const response = await apiClient.get(`/user/${nik}`);
    return response.data;
  },

  async getProfile() {
    const response = await apiClient.get('/auth/me');
    const profile = response.data;
    localStorage.setItem('user', JSON.stringify(profile));
    return profile;
  },

  async updateProfile(profileData) {
    const response = await apiClient.patch('/auth/me', profileData);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async updateProfilePhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/auth/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async removeProfilePhoto() {
    const response = await apiClient.delete('/auth/me/photo');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },

  async registerFcmToken(token) {
    const response = await apiClient.post('/notifications/fcm/token', { token });
    return response.data;
  },

  // Logout session
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
  },
};

// ==================== BANSOS SERVICE ====================
export const bansosService = {
  // Cek status bansos penerima berdasarkan NIK
  async cekBansosByNik(nik) {
    const response = await apiClient.get(`/cek-bansos/${nik}`);
    return response.data;
  },

  // Ambil daftar penerima bansos publik (bisa difilter RT/RW/search)
  async getPenerimaBansos(params = {}) {
    const response = await apiClient.get('/bansos/penerima', { params });
    return response.data;
  },
};

// ==================== PENGADUAN SERVICE ====================
export const pengaduanService = {
  async uploadBukti(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/pengaduan/upload-bukti', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.bukti_foto;
  },

  // Buat pengaduan baru
  async buatPengaduan(data) {
    const response = await apiClient.post('/pengaduan', data);
    return response.data;
  },

  // Tracking pengaduan berdasarkan nomor tiket
  async tracking(nomorTiket) {
    const response = await apiClient.get(`/pengaduan/tracking/${nomorTiket}`);
    return response.data;
  },

  // Ambil daftar pengaduan yang pernah dikirim oleh user
  async getByUser(idUser) {
    const response = await apiClient.get(`/pengaduan/user/${idUser}`);
    return response.data;
  },
};

// ==================== JADWAL SERVICE ====================
export const jadwalService = {
  // Ambil jadwal penyaluran bansos
  async getJadwal() {
    const response = await apiClient.get('/api/jadwal');
    return response.data;
  },
};

export const adminService = {
  async getWarga() {
    const response = await apiClient.get('/admin/warga');
    return response.data;
  },

  async getPengaduan(params = {}) {
    const response = await apiClient.get('/admin/pengaduan', { params });
    return response.data;
  },

  async updateStatus(idLaporan, payload) {
    const response = await apiClient.put(`/admin/pengaduan/${idLaporan}`, payload);
    return response.data;
  },

  async getAuditLogs() {
    const response = await apiClient.get('/admin/audit-logs');
    return response.data;
  },

  async sendNotification(payload) {
    const response = await apiClient.post('/notifications/fcm/send', payload);
    return response.data;
  },

  async sendNotificationToToken(payload) {
    const response = await apiClient.post('/notifications/fcm/send-to-token', payload);
    return response.data;
  },
};

export default apiClient;
