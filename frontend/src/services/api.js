import axios from 'axios';

// Base URL backend FastAPI (default http://localhost:8000)
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

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
    return Promise.reject(new Error(message));
  }
);

// ==================== AUTH SERVICE ====================
export const authService = {
  // Login dengan NIK dan Password
  async login(nik, password) {
    const payload = { nik, password };
    const response = await apiClient.post('/api/login', payload);
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
    const response = await apiClient.post('/api/register', userData);
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
    const response = await apiClient.get(`/api/user/${nik}`);
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
    const response = await apiClient.get(`/api/bansos/cek/${nik}`);
    return response.data;
  },

  // Ambil daftar penerima bansos publik (bisa difilter RT/RW/search)
  async getPenerimaBansos(params = {}) {
    const response = await apiClient.get('/api/bansos/penerima', { params });
    return response.data;
  },
};

// ==================== PENGADUAN SERVICE ====================
export const pengaduanService = {
  // Buat pengaduan baru
  async buatPengaduan(data) {
    const response = await apiClient.post('/api/pengaduan', data);
    return response.data;
  },

  // Tracking pengaduan berdasarkan nomor tiket
  async tracking(nomorTiket) {
    const response = await apiClient.get(`/api/pengaduan/tracking/${nomorTiket}`);
    return response.data;
  },

  // Ambil daftar pengaduan yang pernah dikirim oleh user
  async getByUser(idUser) {
    const response = await apiClient.get(`/api/pengaduan/user/${idUser}`);
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
    const response = await apiClient.get('/api/admin/warga');
    return response.data;
  },

  async getPengaduan() {
    const response = await apiClient.get('/api/admin/pengaduan');
    return response.data;
  },

  async updateStatus(idLaporan, payload) {
    const response = await apiClient.put(`/api/admin/pengaduan/${idLaporan}`, payload);
    return response.data;
  },
};

export default apiClient;
