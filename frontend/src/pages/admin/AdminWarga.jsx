import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { adminService } from '../../services/admin/adminApi';
import AdminEligibleResidents from './AdminEligibleResidents';

export default function AdminWarga() {
  const { globalSearch } = useOutletContext() || {};
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterRt, setFilterRt] = useState('');
  const [filterRw, setFilterRw] = useState('');
  const [filterVerified, setFilterVerified] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState('accounts');
  const [editingWarga, setEditingWarga] = useState(null);
  const [wargaForm, setWargaForm] = useState({});
  const [savingWarga, setSavingWarga] = useState(false);

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
      if (filterRt && person.rt !== filterRt) return false;
      if (filterRw && person.rw !== filterRw) return false;
      if (filterVerified === 'verified' && (!person.is_ngrowo_resident || !person.is_verified)) return false;
      if (filterVerified === 'pending' && (person.is_ngrowo_resident && person.is_verified)) return false;

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

  const openEditWarga = (person) => {
    setEditingWarga(person);
    setWargaForm({
      nama_lengkap: person.nama_lengkap || '',
      no_kk: person.no_kk || '',
      no_hp: person.no_hp || '',
      rt: person.rt || '',
      rw: person.rw || '',
      alamat_detail: person.alamat_detail || '',
      desil: person.desil ?? '',
    });
    setError('');
  };

  const saveWarga = async (event) => {
    event.preventDefault();
    if (!editingWarga) return;
    try {
      setSavingWarga(true);
      setFeedback(null);
      await adminService.updateWarga(editingWarga.id_user, {
        ...wargaForm,
        no_kk: wargaForm.no_kk || null,
        no_hp: wargaForm.no_hp || null,
        desil: wargaForm.desil === '' ? null : Number(wargaForm.desil),
      });
      setEditingWarga(null);
      setFeedback({ type: 'success', message: `Data ${wargaForm.nama_lengkap} berhasil diperbarui.` });
      await loadWarga();
    } catch (saveError) {
      setError(saveError.message || 'Data warga gagal diperbarui.');
    } finally {
      setSavingWarga(false);
    }
  };

  return (
    <div className="space-y-6 motion-reveal">
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
        <button
          type="button"
          onClick={loadWarga}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          {loading ? 'Memuat...' : 'Segarkan Data'}
        </button>
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

      {error && (
        <div className="p-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <div role="tablist" aria-label="Jenis data warga" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button type="button" role="tab" aria-selected={activeTab === 'accounts'} onClick={() => setActiveTab('accounts')} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${activeTab === 'accounts' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
          <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-base">manage_accounts</span>Akun warga</span>
        </button>
        <button type="button" role="tab" aria-selected={activeTab === 'eligible'} onClick={() => setActiveTab('eligible')} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${activeTab === 'eligible' ? 'bg-emerald-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
          <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-base">groups</span>Daftar warga &amp; desil</span>
        </button>
      </div>

      {activeTab === 'eligible' ? <AdminEligibleResidents /> : (
      <>
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
              onChange={(e) => setFilterVerified(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-700 focus:bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="all">Semua Status</option>
              <option value="verified">Terverifikasi</option>
              <option value="pending">Perlu Verifikasi</option>
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
                  <th className="px-5 py-3.5">Wilayah</th>
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
                        <span className="text-[10px] text-amber-800 block mt-0.5">Desil {person.desil ?? 'belum ditetapkan'}</span>
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
                            Akun Nonaktif
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
                              title="Nonaktifkan akun"
                            >
                              Nonaktifkan
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
                          ) : <span className="text-[11px] text-emerald-800 font-semibold">Terverifikasi</span>}
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
      </>
      )}

      {editingWarga && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingWarga(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="edit-warga-title" className="modal-panel motion-modal max-w-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-800">Pembaruan akun</p><h3 id="edit-warga-title" className="mt-1 text-lg font-extrabold text-slate-900">Edit data warga</h3></div>
              <button type="button" onClick={() => setEditingWarga(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Tutup formulir"><span className="material-symbols-outlined">close</span></button>
            </div>
            {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
            <form onSubmit={saveWarga} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">Nama lengkap<input required minLength="2" maxLength="100" value={wargaForm.nama_lengkap || ''} onChange={(event) => setWargaForm((value) => ({ ...value, nama_lengkap: event.target.value }))} className="gov-input mt-1" /></label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">NIK<input readOnly value={editingWarga.nik} className="gov-input mt-1 bg-slate-100 font-mono" /></label>
                <label className="block text-xs font-semibold text-slate-700">Nomor KK<input maxLength="16" value={wargaForm.no_kk || ''} onChange={(event) => setWargaForm((value) => ({ ...value, no_kk: event.target.value }))} className="gov-input mt-1 font-mono" /></label>
                <label className="block text-xs font-semibold text-slate-700">Nomor telepon<input maxLength="15" value={wargaForm.no_hp || ''} onChange={(event) => setWargaForm((value) => ({ ...value, no_hp: event.target.value }))} className="gov-input mt-1" /></label>
                <label className="block text-xs font-semibold text-slate-700">Desil
                  <select value={wargaForm.desil} onChange={(event) => setWargaForm((value) => ({ ...value, desil: event.target.value }))} className="gov-input mt-1">
                    <option value="">Belum ditetapkan</option>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>Desil {value}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">RT<input maxLength="10" value={wargaForm.rt || ''} onChange={(event) => setWargaForm((value) => ({ ...value, rt: event.target.value }))} className="gov-input mt-1" /></label>
                <label className="block text-xs font-semibold text-slate-700">RW<input maxLength="10" value={wargaForm.rw || ''} onChange={(event) => setWargaForm((value) => ({ ...value, rw: event.target.value }))} className="gov-input mt-1" /></label>
              </div>
              <label className="block text-xs font-semibold text-slate-700">Alamat lengkap<textarea rows={2} maxLength="255" value={wargaForm.alamat_detail || ''} onChange={(event) => setWargaForm((value) => ({ ...value, alamat_detail: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/15" /></label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setEditingWarga(null)} className="gov-btn-outline">Batal</button>
                <button type="submit" disabled={savingWarga} className="gov-btn-primary"><span className={`material-symbols-outlined text-base ${savingWarga ? 'animate-spin' : ''}`}>{savingWarga ? 'progress_activity' : 'save'}</span>{savingWarga ? 'Menyimpan...' : 'Simpan perubahan'}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
