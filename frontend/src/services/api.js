import { API_BASE_URL } from '../constants';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  getHeaders(customHeaders = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      ...options,
      headers: this.getHeaders(options.headers),
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Terjadi kesalahan pada server');
      }

      return data;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth API
  async login(nik, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nik, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Bansos API
  async getPenerimaBansos(params = {}) {
    const query = new URLSearchParams();
    if (params.rt) query.append('rt', params.rt);
    if (params.rw) query.append('rw', params.rw);
    if (params.jenis_bansos && params.jenis_bansos !== 'all') {
      query.append('jenis_bansos', params.jenis_bansos);
    }
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`/bansos/penerima${queryString}`);
  }

  // Pengaduan API
  async kirimPengaduan(data) {
    return this.request('/pengaduan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async trackingPengaduan(nomorTiket) {
    return this.request(`/pengaduan/tracking/${nomorTiket}`);
  }

  // Wilayah API
  async getWilayah() {
    return this.request('/wilayah');
  }
}

export const apiService = new ApiService();
export default apiService;
