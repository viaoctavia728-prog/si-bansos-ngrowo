import { adminApiClient } from '../apiClient';

export const adminService = {
  async getWarga() {
    const response = await adminApiClient.get('/admin/warga');
    return response.data;
  },

  async updateWarga(idUser, payload) {
    const response = await adminApiClient.put(`/admin/warga/${idUser}`, payload);
    return response.data;
  },

  async getEligibleResidents() {
    const response = await adminApiClient.get('/admin/warga/eligible');
    return response.data;
  },

  async createEligibleResident(payload) {
    const response = await adminApiClient.post('/admin/warga/eligible', payload);
    return response.data;
  },

  async updateEligibleResident(idResident, payload) {
    const response = await adminApiClient.put(`/admin/warga/eligible/${idResident}`, payload);
    return response.data;
  },

  async deactivateEligibleResident(idResident) {
    const response = await adminApiClient.delete(`/admin/warga/eligible/${idResident}`);
    return response.data;
  },

  async getPengaduan(params = {}) {
    const response = await adminApiClient.get('/admin/pengaduan', { params });
    return response.data;
  },

  async getPengaduanRekapPdf(params = {}) {
    const response = await adminApiClient.get('/admin/pengaduan/rekap-pdf', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  async updateStatus(idLaporan, payload) {
    const response = await adminApiClient.put(`/admin/pengaduan/${idLaporan}`, payload);
    return response.data;
  },

  async createPengaduan(payload) {
    const response = await adminApiClient.post('/admin/pengaduan', payload);
    return response.data;
  },

  async updatePengaduan(idLaporan, payload) {
    const response = await adminApiClient.put(`/admin/pengaduan/${idLaporan}`, payload);
    return response.data;
  },

  async deletePengaduan(idLaporan) {
    const response = await adminApiClient.delete(`/admin/pengaduan/${idLaporan}`);
    return response.data;
  },

  async analyzeHousePhoto(file) {
    const formData = new FormData();
    formData.append('file', file, file.name || 'bukti-rumah');
    const response = await adminApiClient.post('/admin/validate-house', formData, {
      timeout: 120000,
    });
    return response.data;
  },

  async getAuditLogs(params = {}) {
    const response = await adminApiClient.get('/admin/audit-logs', { params });
    return response.data;
  },

  async getPendingWarga() {
    const response = await adminApiClient.get('/admin/pending-warga');
    return response.data;
  },

  async approveWarga(idUser) {
    try {
      const response = await adminApiClient.put(`/admin/approve-warga/${idUser}`);
      return response.data;
    } catch (err) {
      if (err.status === 404 || err.status === 405) {
        try {
          const fallbackPost = await adminApiClient.post(`/admin/approve-warga/${idUser}`);
          return fallbackPost.data;
        } catch {
          const fallbackApi = await adminApiClient.put(`/api/admin/approve-warga/${idUser}`);
          return fallbackApi.data;
        }
      }
      throw err;
    }
  },

  async rejectWarga(idUser) {
    try {
      const response = await adminApiClient.put(`/admin/reject-warga/${idUser}`);
      return response.data;
    } catch (err) {
      if (err.status === 404 || err.status === 405) {
        try {
          const fallbackPost = await adminApiClient.post(`/admin/reject-warga/${idUser}`);
          return fallbackPost.data;
        } catch {
          const fallbackApi = await adminApiClient.put(`/api/admin/reject-warga/${idUser}`);
          return fallbackApi.data;
        }
      }
      throw err;
    }
  },

  async getPenerimaBansos(params = {}) {
    const response = await adminApiClient.get('/bansos/admin/penerima', { params });
    return response.data;
  },

  async createPenerimaBansos(payload) {
    const response = await adminApiClient.post('/bansos', payload);
    return response.data;
  },

  async updatePenerimaBansos(idBansos, payload) {
    const response = await adminApiClient.put(`/bansos/admin/penerima/${idBansos}`, payload);
    return response.data;
  },

  async archivePenerimaBansos(idBansos) {
    const response = await adminApiClient.delete(`/bansos/admin/penerima/${idBansos}`);
    return response.data;
  },

  async getWilayah() {
    try {
      const response = await adminApiClient.get('/wilayah');
      return response.data;
    } catch {
      const fallback = await adminApiClient.get('/api/wilayah');
      return fallback.data;
    }
  },

  async getJadwal() {
    try {
      const response = await adminApiClient.get('/jadwal');
      return response.data;
    } catch (err) {
      if (err.status === 404) {
        try {
          const fallbackAdmin = await adminApiClient.get('/admin/jadwal');
          return fallbackAdmin.data;
        } catch {
          const fallbackApi = await adminApiClient.get('/api/jadwal');
          return fallbackApi.data;
        }
      }
      throw err;
    }
  },

  async createJadwal(payload) {
    try {
      const response = await adminApiClient.post('/admin/jadwal', payload);
      return response.data;
    } catch (err) {
      if (err.status === 404 || err.status === 405) {
        try {
          const fallbackJadwal = await adminApiClient.post('/jadwal', payload);
          return fallbackJadwal.data;
        } catch {
          const fallbackApi = await adminApiClient.post('/api/admin/jadwal', payload);
          return fallbackApi.data;
        }
      }
      throw err;
    }
  },

  async updateJadwal(idJadwal, payload) {
    const response = await adminApiClient.put(`/admin/jadwal/${idJadwal}`, payload);
    return response.data;
  },

  async archiveJadwal(idJadwal) {
    const response = await adminApiClient.delete(`/admin/jadwal/${idJadwal}`);
    return response.data;
  },

  async sendNotification(payload) {
    const paths = ['/notifications/fcm/send', '/api/notifications/fcm/send', '/notifications/send'];
    let lastError;
    for (const path of paths) {
      try {
        const response = await adminApiClient.post(path, payload);
        return response.data;
      } catch (err) {
        lastError = err;
        if (err.status !== 404 && err.status !== 405) throw err;
      }
    }
    throw lastError;
  },

  async sendNotificationToToken(payload) {
    const paths = ['/notifications/fcm/send-to-token', '/api/notifications/fcm/send-to-token'];
    let lastError;
    for (const path of paths) {
      try {
        const response = await adminApiClient.post(path, payload);
        return response.data;
      } catch (err) {
        lastError = err;
        if (err.status !== 404 && err.status !== 405) throw err;
      }
    }
    throw lastError;
  },

  async getNotifications() {
    const response = await adminApiClient.get('/notifications/admin');
    return response.data;
  },

  async updateNotification(idNotification, payload) {
    const response = await adminApiClient.put(`/notifications/${idNotification}`, payload);
    return response.data;
  },

  async deleteNotification(idNotification) {
    const response = await adminApiClient.delete(`/notifications/${idNotification}`);
    return response.data;
  },

  async archiveNotification(idNotification) {
    const response = await adminApiClient.patch(`/notifications/${idNotification}/archive`);
    return response.data;
  },
};
