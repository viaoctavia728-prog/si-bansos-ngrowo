import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAuthService } from '../../services/admin/adminAuth';
import { adminService } from '../../services/admin/adminApi';

export default function AdminProfil() {
  const [currentUser, setCurrentUser] = useState(() => adminAuthService.getCurrentUser());
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    nik: '',
    no_kk: '',
    no_hp: '',
    rt: '',
    rw: '',
    jabatan: 'Sekdes Ngrowo',
    password: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const user = adminAuthService.getCurrentUser();
      let remoteUser = null;
      try {
        remoteUser = await adminService.getProfile();
      } catch {
        // fallback to cached session
      }

      const active = remoteUser || user || {};
      setCurrentUser(active);
      setFormData({
        nama_lengkap: active.nama_lengkap || 'Pak Bambang',
        username: active.username || 'admin',
        nik: active.nik || '3522010101700001',
        no_kk: active.no_kk || '3522010101700001',
        no_hp: active.no_hp || '081234567890',
        rt: active.rt || '02',
        rw: active.rw || '01',
        jabatan: active.role === 'admin' ? 'Sekretaris Desa (Sekdes)' : 'Perangkat Desa',
        password: '',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFeedback(null);

      const userId = currentUser?.id_user || 1;
      const payload = {
        nama_lengkap: formData.nama_lengkap,
        username: formData.username,
        no_kk: formData.no_kk,
        no_hp: formData.no_hp,
        rt: formData.rt,
        rw: formData.rw,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      const updated = await adminService.updateProfile(userId, payload);

      // Persist to local storage
      const mergedUser = {
        ...currentUser,
        ...(updated || {}),
        nama_lengkap: formData.nama_lengkap,
        username: formData.username,
        no_kk: formData.no_kk,
        no_hp: formData.no_hp,
        rt: formData.rt,
        rw: formData.rw,
      };

      localStorage.setItem('admin_user', JSON.stringify(mergedUser));
      setCurrentUser(mergedUser);

      // Broadcast update event to AdminLayout
      window.dispatchEvent(new CustomEvent('admin-profile-updated', { detail: mergedUser }));

      setFeedback({
        type: 'success',
        message: 'Profil biodata admin berhasil diperbarui dan disimpan ke database server!',
      });
      setFormData((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menyimpan pembaruan profil admin.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/admin/dashboard" className="flex items-center gap-1 hover:text-slate-800 transition-colors">
          <span className="material-symbols-outlined text-[16px]">home</span>
        </Link>
        <span>/</span>
        <span className="text-slate-600">Admin Desa</span>
        <span>/</span>
        <span className="text-emerald-700 font-bold">Profil Perangkat & Admin</span>
      </nav>

      {/* 2. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Biodata & Pengaturan Profil Admin
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kelola informasi data diri, jabatan, kontak dinas, serta kredensial akun administrator SI-BANSOS Desa Ngrowo.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {feedback.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{feedback.message}</span>
        </div>
      )}

      {/* 3. PROFILE CONTENT (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Admin Identity Badge Card (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs text-center">
            <div className="relative inline-block mx-auto mb-4">
              <div className="h-24 w-24 rounded-full bg-emerald-800 text-white font-black text-3xl flex items-center justify-center shadow-md mx-auto">
                {formData.nama_lengkap.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Status Aktif">
                <span className="material-symbols-outlined text-[13px]">check</span>
              </span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900">{formData.nama_lengkap || 'Administrator'}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{formData.jabatan}</p>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-left text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Status Akun:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                  Terverifikasi
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Username:</span>
                <span className="font-mono font-bold text-slate-700">{formData.username}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Instansi:</span>
                <span className="font-semibold text-slate-700">Pemerintah Desa Ngrowo</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Wilayah Tugas:</span>
                <span className="font-bold text-slate-700">RT {formData.rt} / RW {formData.rw}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900 mb-1">
              <span className="material-symbols-outlined text-[18px]">security</span>
              Hak Akses Administrator
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Akun ini memiliki wewenang memvalidasi aduan bansos, memperbarui status warga, dan melakukan siaran notifikasi resmi desa.
            </p>
          </div>
        </div>

        {/* Right Column: Editable Profile Form (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Form Biodata & Informasi Petugas</h3>
              <p className="text-xs text-slate-500 mt-0.5">Ubah dan perbarui data profil Anda di bawah ini</p>
            </div>
            <button
              type="button"
              onClick={loadProfile}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset Form
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl animate-spin text-emerald-600">
                progress_activity
              </span>
              <p className="mt-2 text-xs font-semibold text-slate-600">Memuat profil admin...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    required
                    type="text"
                    name="nama_lengkap"
                    value={formData.nama_lengkap}
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                    placeholder="Contoh: Pak Bambang, S.Sos."
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Username Login</label>
                  <input
                    required
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                    placeholder="Contoh: admin"
                  />
                </div>

                {/* NIK */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Induk Kependudukan (NIK)</label>
                  <input
                    required
                    type="text"
                    maxLength={16}
                    name="nik"
                    value={formData.nik}
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                    placeholder="16 digit NIK"
                  />
                </div>

                {/* No KK */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Kartu Keluarga (KK)</label>
                  <input
                    type="text"
                    maxLength={16}
                    name="no_kk"
                    value={formData.no_kk}
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                    placeholder="16 digit nomor KK"
                  />
                </div>

                {/* No WhatsApp / HP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp / HP Dinas</label>
                  <input
                    type="text"
                    name="no_hp"
                    value={formData.no_hp}
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                    placeholder="Contoh: 081234567890"
                  />
                </div>

                {/* Jabatan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan di Pemerintahan Desa</label>
                  <input
                    type="text"
                    name="jabatan"
                    value={formData.jabatan}
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                    placeholder="Contoh: Sekdes Ngrowo / Kasie Kesra"
                  />
                </div>

                {/* RT & RW */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rukun Tetangga (RT)</label>
                  <input
                    type="text"
                    name="rt"
                    value={formData.rt}
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                    placeholder="Contoh: 02"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rukun Warga (RW)</label>
                  <input
                    type="text"
                    name="rw"
                    value={formData.rw}
                    onChange={handleChange}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                    placeholder="Contoh: 01"
                  />
                </div>
              </div>

              {/* Password Baru */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ubah Kata Sandi (Kosongkan jika tidak ingin mengganti)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ketik password baru jika ingin mengubah..."
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={loadProfile}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1b7340] hover:bg-emerald-800 px-6 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors shadow-xs disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[18px] ${saving ? 'animate-spin' : ''}`}>
                    {saving ? 'progress_activity' : 'save'}
                  </span>
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan Biodata'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
