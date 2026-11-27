import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { adminService } from '../../services/admin/adminApi';
import AdminEligibleResidents from './AdminEligibleResidents';

const DESIL_OPTIONS = [
  { value: 1, label: 'Desil 1 - Sangat Miskin (0 - 10%)' },
  { value: 2, label: 'Desil 2 - Miskin (11 - 20%)' },
  { value: 3, label: 'Desil 3 - Hampir Miskin (21 - 30%)' },
  { value: 4, label: 'Desil 4 - Rentan Miskin (31 - 40%)' },
  { value: 5, label: 'Desil 5 - Menengah Bawah (41 - 50%)' },
  { value: 6, label: 'Desil 6 - Menengah (51 - 60%)' },
  { value: 7, label: 'Desil 7 - Menengah (61 - 70%)' },
  { value: 8, label: 'Desil 8 - Menengah Atas (71 - 80%)' },
  { value: 9, label: 'Desil 9 - Mampu (81 - 90%)' },
  { value: 10, label: 'Desil 10 - Sangat Mampu (91 - 100%)' },
];

export default function AdminWarga() {
  const { globalSearch } = useOutletContext() || {};
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalError, setModalError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRt, setFilterRt] = useState('');
  const [filterRw, setFilterRw] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modal Tambah Warga
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    nik: '',
    nama_lengkap: '',
    no_kk: '',
    no_hp: '',
    rt: '',
    rw: '',
    alamat_detail: '',
    desil: 4,
    password: '',
  });
  const [createErrors, setCreateErrors] = useState({});
  const [savingCreate, setSavingCreate] = useState(false);

  // Modal Edit Warga
  const [editingWarga, setEditingWarga] = useState(null);
  const [wargaForm, setWargaForm] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [savingWarga, setSavingWarga] = useState(false);
  const [activeTab, setActiveTab] = useState('accounts');

  const loadWarga = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getWarga();
      if (!Array.isArray(data)) throw new Error('Format data akun warga dari server tidak valid.');
      setWargaList(data);
    } catch (err) {
      setError(err.message || 'Gagal memuat data warga.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWarga();
  }, []);

  const rtOptions = useMemo(() => {
    return [...new Set(wargaList.map((p) => p.rt).filter(Boolean))].sort();
  }, [wargaList]);

  const rwOptions = useMemo(() => {
    return [...new Set(wargaList.map((p) => p.rw).filter(Boolean))].sort();
  }, [wargaList]);

  const stats = useMemo(() => {
    const active = wargaList.filter((w) => w.is_active);
    const verified = active.filter((w) => w.is_ngrowo_resident && w.is_verified).length;
    return { total: active.length, verified, pending: active.length - verified };
  }, [wargaList]);

  const filteredWarga = useMemo(() => {
    const activeSearch = (search || globalSearch || '').trim().toLowerCase();
    return wargaList.filter((person) => {
      if (filterVerified !== 'archived' && !person.is_active) return false;
      if (filterRt && person.rt !== filterRt) return false;
      if (filterRw && person.rw !== filterRw) return false;
      if (filterVerified === 'verified' && (!person.is_ngrowo_resident || !person.is_verified)) return false;
      if (filterVerified === 'pending' && (person.is_ngrowo_resident && person.is_verified)) return false;
      if (filterVerified === 'archived' && person.is_active) return false;

      if (activeSearch) {
        const text = [
          person.nama_lengkap,
          person.nik,
          person.no_kk,
          person.username,
          person.no_hp,
          person.rt,
          person.rw,
        ].join(' ').toLowerCase();
        if (!text.includes(activeSearch)) return false;
      }
      return true;
    });
  }, [wargaList, search, globalSearch, filterRt, filterRw, filterVerified]);

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleApprove = async (idUser, nama) => {
    if (!window.confirm(`Setujui verifikasi kependudukan untuk ${nama}?`)) return;
    try {
      setActionLoadingId(idUser);
      setFeedback(null);
      await adminService.approveWarga(idUser);
      setFeedback({ type: 'success', message: `Warga ${nama} berhasil diverifikasi sebagai penduduk Ngrowo!` });
      await loadWarga();
    } catch (err) {
      const msg = err.status === 404 || err.message?.toLowerCase().includes('not found')
        ? `Endpoint verifikasi warga tidak ditemukan di server (404 Not Found). Pastikan backend aktif.`
        : (err.message || 'Gagal memverifikasi warga.');
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (idUser, nama) => {
    if (!window.confirm(`Nonaktifkan akun ${nama}? Akun tidak dapat masuk, tetapi data dan riwayat tetap disimpan.`)) return;
    try {
      setActionLoadingId(idUser);
      setFeedback(null);
      await adminService.rejectWarga(idUser);
      setFeedback({ type: 'success', message: `Pendaftaran warga ${nama} berhasil ditolak.` });
      await loadWarga();
    } catch (err) {
      const msg = err.status === 404 || err.message?.toLowerCase().includes('not found')
        ? `Endpoint penolakan warga tidak ditemukan di server (404 Not Found). Pastikan backend aktif.`
        : (err.message || 'Gagal menolak pendaftaran.');
      setFeedback({ type: 'error', message: msg });
    } finally {
      setActionLoadingId(null);
    }
  };

  const validateCreateForm = () => {
    const errors = {};
    const nik = (createForm.nik || '').trim();
    if (!nik) {
      errors.nik = 'NIK wajib diisi.';
    } else if (!/^\d{16}$/.test(nik)) {
      errors.nik = 'NIK harus berupa 16 digit angka.';
    }

    const nama = (createForm.nama_lengkap || '').trim();
    if (!nama) {
      errors.nama_lengkap = 'Nama lengkap wajib diisi.';
    } else if (nama.length < 2) {
      errors.nama_lengkap = 'Nama lengkap minimal 2 karakter.';
    }

    const noKk = (createForm.no_kk || '').trim();
    if (noKk && !/^\d{16}$/.test(noKk)) {
      errors.no_kk = 'Nomor KK harus berupa 16 digit angka jika diisi.';
    }

    const noHp = (createForm.no_hp || '').trim();
    if (noHp && !/^\d{8,15}$/.test(noHp)) {
      errors.no_hp = 'Nomor telepon harus berupa 8-15 digit angka jika diisi.';
    }

    const password = createForm.password || '';
    if (password && password.length < 6) {
      errors.password = 'Password akun minimal 6 karakter.';
    }

    return errors;
  };

  const validateEditForm = () => {
    const errors = {};
    const nama = (wargaForm.nama_lengkap || '').trim();
    if (!nama) {
      errors.nama_lengkap = 'Nama lengkap wajib diisi.';
    } else if (nama.length < 2) {
      errors.nama_lengkap = 'Nama lengkap minimal 2 karakter.';
    }

    const noKk = (wargaForm.no_kk || '').trim();
    if (noKk && !/^\d{16}$/.test(noKk)) {
      errors.no_kk = 'Nomor KK harus berupa 16 digit angka jika diisi.';
    }

    const noHp = (wargaForm.no_hp || '').trim();
    if (noHp && !/^\d{8,15}$/.test(noHp)) {
      errors.no_hp = 'Nomor telepon harus berupa 8-15 digit angka jika diisi.';
    }

    const pwd = wargaForm.password || '';
    const confirmPwd = wargaForm.confirm_password || '';

    if (pwd || confirmPwd) {
      if (pwd.length < 6) {
        errors.password = 'Password baru minimal 6 karakter.';
      }
      if (pwd !== confirmPwd) {
        errors.confirm_password = 'Konfirmasi password tidak cocok dengan password baru.';
      }
    }

    return errors;
  };

  const parseErrorToFields = (msg) => {
    if (!msg) return {};
    const fieldErrors = {};
    const parts = msg.split(/\s*(?:•|\||\n)\s*/).filter(Boolean);
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (lower.includes('nik')) {
        fieldErrors.nik = part;
      } else if (lower.includes('nama')) {
        fieldErrors.nama_lengkap = part;
      } else if (lower.includes('kk')) {
        fieldErrors.no_kk = part;
      } else if (lower.includes('telepon') || lower.includes('hp')) {
        fieldErrors.no_hp = part;
      } else if (lower.includes('konfirmasi password') || lower.includes('tidak cocok')) {
        fieldErrors.confirm_password = part;
      } else if (lower.includes('password')) {
        fieldErrors.password = part;
      }
    }
    if (Object.keys(fieldErrors).length === 0) {
      const lower = msg.toLowerCase();
      if (lower.includes('nik')) fieldErrors.nik = msg;
      if (lower.includes('nama')) fieldErrors.nama_lengkap = msg;
      if (lower.includes('kk')) fieldErrors.no_kk = msg;
      if (lower.includes('telepon') || lower.includes('hp')) fieldErrors.no_hp = msg;
      if (lower.includes('password')) fieldErrors.password = msg;
    }
    return fieldErrors;
  };

  // Open & Close Modal Tambah
  const openCreateWarga = () => {
    setCreateForm({
      nik: '',
      nama_lengkap: '',
      no_kk: '',
      no_hp: '',
      rt: '',
      rw: '',
      alamat_detail: '',
      desil: 4,
      password: '',
    });
    setCreateErrors({});
    setModalError('');
    setIsCreateOpen(true);
  };

  const closeCreateWarga = () => {
    setIsCreateOpen(false);
    setCreateErrors({});
    setModalError('');
  };

  const handleCreateWarga = async (e) => {
    e.preventDefault();
    const errors = validateCreateForm();
    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      setModalError(Object.values(errors).join(' • '));
      return;
    }

    try {
      setSavingCreate(true);
      setCreateErrors({});
      setModalError('');
      setFeedback(null);
      const payload = {
        nik: createForm.nik.trim(),
        nama_lengkap: createForm.nama_lengkap.trim(),
        no_kk: createForm.no_kk?.trim() || null,
        no_hp: createForm.no_hp?.trim() || null,
        rt: createForm.rt?.trim() || null,
        rw: createForm.rw?.trim() || null,
        alamat_detail: createForm.alamat_detail?.trim() || null,
        desil: Number(createForm.desil) || 4,
        password: createForm.password || null,
      };

      await adminService.createWarga(payload);
      closeCreateWarga();
      setFeedback({
        type: 'success',
        message: `Data warga ${createForm.nama_lengkap} berhasil ditambahkan. Akun masih nonaktif dan belum bisa login sampai diaktifkan serta diverifikasi admin.`,
      });
      await loadWarga();
    } catch (err) {
      const msg = err.message || 'Gagal menambahkan data warga.';
      setModalError(msg);
      setCreateErrors(parseErrorToFields(msg));
    } finally {
      setSavingCreate(false);
    }
  };

  // Open & Close Modal Edit
  const openEditWarga = (person) => {
    setEditingWarga(person);
    setWargaForm({
      nama_lengkap: person.nama_lengkap || '',
      no_kk: person.no_kk || '',
      no_hp: person.no_hp || '',
      rt: person.rt || '',
      rw: person.rw || '',
      alamat_detail: person.alamat_detail || '',
      desil: person.desil ?? 4,
      password: '',
      confirm_password: '',
    });
    setEditErrors({});
    setModalError('');
  };

  const closeEditWarga = () => {
    setEditingWarga(null);
    setWargaForm({});
    setEditErrors({});
    setModalError('');
  };

  const saveWarga = async (event) => {
    event.preventDefault();
    if (!editingWarga) return;

    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      setModalError(Object.values(errors).join(' • '));
      return;
    }

    const { password, confirm_password, ...profileChanges } = wargaForm;
    const payload = {
      ...profileChanges,
      nama_lengkap: profileChanges.nama_lengkap?.trim(),
      no_kk: profileChanges.no_kk?.trim() || null,
      no_hp: profileChanges.no_hp?.trim() || null,
      rt: profileChanges.rt?.trim() || null,
      rw: profileChanges.rw?.trim() || null,
      alamat_detail: profileChanges.alamat_detail?.trim() || null,
      desil: Number(profileChanges.desil) || 4,
    };
    if (password) payload.password = password;

    try {
      setSavingWarga(true);
      setEditErrors({});
      setModalError('');
      setFeedback(null);
      await adminService.updateWarga(editingWarga.id_user, payload);
      closeEditWarga();
      setFeedback({
        type: 'success',
        message: password
          ? `Data ${wargaForm.nama_lengkap} (Desil ${payload.desil}) dan password berhasil diperbarui.`
          : `Data ${wargaForm.nama_lengkap} (Desil ${payload.desil}) berhasil diperbarui.`,
      });
      await loadWarga();
    } catch (saveError) {
      const msg = saveError.message || 'Data warga gagal diperbarui.';
      setModalError(msg);
      setEditErrors(parseErrorToFields(msg));
    } finally {
      setSavingWarga(false);
    }
  };

  if (activeTab === 'eligible') {
    return (
      <div className="space-y-6 motion-reveal">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Kelola Data Kependudukan Warga</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">Kelola data eligible dan akun warga Desa Ngrowo.</p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
          <button type="button" onClick={() => setActiveTab('accounts')} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span> Akun warga
          </button>
          <button type="button" onClick={() => setActiveTab('eligible')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white">
            <span className="material-symbols-outlined text-[18px]">groups</span> Daftar warga &amp; desil
          </button>
        </div>
        <AdminEligibleResidents />
      </div>
    );
  }

  return (
    <div className="space-y-6 motion-reveal">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
        <button type="button" onClick={() => setActiveTab('accounts')} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white">
          <span className="material-symbols-outlined text-[18px]">manage_accounts</span> Akun warga
        </button>
        <button type="button" onClick={() => setActiveTab('eligible')} className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
          <span className="material-symbols-outlined text-[18px]">groups</span> Daftar warga &amp; desil
        </button>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kelola Data Kependudukan Warga
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data kependudukan warga Desa Ngrowo yang terdaftar dalam sistem verifikasi bansos.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadWarga}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            {loading ? 'Memuat...' : 'Segarkan Data'}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between gap-3 shadow-xs transition-all ${
            feedback.type === 'success' ? 'bg-emerald-50 text-[#166534] border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
            title="Tutup pesan"
          >
            ✕
          </button>
        </div>
      )}

      {error && !editingWarga && !isCreateOpen && (
        <div className="p-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="motion-stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="gov-card motion-card p-5" style={{ '--stagger-index': 0 }}>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Akun Terdaftar</span>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[11px] font-medium text-slate-400 mt-1">Akun yang dapat digunakan</p>
        </div>

        <div className="gov-card motion-card p-5" style={{ '--stagger-index': 1 }}>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Penduduk Terverifikasi</span>
          <p className="text-3xl font-black text-[#166534] mt-2">{stats.verified}</p>
          <p className="text-[11px] font-medium text-emerald-600 mt-1">Kependudukan sah SIAK</p>
        </div>

        <div className="gov-card motion-card p-5" style={{ '--stagger-index': 2 }}>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Perlu Verifikasi</span>
          <p className="text-3xl font-black text-amber-600 mt-2">{stats.pending}</p>
          <p className="text-[11px] font-medium text-amber-600 mt-1">Pendaftaran baru / luar wilayah</p>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, NIK, username, No HP..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterRt}
              onChange={(e) => setFilterRt(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="">Semua RT</option>
              {rtOptions.map((rt) => (
                <option key={rt} value={rt}>RT {rt}</option>
              ))}
            </select>

            <select
              value={filterRw}
              onChange={(e) => setFilterRw(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="">Semua RW</option>
              {rwOptions.map((rw) => (
                <option key={rw} value={rw}>RW {rw}</option>
              ))}
            </select>

            <select
              value={filterVerified}
              onChange={(e) => {
                const value = e.target.value;
                setFilterVerified(value);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="verified">Terverifikasi</option>
              <option value="pending">Perlu Verifikasi</option>
              <option value="archived">Diarsipkan / Ditolak</option>
            </select>

            {(search || filterRt || filterRw || filterVerified !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterRt('');
                  setFilterRw('');
                  setFilterVerified('all');
                }}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin text-emerald-600">
              progress_activity
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-600">Memuat data kependudukan...</p>
          </div>
        ) : filteredWarga.length === 0 ? (
          <div className="py-16 text-center text-slate-400 px-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">person_search</span>
            <p className="text-sm font-bold text-slate-700 mt-2">Tidak ada data warga yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter wilayah.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Nama Lengkap</th>
                  <th className="px-5 py-3.5">NIK / No KK</th>
                  <th className="px-5 py-3.5">Username / Kontak</th>
                  <th className="px-5 py-3.5">Wilayah &amp; Desil</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Terdaftar</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredWarga.map((person, index) => {
                  const isVerified = person.is_ngrowo_resident && person.is_verified;
                  return (
                    <tr key={person.id_user} className="motion-row hover:bg-slate-50/70 transition-colors" style={{ '--stagger-index': Math.min(index, 8) }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-[#166534] font-bold flex items-center justify-center text-xs shrink-0">
                            {person.nama_lengkap?.charAt(0).toUpperCase() || 'W'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{person.nama_lengkap}</span>
                            <span className="text-[10px] text-slate-400">ID #{person.id_user}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-slate-800 block">{person.nik}</span>
                        <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                          KK: {person.no_kk || '-'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-700 block">{person.username || '-'}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{person.no_hp || '-'}</span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block text-xs">
                          RT {person.rt || '-'} / RW {person.rw || '-'}
                        </span>
                        <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                          Desil {person.desil ?? '4'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {isVerified && person.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-[#166534] border border-emerald-200">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            Penduduk Ngrowo
                          </span>
                        ) : person.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span className="material-symbols-outlined text-[13px]">pending</span>
                            Perlu Verifikasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="material-symbols-outlined text-[13px]">person_off</span>
                            Diarsipkan / Ditolak
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-slate-500 text-xs">
                        {person.created_at ? new Date(person.created_at).toLocaleDateString('id-ID') : '-'}
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {!isVerified && person.is_active ? (
                            <>
                            <button
                              type="button"
                              onClick={() => handleApprove(person.id_user, person.nama_lengkap)}
                              disabled={actionLoadingId === person.id_user}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors disabled:opacity-50"
                              title="Setujui verifikasi"
                            >
                              Verifikasi
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(person.id_user, person.nama_lengkap)}
                              disabled={actionLoadingId === person.id_user}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 transition-colors disabled:opacity-50"
                              title="Arsipkan pendaftaran"
                            >
                              Arsipkan
                            </button>
                            </>
                          ) : !isVerified ? (
                            <button
                              type="button"
                              onClick={() => handleApprove(person.id_user, person.nama_lengkap)}
                              disabled={actionLoadingId === person.id_user}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] disabled:opacity-50"
                            >
                              Aktifkan &amp; verifikasi
                            </button>
                          ) : <span className="text-[11px] text-emerald-800 font-semibold mr-1">Terverifikasi</span>}
                          <button
                            type="button"
                            onClick={() => openEditWarga(person)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                            title="Edit data warga"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {filteredWarga.length} dari {wargaList.length} warga terdaftar</span>
          <span>Desa Ngrowo, Bojonegoro</span>
        </div>
      </div>

      {/* POPUP TAMBAH DATA WARGA (Menggunakan createPortal seperti Data Penerima) */}
      {isCreateOpen && createPortal(
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreateWarga();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tambah-warga-title"
            className="modal-panel motion-modal max-w-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-800">
                  DATA KEPENDUDUKAN
                </p>
                <h3 id="tambah-warga-title" className="mt-1 text-lg font-extrabold text-slate-900">
                  Tambah data warga
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCreateWarga}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                aria-label="Tutup formulir"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {modalError && (
              <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
                  <span>Periksa kembali data yang dimasukkan:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 font-medium pl-1 text-[11px] text-rose-700">
                  {modalError.split(/\s*(?:•|\||\n)\s*/).filter(Boolean).map((errItem, idx) => (
                    <li key={idx}>{errItem}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleCreateWarga} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  NIK <span className="text-rose-500">*</span>
                  <input
                    required
                    type="text"
                    maxLength={16}
                    placeholder="16 digit NIK"
                    value={createForm.nik}
                    onChange={(e) => {
                      setCreateForm((prev) => ({ ...prev, nik: e.target.value.replace(/\D/g, '') }));
                      if (createErrors.nik) setCreateErrors((prev) => ({ ...prev, nik: null }));
                    }}
                    className={`gov-input mt-1 font-mono transition-colors ${
                      createErrors.nik ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                    }`}
                  />
                  {createErrors.nik && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {createErrors.nik}
                    </p>
                  )}
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Nama lengkap <span className="text-rose-500">*</span>
                  <input
                    required
                    type="text"
                    maxLength={100}
                    placeholder="Nama sesuai dokumen kependudukan"
                    value={createForm.nama_lengkap}
                    onChange={(e) => {
                      setCreateForm((prev) => ({ ...prev, nama_lengkap: e.target.value }));
                      if (createErrors.nama_lengkap) setCreateErrors((prev) => ({ ...prev, nama_lengkap: null }));
                    }}
                    className={`gov-input mt-1 transition-colors ${
                      createErrors.nama_lengkap ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                    }`}
                  />
                  {createErrors.nama_lengkap && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {createErrors.nama_lengkap}
                    </p>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Nomor KK (opsional)
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="16 digit Nomor KK"
                    value={createForm.no_kk}
                    onChange={(e) => {
                      setCreateForm((prev) => ({ ...prev, no_kk: e.target.value.replace(/\D/g, '') }));
                      if (createErrors.no_kk) setCreateErrors((prev) => ({ ...prev, no_kk: null }));
                    }}
                    className={`gov-input mt-1 font-mono transition-colors ${
                      createErrors.no_kk ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                    }`}
                  />
                  {createErrors.no_kk && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {createErrors.no_kk}
                    </p>
                  )}
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Nomor telepon / WhatsApp
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="08xxxxxxxxxx"
                    value={createForm.no_hp}
                    onChange={(e) => {
                      setCreateForm((prev) => ({ ...prev, no_hp: e.target.value }));
                      if (createErrors.no_hp) setCreateErrors((prev) => ({ ...prev, no_hp: null }));
                    }}
                    className={`gov-input mt-1 transition-colors ${
                      createErrors.no_hp ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                    }`}
                  />
                  {createErrors.no_hp && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {createErrors.no_hp}
                    </p>
                  )}
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block text-xs font-semibold text-slate-700">
                  RT
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Contoh: 003"
                    value={createForm.rt}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, rt: e.target.value }))}
                    className="gov-input mt-1"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  RW
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Contoh: 002"
                    value={createForm.rw}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, rw: e.target.value }))}
                    className="gov-input mt-1"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Desil kesejahteraan
                  <select
                    value={createForm.desil}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, desil: Number(e.target.value) }))}
                    className="gov-input mt-1"
                  >
                    {DESIL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                Alamat lengkap
                <textarea
                  rows={2}
                  maxLength={255}
                  placeholder="Nama jalan, nomor rumah, atau detail alamat"
                  value={createForm.alamat_detail}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, alamat_detail: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                />
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-bold text-slate-800">Password akun (opsional)</p>
                <p className="mt-1 text-xs text-slate-500">
                  Jika dikosongkan, password awal akan otomatis dibuatkan berupa{' '}
                  <span className="font-mono font-semibold text-slate-700">Ngrowo[4 digit NIK]!</span>.
                </p>
                <div className="mt-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password akun
                    <input
                      type="password"
                      minLength={6}
                      maxLength={72}
                      autoComplete="new-password"
                      placeholder="Minimal 6 karakter"
                      value={createForm.password}
                      onChange={(e) => {
                        setCreateForm((prev) => ({ ...prev, password: e.target.value }));
                        if (createErrors.password) setCreateErrors((prev) => ({ ...prev, password: null }));
                      }}
                      className={`gov-input mt-1 transition-colors ${
                        createErrors.password ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                      }`}
                    />
                    {createErrors.password && (
                      <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {createErrors.password}
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeCreateWarga}
                  className="gov-btn-outline"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingCreate}
                  className="gov-btn-primary"
                >
                  <span className={`material-symbols-outlined text-base ${savingCreate ? 'animate-spin' : ''}`}>
                    {savingCreate ? 'progress_activity' : 'save'}
                  </span>
                  {savingCreate ? 'Menyimpan...' : 'Simpan data'}
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body
      )}

      {/* POPUP EDIT DATA WARGA (Menggunakan createPortal seperti Data Penerima) */}
      {editingWarga && createPortal(
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditWarga();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-warga-title"
            className="modal-panel motion-modal max-w-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-800">
                  DATA KEPENDUDUKAN
                </p>
                <h3 id="edit-warga-title" className="mt-1 text-lg font-extrabold text-slate-900">
                  Edit data warga
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEditWarga}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                aria-label="Tutup formulir"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {modalError && (
              <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
                <div className="flex items-center gap-2 font-bold mb-1.5">
                  <span className="material-symbols-outlined text-[18px] text-rose-600">error</span>
                  <span>Periksa kembali data yang dimasukkan:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 font-medium pl-1 text-[12px] text-rose-700">
                  {modalError.split(/\s*(?:•|\||\n)\s*/).filter(Boolean).map((errItem, idx) => (
                    <li key={idx}>{errItem}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={saveWarga} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Nama lengkap <span className="text-rose-500">*</span>
                <input
                  required
                  minLength={2}
                  maxLength={100}
                  value={wargaForm.nama_lengkap || ''}
                  onChange={(event) => {
                    setWargaForm((prev) => ({ ...prev, nama_lengkap: event.target.value }));
                    if (editErrors.nama_lengkap) setEditErrors((prev) => ({ ...prev, nama_lengkap: null }));
                  }}
                  className={`gov-input mt-1 transition-colors ${
                    editErrors.nama_lengkap ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                  }`}
                />
                {editErrors.nama_lengkap && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">error</span>
                    {editErrors.nama_lengkap}
                  </p>
                )}
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">
                  NIK
                  <input
                    readOnly
                    value={editingWarga.nik}
                    className="gov-input mt-1 bg-slate-100 font-mono text-slate-600"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Nomor KK
                  <input
                    maxLength={16}
                    value={wargaForm.no_kk || ''}
                    onChange={(event) => {
                      setWargaForm((prev) => ({ ...prev, no_kk: event.target.value.replace(/\D/g, '') }));
                      if (editErrors.no_kk) setEditErrors((prev) => ({ ...prev, no_kk: null }));
                    }}
                    className={`gov-input mt-1 font-mono transition-colors ${
                      editErrors.no_kk ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                    }`}
                  />
                  {editErrors.no_kk && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {editErrors.no_kk}
                    </p>
                  )}
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Nomor telepon / WhatsApp
                  <input
                    maxLength={15}
                    value={wargaForm.no_hp || ''}
                    onChange={(event) => {
                      setWargaForm((prev) => ({ ...prev, no_hp: event.target.value }));
                      if (editErrors.no_hp) setEditErrors((prev) => ({ ...prev, no_hp: null }));
                    }}
                    className={`gov-input mt-1 transition-colors ${
                      editErrors.no_hp ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                    }`}
                  />
                  {editErrors.no_hp && (
                    <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">error</span>
                      {editErrors.no_hp}
                    </p>
                  )}
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  Desil kesejahteraan
                  <select
                    value={wargaForm.desil || 4}
                    onChange={(event) => setWargaForm((prev) => ({ ...prev, desil: Number(event.target.value) }))}
                    className="gov-input mt-1"
                  >
                    {DESIL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  RT
                  <input
                    maxLength={10}
                    value={wargaForm.rt || ''}
                    onChange={(event) => setWargaForm((prev) => ({ ...prev, rt: event.target.value }))}
                    className="gov-input mt-1"
                  />
                </label>

                <label className="block text-xs font-semibold text-slate-700">
                  RW
                  <input
                    maxLength={10}
                    value={wargaForm.rw || ''}
                    onChange={(event) => setWargaForm((prev) => ({ ...prev, rw: event.target.value }))}
                    className="gov-input mt-1"
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                Alamat lengkap
                <textarea
                  rows={2}
                  maxLength={255}
                  value={wargaForm.alamat_detail || ''}
                  onChange={(event) => setWargaForm((prev) => ({ ...prev, alamat_detail: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15"
                />
              </label>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-bold text-slate-800">Ganti password (opsional)</p>
                <p className="mt-1 text-xs text-slate-500">Kosongkan kedua kolom jika password tidak ingin diubah.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password baru
                    <input
                      type="password"
                      minLength={6}
                      maxLength={72}
                      autoComplete="new-password"
                      value={wargaForm.password || ''}
                      onChange={(event) => {
                        setWargaForm((prev) => ({ ...prev, password: event.target.value }));
                        if (editErrors.password) setEditErrors((prev) => ({ ...prev, password: null }));
                      }}
                      className={`gov-input mt-1 transition-colors ${
                        editErrors.password ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                      }`}
                      placeholder="Minimal 6 karakter"
                    />
                    {editErrors.password && (
                      <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {editErrors.password}
                      </p>
                    )}
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">
                    Konfirmasi password
                    <input
                      type="password"
                      minLength={6}
                      maxLength={72}
                      autoComplete="new-password"
                      value={wargaForm.confirm_password || ''}
                      onChange={(event) => {
                        setWargaForm((prev) => ({ ...prev, confirm_password: event.target.value }));
                        if (editErrors.confirm_password) setEditErrors((prev) => ({ ...prev, confirm_password: null }));
                      }}
                      className={`gov-input mt-1 transition-colors ${
                        editErrors.confirm_password ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-200' : ''
                      }`}
                      placeholder="Ulangi password baru"
                    />
                    {editErrors.confirm_password && (
                      <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">error</span>
                        {editErrors.confirm_password}
                      </p>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeEditWarga}
                  className="gov-btn-outline"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingWarga}
                  className="gov-btn-primary"
                >
                  <span className={`material-symbols-outlined text-base ${savingWarga ? 'animate-spin' : ''}`}>
                    {savingWarga ? 'progress_activity' : 'save'}
                  </span>
                  {savingWarga ? 'Menyimpan...' : 'Simpan perubahan'}
                </button>
              </div>
            </form>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
}
