import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
export const getAssetUrl = (path) => path?.startsWith('http') ? path : `${API_BASE_URL}${path || ''}`;

function createApiClient({ tokenKeys, sessionKeys }) {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(
    (config) => {
      const token = tokenKeys.map((key) => localStorage.getItem(key)).find(Boolean);
      if (token) config.headers.Authorization = `Bearer ${token}`;
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        sessionKeys.forEach((key) => localStorage.removeItem(key));
      }

      let message = 'Terjadi kesalahan pada sistem.';
      if (error.response) {
        const detail = error.response.data?.detail;
        if (typeof detail === 'string') {
          message = detail;
        } else if (Array.isArray(detail)) {
          const fieldLabels = {
            deskripsi_kejadian: 'Deskripsi kejadian',
            nik_terlapor: 'NIK terlapor',
            kategori_aduan: 'Kategori aduan',
            program_terkait: 'Program terkait',
            lokasi_spesifik: 'Lokasi domisili',
            bukti_foto: 'Foto bukti',
            nik: 'NIK',
            password: 'Password',
            nama_lengkap: 'Nama lengkap',
          };
          message = detail
            .map((item) => {
              const field = item.loc ? item.loc[item.loc.length - 1] : '';
              const label = fieldLabels[field] || field;

              if (item.type === 'string_too_short') {
                const min = item.ctx?.min_length || 1;
                return `${label ? label + ': ' : ''}Minimal harus ${min} karakter.`;
              }
              if (item.type === 'string_too_long') {
                const max = item.ctx?.max_length || 1;
                return `${label ? label + ': ' : ''}Maksimal ${max} karakter.`;
              }
              if (item.type === 'string_pattern_mismatch') {
                return `${label ? label + ': ' : ''}Format tidak valid.`;
              }
              return label ? `${label}: ${item.msg}` : (item.msg || 'Format data tidak valid');
            })
            .join(' | ');
        } else if (detail && typeof detail === 'object') {
          message = detail.message || JSON.stringify(detail);
        } else {
          message = error.response.data?.message || `Error ${error.response.status}`;
        }
      } else if (error.request) {
        message = 'Tidak dapat terhubung ke server backend. Pastikan server backend FastAPI dan MySQL sedang berjalan.';
      } else {
        message = error.message;
      }
      const apiError = new Error(typeof message === 'string' ? message : JSON.stringify(message));
      apiError.status = error.response?.status;
      return Promise.reject(apiError);
    },
  );

  return client;
}

export const citizenApiClient = createApiClient({
  tokenKeys: ['citizen_access_token', 'token', 'access_token'],
  sessionKeys: ['citizen_access_token', 'user', 'token', 'access_token'],
});

export const adminApiClient = createApiClient({
  tokenKeys: ['admin_access_token'],
  sessionKeys: ['admin_access_token', 'admin_user'],
});

export default citizenApiClient;
