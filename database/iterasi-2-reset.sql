-- SI-BANSOS NGROWO - reset transaksi Iterasi 2
-- Jalankan setelah membuat backup database.
-- Master eligible_residents (100 baris) dipertahankan.

START TRANSACTION;

SET @demo_password_hash = (
  SELECT password_hash
  FROM users
  WHERE username = 'wargademo'
  LIMIT 1
);

DELETE FROM fcm_device_tokens;
DELETE FROM notification_history;
DELETE FROM pengaduan_bansos;
DELETE FROM audit_log;
DELETE FROM data_bansos;

UPDATE eligible_residents
SET registered_user_id = NULL;

DELETE FROM users
WHERE role IN ('user', 'warga') OR username = 'wargademo';

INSERT INTO users (
  nik, nama_lengkap, no_kk, no_hp, rt, rw, alamat_detail,
  password_hash, role, username, notifikasi_otomatis,
  is_ngrowo_resident, is_verified
)
SELECT
  nik, nama_lengkap, NULL, NULL, '001', '001', NULL,
  @demo_password_hash, 'user', 'wargademo', TRUE, TRUE, TRUE
FROM eligible_residents
WHERE id = 1;

INSERT INTO users (
  nik, nama_lengkap, no_kk, no_hp, rt, rw, alamat_detail,
  password_hash, role, username, notifikasi_otomatis,
  is_ngrowo_resident, is_verified
)
SELECT
  nik, nama_lengkap, NULL, NULL, '002', '002', NULL,
  @demo_password_hash, 'user', 'warga_uji_02', TRUE, TRUE, TRUE
FROM eligible_residents
WHERE id = 2;

INSERT INTO users (
  nik, nama_lengkap, no_kk, no_hp, rt, rw, alamat_detail,
  password_hash, role, username, notifikasi_otomatis,
  is_ngrowo_resident, is_verified
)
SELECT
  nik, nama_lengkap, NULL, NULL, '003', '003', NULL,
  @demo_password_hash, 'user', 'warga_uji_03', TRUE, TRUE, TRUE
FROM eligible_residents
WHERE id = 3;

UPDATE eligible_residents er
JOIN users u ON u.nik = er.nik
SET er.registered_user_id = u.id_user
WHERE u.username IN ('wargademo', 'warga_uji_02', 'warga_uji_03');

INSERT INTO data_bansos (
  nik_penerima, nama_penerima, no_kk, jenis_bansos, periode_tahun,
  status_penerima, rt, rw, desil
)
SELECT
  er.nik,
  er.nama_lengkap,
  NULL,
  'Bantuan Sosial Iterasi 2',
  2026,
  'aktif',
  LPAD(MOD(er.id - 1, 3) + 1, 3, '0'),
  LPAD(MOD(er.id - 1, 3) + 1, 3, '0'),
  er.desil
FROM eligible_residents er
WHERE er.id BETWEEN 1 AND 30;

INSERT INTO pengaduan_bansos (
  nomor_tiket, id_user, nik_terlapor, kategori_aduan, program_terkait,
  deskripsi_kejadian, bukti_foto, lokasi_spesifik, is_anonymous,
  status_laporan, catatan_admin, created_at
)
SELECT
  'ADU-ITER2-001',
  u.id_user,
  u.nik,
  'Data Penerima Tidak Sesuai',
  'Bantuan Sosial Iterasi 2',
  'Pengaduan uji Iterasi 2 dari warga pertama.',
  '/uploads/22477fbdcb5a4934a2951edc2a9e9ee9.webp',
  'RT 001 / RW 001',
  FALSE,
  'pending',
  NULL,
  CURRENT_TIMESTAMP
FROM users u
WHERE u.username = 'wargademo';

INSERT INTO pengaduan_bansos (
  nomor_tiket, id_user, nik_terlapor, kategori_aduan, program_terkait,
  deskripsi_kejadian, bukti_foto, lokasi_spesifik, is_anonymous,
  status_laporan, catatan_admin, created_at
)
SELECT
  'ADU-ITER2-002',
  u.id_user,
  u.nik,
  'Data Penerima Tidak Sesuai',
  'Bantuan Sosial Iterasi 2',
  'Pengaduan uji Iterasi 2 dari warga kedua.',
  '/uploads/7c869b856d604b5b8e2a4d9bc5d2d718.png',
  'RT 002 / RW 002',
  FALSE,
  'pending',
  NULL,
  CURRENT_TIMESTAMP
FROM users u
WHERE u.username = 'warga_uji_02';

INSERT INTO pengaduan_bansos (
  nomor_tiket, id_user, nik_terlapor, kategori_aduan, program_terkait,
  deskripsi_kejadian, bukti_foto, lokasi_spesifik, is_anonymous,
  status_laporan, catatan_admin, created_at
)
SELECT
  'ADU-ITER2-003',
  u.id_user,
  u.nik,
  'Data Penerima Tidak Sesuai',
  'Bantuan Sosial Iterasi 2',
  'Pengaduan uji Iterasi 2 dari warga ketiga.',
  '/uploads/95c6a92bb1a14db79a3b0b0c743f28f9.jpg',
  'RT 003 / RW 003',
  FALSE,
  'pending',
  NULL,
  CURRENT_TIMESTAMP
FROM users u
WHERE u.username = 'warga_uji_03';

COMMIT;
