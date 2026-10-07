import { adminApiClient } from '../apiClient';

export const adminService = {
  async getWarga() {
    const response = await adminApiClient.get('/admin/warga');
    return response.data;
  },

  async getPengaduan(params = {}) {
    const response = await adminApiClient.get('/admin/pengaduan', { params });
    return response.data;
  },

  async updateStatus(idLaporan, payload) {
    const response = await adminApiClient.put(`/admin/pengaduan/${idLaporan}`, payload);
    return response.data;
  },

  async getAuditLogs() {
    const response = await adminApiClient.get('/admin/audit-logs');
    return response.data;
  },

  async sendNotification(payload) {
    const response = await adminApiClient.post('/notifications/fcm/send', payload);
    return response.data;
  },

  async sendNotificationToToken(payload) {
    const response = await adminApiClient.post('/notifications/fcm/send-to-token', payload);
    return response.data;
  },
};
