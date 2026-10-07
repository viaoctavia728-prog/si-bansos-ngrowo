export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const BANSOS_PROGRAMS = [
  { id: 'all', name: 'Semua Program Bansos' },
  { id: 'PKH', name: 'Program Keluarga Harapan (PKH)' },
  { id: 'BPNT', name: 'Bantuan Pangan Non Tunai (BPNT)' },
  { id: 'BLT Desa', name: 'BLT Dana Desa' },
  { id: 'BST', name: 'Bantuan Sosial Tunai (BST)' },
];

export const STATUS_BANSOS = {
  AKTIF: 'aktif',
  GRADUASI: 'graduasi',
  PENANGGUHAN: 'penangguhan',
};

export const KATEGORI_PENGADUAN = [
  'Pungutan Liar (Pungli)',
  'Salah Sasaran / Mampu',
  'Pemotongan Jumlah Bansos',
  'Bansos Tidak Tepat Waktu',
  'Tidak Terdaftar Padahal Berhak',
  'Lainnya',
];

export const STATUS_PENGADUAN = {
  PENDING: { label: 'Menunggu', color: 'yellow' },
  DIPROSES: { label: 'Diproses', color: 'blue' },
  SELESAI: { label: 'Selesai', color: 'green' },
  DITOLAK: { label: 'Ditolak', color: 'red' },
};
