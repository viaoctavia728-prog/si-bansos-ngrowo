import { citizenApiClient } from './apiClient';

export const bansosService = {
  async cekBansosByNik(nik) {
    const response = await citizenApiClient.get(`/cek-bansos/${nik}`);
    return response.data;
  },

  async getPenerimaBansos(params = {}) {
    const response = await citizenApiClient.get('/bansos/penerima', { params });
    return response.data;
  },
};

export const pengaduanService = {
  async uploadBukti(file) {
    const contentBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Gagal membaca file bukti.'));
          return;
        }
        const separatorIndex = reader.result.indexOf(',');
        if (separatorIndex < 0) {
          reject(new Error('Format file bukti tidak valid.'));
          return;
        }
        resolve(reader.result.slice(separatorIndex + 1));
      };
      reader.onerror = () => reject(reader.error || new Error('Gagal membaca file bukti.'));
      reader.readAsDataURL(file);
    });
    const response = await citizenApiClient.post('/api/pengaduan/upload-bukti', {
      filename: file.name,
      content_type: file.type,
      content_base64: contentBase64,
    });
    return response.data.bukti_foto;
  },

  async buatPengaduan(data) {
    const response = await citizenApiClient.post('/pengaduan', data);
    return response.data;
  },

  async tracking(nomorTiket) {
    const response = await citizenApiClient.get(`/pengaduan/tracking/${nomorTiket}`);
    return response.data;
  },

  async getByUser(idUser) {
    const response = await citizenApiClient.get(`/pengaduan/user/${idUser}`);
    return response.data;
  },
};

export const jadwalService = {
  async getJadwal() {
    const response = await citizenApiClient.get('/api/jadwal');
    return response.data;
  },
};

export const wilayahService = {
  async getWilayah() {
    const response = await citizenApiClient.get('/wilayah');
    return response.data;
  },
};

export const notificationService = {
  async getNotifications() {
    try {
      const response = await citizenApiClient.get('/notifications');
      return response.data;
    } catch {
      const fallback = await citizenApiClient.get('/api/notifications');
      return fallback.data;
    }
  },

  async markAsRead(idNotification) {
    try {
      const response = await citizenApiClient.patch(`/notifications/${idNotification}/read`);
      return response.data;
    } catch {
      const fallback = await citizenApiClient.post(`/notifications/${idNotification}/read`);
      return fallback.data;
    }
  },
};


export default citizenApiClient;
