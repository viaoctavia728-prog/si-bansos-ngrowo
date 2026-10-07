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
        message = error.response.data?.detail || error.response.data?.message || `Error ${error.response.status}`;
      } else if (error.request) {
        message = 'Tidak dapat terhubung ke server backend. Pastikan server backend FastAPI dan MySQL sedang berjalan.';
      } else {
        message = error.message;
      }
      const apiError = new Error(message);
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
