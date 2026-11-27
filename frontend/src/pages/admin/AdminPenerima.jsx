import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useOutletContext } from 'react-router-dom';
import { adminService } from '../../services/admin/adminApi';
import { BANSOS_PROGRAMS } from '../../constants';

const PROGRAM_OPTIONS = BANSOS_PROGRAMS.filter(({ id }) => id !== 'all');
const OTHER_PROGRAM = 'Lainnya';

export default function AdminPenerima() {
  const { globalSearch } = useOutletContext() || {};
  const [dataPenerima, setDataPenerima] = useState([]);
  const [wargaList, setWargaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [wargaSearch, setWargaSearch] = useState('');
  const [form, setForm] = useState({
    nik_penerima: '',
    jenis_bansos: 'PKH',
    jenis_bansos_lainnya: '',
    periode_tahun: new Date().getFullYear(),
    periode_bulan: new Date().getMonth() + 1,
    status_penerima: 'aktif',
    rt: '',
    rw: '',
    no_kk: '',
  });
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterRt, setFilterRt] = useState('');
  const [filterRw, setFilterRw] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [data, warga, eligible] = await Promise.all([
        adminService.getPenerimaBansos(),
        adminService.getWarga(),
        adminService.getEligibleResidents(),
      ]);
      setDataPenerima(Array.isArray(data) ? data : []);
      const accounts = Array.isArray(warga) ? warga.filter((w) => w.is_active) : [];
      const accountNiks = new Set(accounts.map((w) => w.nik));
      const eligibleWithoutAccount = Array.isArray(eligible)
        ? eligible
          .filter((resident) => resident.is_active && !accountNiks.has(resident.nik))
          .map((resident) => ({
            id_user: `eligible-${resident.id}`,
            nik: resident.nik,
            nama_lengkap: resident.nama_lengkap,
            no_kk: null,
            rt: resident.rt || '',
            rw: resident.rw || '',
            desil: resident.desil,
            is_active: true,
            is_eligible_only: true,
          }))
        : [];
      setWargaList([...accounts, ...eligibleWithoutAccount]);
    } catch (err) {
      setError(err.message || 'Gagal memuat data penerima bansos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const jenisOptions = useMemo(() => {
    return [...new Set(dataPenerima.map((d) => d.jenis_bansos).filter(Boolean))].sort();
  }, [dataPenerima]);

  const rtOptions = useMemo(() => {
    return [...new Set(dataPenerima.map((d) => d.rt).filter(Boolean))].sort();
  }, [dataPenerima]);

  const rwOptions = useMemo(() => {
    return [...new Set(dataPenerima.map((d) => d.rw).filter(Boolean))].sort();
  }, [dataPenerima]);

  const filteredPenerima = useMemo(() => {
    const activeSearch = (search || globalSearch || '').trim().toLowerCase();
    return dataPenerima.filter((item) => {
      if (!showInactive && !item.is_active) return false;
      if (filterJenis && item.jenis_bansos !== filterJenis) return false;
      if (filterRt && item.rt !== filterRt) return false;
      if (filterRw && item.rw !== filterRw) return false;

      if (activeSearch) {
        const text = [
          item.nama_penerima,
          item.nik_penerima,
          item.no_kk,
          item.jenis_bansos,
          item.rt,
          item.rw,
        ].join(' ').toLowerCase();
        if (!text.includes(activeSearch)) return false;
      }
      return true;
    });
  }, [dataPenerima, search, globalSearch, filterJenis, filterRt, filterRw, showInactive]);

  const filteredWargaSelect = useMemo(() => {
    const q = wargaSearch.trim().toLowerCase();
    if (!q) return wargaList;
    return wargaList.filter((w) => {
      const text = `${w.nama_lengkap} ${w.nik} ${w.no_kk || ''} ${w.rt || ''} ${w.rw || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [wargaList, wargaSearch]);

  const selectedWargaObj = useMemo(() => {
    if (!form.nik_penerima) return null;
    return wargaList.find((w) => w.nik === form.nik_penerima) || null;
  }, [wargaList, form.nik_penerima]);

  const handleSelectWarga = (warga) => {
    setForm((prev) => ({
      ...prev,
      nik_penerima: warga.nik,
      rt: warga.rt || prev.rt || '',
      rw: warga.rw || prev.rw || '',
      no_kk: warga.no_kk || prev.no_kk || '',
    }));
    setError('');
  };

  const handleClearSelectedWarga = () => {
    setForm((prev) => ({
      ...prev,
      nik_penerima: '',
      rt: '',
      rw: '',
      no_kk: '',
    }));
    setWargaSearch('');
  };

  const startCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
    setWargaSearch('');
    setForm({
      nik_penerima: '',
      jenis_bansos: 'PKH',
      jenis_bansos_lainnya: '',
      periode_tahun: new Date().getFullYear(),
      periode_bulan: new Date().getMonth() + 1,
      status_penerima: 'aktif',
      rt: '',
      rw: '',
      no_kk: '',
    });
    setError('');
  };

  const startEdit = (item) => {
    const isKnownProgram = PROGRAM_OPTIONS.some(({ id }) => id === item.jenis_bansos);
    setEditingItem(item);
    setIsFormOpen(true);
    setWargaSearch('');
    setForm({
      nik_penerima: item.nik_penerima,
      jenis_bansos: isKnownProgram ? item.jenis_bansos : OTHER_PROGRAM,
      jenis_bansos_lainnya: isKnownProgram ? '' : item.jenis_bansos,
      periode_tahun: item.periode_tahun,
      periode_bulan: item.periode_bulan || '',
      status_penerima: item.status_penerima,
      rt: item.rt,
      rw: item.rw,
      no_kk: item.no_kk || '',
    });
    setError('');
  };

  const saveItem = async (event) => {
    event.preventDefault();
    if (!editingItem && !form.nik_penerima) {
      setError('Silakan cari dan pilih salah satu warga dari data kependudukan.');
      return;
    }
    const jenisBansos = form.jenis_bansos === OTHER_PROGRAM
      ? form.jenis_bansos_lainnya.trim()
      : form.jenis_bansos;
    if (!jenisBansos) {
      setError('Isi nama program bantuan lainnya.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setFeedback('');
      if (editingItem) {
        await adminService.updatePenerimaBansos(editingItem.id_bansos, {
          jenis_bansos: jenisBansos,
          periode_tahun: Number(form.periode_tahun),
          periode_bulan: form.periode_bulan ? Number(form.periode_bulan) : null,
          status_penerima: form.status_penerima,
          rt: form.rt,
          rw: form.rw,
          no_kk: form.no_kk || null,
          is_active: true,
        });
      } else {
        const resident = wargaList.find((item) => item.nik === form.nik_penerima);
        if (!resident) throw new Error('Pilih warga dari data kependudukan warga.');
        await adminService.createPenerimaBansos({
          nik_penerima: resident.nik,
          nama_penerima: resident.nama_lengkap,
          no_kk: form.no_kk || resident.no_kk || null,
          jenis_bansos: jenisBansos,
          periode_tahun: Number(form.periode_tahun),
          periode_bulan: form.periode_bulan ? Number(form.periode_bulan) : null,
          status_penerima: form.status_penerima,
          rt: form.rt || resident.rt || '',
          rw: form.rw || resident.rw || '',
        });
      }
      setIsFormOpen(false);
      setEditingItem(null);
      setFeedback(`Data penerima berhasil ${editingItem ? 'diperbarui' : 'ditambahkan'}.`);
      await loadData();
    } catch (saveError) {
      setError(saveError.message || 'Data penerima gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  const archiveItem = async (item) => {
    if (!window.confirm(`Arsipkan data penerima ${item.nama_penerima}? Riwayat tidak akan dihapus.`)) return;
    try {
      setError('');
      setFeedback('');
      await adminService.archivePenerimaBansos(item.id_bansos);
      setFeedback('Data penerima berhasil diarsipkan.');
      await loadData();
    } catch (actionError) {
      setError(actionError.message || 'Data penerima gagal diarsipkan.');
    }
  };

  return (
    <div className="space-y-6 motion-reveal">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Data Penerima Bantuan Sosial
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Transparansi daftar penerima PKH, BPNT, dan BLT Dana Desa di lingkungan Kelurahan Ngrowo.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button type="button" onClick={startCreate} className="gov-btn-primary min-h-10 px-3 text-xs">
            <span className="material-symbols-outlined text-base">person_add</span>Tambah penerima
          </button>
          <button type="button" onClick={loadData} disabled={loading} className="gov-btn-outline min-h-10 px-3 text-xs disabled:opacity-50">
            <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
            <span className="hidden sm:inline">{loading ? 'Memuat...' : 'Segarkan'}</span>
          </button>
        </div>
      </div>

      {feedback && <div role="status" className="motion-pop-in rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{feedback}</div>}
      {error && (
        <div className="p-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
          <button type="button" onClick={loadData} className="ml-auto font-bold underline">Coba lagi</button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama penerima, NIK..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="">Semua Bansos</option>
              {jenisOptions.map((j) => (
                <option key={j} value={j}>{j}</option>
              ))}
            </select>

            <select
              value={filterRt}
              onChange={(e) => setFilterRt(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="">Semua RT</option>
              {rtOptions.map((rt) => (
                <option key={rt} value={rt}>RT {rt}</option>
              ))}
            </select>

            <select
              value={filterRw}
              onChange={(e) => setFilterRw(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="">Semua RW</option>
              {rwOptions.map((rw) => (
                <option key={rw} value={rw}>RW {rw}</option>
              ))}
            </select>

            {(search || filterJenis || filterRt || filterRw) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterJenis('');
                  setFilterRt('');
                  setFilterRw('');
                }}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Reset
              </button>
            )}
            <label className="ml-1 inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="h-4 w-4 accent-emerald-700" />
              Arsip
            </label>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin text-emerald-600">
              progress_activity
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-600">Memuat data penerima bansos...</p>
          </div>
        ) : filteredPenerima.length === 0 ? (
          <div className="py-16 text-center text-slate-400 px-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">folder_off</span>
            <p className="text-sm font-bold text-slate-700 mt-2">Tidak ada data penerima bansos yang cocok</p>
            <p className="text-xs text-slate-400 mt-1">Coba atur ulang kata pencarian atau filter program bansos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Nama Penerima</th>
                  <th className="px-5 py-3.5">NIK Penerima</th>
                  <th className="px-5 py-3.5">Program Bansos</th>
                  <th className="px-5 py-3.5">Wilayah</th>
                  <th className="px-5 py-3.5">Periode</th>
                  <th className="px-5 py-3.5">Desil</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPenerima.map((item, index) => (
                  <tr key={item.id_bansos} className="motion-row hover:bg-emerald-50/30" style={{ '--stagger-index': Math.min(index, 8) }}>
                    <td className="px-5 py-4 font-bold text-slate-900 text-xs">
                      {item.nama_penerima}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-700">
                      {item.nik_penerima}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                        {item.jenis_bansos}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800 block text-xs">
                        RT {item.rt} / RW {item.rw}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      {item.periode_bulan ? `${new Date(2000, item.periode_bulan - 1, 1).toLocaleString('id-ID', { month: 'long' })} ` : ''}{item.periode_tahun}
                    </td>
                    <td className="px-5 py-4"><span className="rounded-full bg-amber-50 px-2.5 py-1 font-bold text-amber-900">Desil {item.desil ?? '-'}</span></td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${item.is_active ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {item.is_active ? item.status_penerima : 'diarsipkan'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button type="button" onClick={() => startEdit(item)} className="mr-1 inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50">
                        <span className="material-symbols-outlined text-sm">{item.is_active ? 'edit' : 'restore'}</span>{item.is_active ? 'Edit' : 'Pulihkan'}
                      </button>
                      {item.is_active && <button type="button" onClick={() => archiveItem(item)} className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-rose-200 px-2.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50"><span className="material-symbols-outlined text-sm">archive</span>Arsip</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {filteredPenerima.length} dari {dataPenerima.length} penerima bansos</span>
          <span>Transparansi Desa Ngrowo</span>
        </div>
      </div>

      {isFormOpen && createPortal(
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setIsFormOpen(false); setError(''); } }}>
          <section role="dialog" aria-modal="true" aria-labelledby="penerima-form-title" className="modal-panel motion-modal max-w-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-800">Data program bansos</p><h3 id="penerima-form-title" className="mt-1 text-lg font-extrabold text-slate-900">{editingItem ? (editingItem.is_active ? 'Edit penerima' : 'Pulihkan data penerima') : 'Tambah penerima bansos'}</h3></div>
              <button type="button" onClick={() => { setIsFormOpen(false); setError(''); }} aria-label="Tutup formulir" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"><span className="material-symbols-outlined">close</span></button>
            </div>
            {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
            <form onSubmit={saveItem} className="space-y-3">
              {editingItem ? (
                <label className="block text-xs font-semibold text-slate-700">Warga<input readOnly value={`${editingItem.nama_penerima} · ${editingItem.nik_penerima}`} className="gov-input mt-1 bg-slate-100 font-mono" /></label>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700">
                      Pilih Warga (dari Data Kependudukan) <span className="text-rose-500">*</span>
                    </label>
                    {selectedWargaObj && (
                      <button
                        type="button"
                        onClick={handleClearSelectedWarga}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                        Ganti Warga
                      </button>
                    )}
                  </div>

                  {selectedWargaObj ? (
                    <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/70 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0">
                          {selectedWargaObj.nama_lengkap?.charAt(0).toUpperCase() || 'W'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">
                              {selectedWargaObj.nama_lengkap}
                            </span>
                            {selectedWargaObj.is_eligible_only && (
                              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                Belum memiliki akun
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Desil {selectedWargaObj.desil ?? 4}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-0.5 flex-wrap">
                            <span>NIK: {selectedWargaObj.nik}</span>
                            <span>•</span>
                            <span>RT {selectedWargaObj.rt || '-'}/RW {selectedWargaObj.rw || '-'}</span>
                            {selectedWargaObj.no_kk && (
                              <>
                                <span>•</span>
                                <span>KK: {selectedWargaObj.no_kk}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-emerald-700 text-[22px] shrink-0" title="Warga terpilih">
                        check_circle
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                          search
                        </span>
                        <input
                          type="text"
                          value={wargaSearch}
                          onChange={(e) => setWargaSearch(e.target.value)}
                          placeholder="Cari berdasarkan nama, NIK, No KK, atau RT/RW..."
                          className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 text-xs focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                        />
                        {wargaSearch && (
                          <button
                            type="button"
                            onClick={() => setWargaSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {wargaList.length === 0 ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                          {loading ? 'Memuat data warga...' : 'Belum ada data warga eligible aktif. Tambahkan warga melalui tab Daftar warga & desil terlebih dahulu.'}
                        </div>
                      ) : filteredWargaSelect.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                          <span className="material-symbols-outlined text-2xl text-slate-400 block mb-1">person_search</span>
                          Tidak ditemukan warga dengan kata kunci "{wargaSearch}"
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 shadow-inner">
                          {filteredWargaSelect.map((warga) => (
                            <button
                              key={warga.id_user}
                              type="button"
                              onClick={() => handleSelectWarga(warga)}
                              className="w-full text-left p-2.5 hover:bg-emerald-50/70 transition-colors flex items-center justify-between gap-3 group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-7 w-7 rounded-full bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                                  {warga.nama_lengkap?.charAt(0).toUpperCase() || 'W'}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-900">
                                    {warga.nama_lengkap}
                                  </p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                                    NIK: {warga.nik} · RT {warga.rt || '-'}/RW {warga.rw || '-'}
                                  </p>
                                  {warga.is_eligible_only && <span className="mt-1 inline-flex rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-800">Belum memiliki akun</span>}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                  Desil {warga.desil ?? 4}
                                </span>
                                <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover:text-emerald-700">
                                  arrow_forward
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">Program bantuan
                  <select required value={form.jenis_bansos} onChange={(event) => setForm((value) => ({ ...value, jenis_bansos: event.target.value, jenis_bansos_lainnya: '' }))} className="gov-input mt-1">
                    {PROGRAM_OPTIONS.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                    <option value={OTHER_PROGRAM}>{OTHER_PROGRAM}</option>
                  </select>
                  {form.jenis_bansos === OTHER_PROGRAM && (
                    <input
                      required
                      minLength="2"
                      maxLength="50"
                      value={form.jenis_bansos_lainnya}
                      onChange={(event) => setForm((value) => ({ ...value, jenis_bansos_lainnya: event.target.value }))}
                      className="gov-input mt-2"
                      placeholder="Contoh: Bansos Beras CPP"
                    />
                  )}
                </label>
                <label className="block text-xs font-semibold text-slate-700">Tahun periode
                  <input required type="number" min="2000" max="2100" value={form.periode_tahun} onChange={(event) => setForm((value) => ({ ...value, periode_tahun: event.target.value }))} className="gov-input mt-1" />
                </label>
                <label className="block text-xs font-semibold text-slate-700">Bulan mulai menerima
                  <select value={form.periode_bulan} onChange={(event) => setForm((value) => ({ ...value, periode_bulan: event.target.value }))} className="gov-input mt-1">
                    <option value="">Tidak ditentukan</option>
                    {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => <option key={month} value={month}>{new Date(2000, month - 1, 1).toLocaleString('id-ID', { month: 'long' })}</option>)}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">RT
                  <input required maxLength="10" value={form.rt} onChange={(event) => setForm((value) => ({ ...value, rt: event.target.value }))} className="gov-input mt-1" />
                </label>
                <label className="block text-xs font-semibold text-slate-700">RW
                  <input required maxLength="10" value={form.rw} onChange={(event) => setForm((value) => ({ ...value, rw: event.target.value }))} className="gov-input mt-1" />
                </label>
                <label className="block text-xs font-semibold text-slate-700">Status program
                  <select value={form.status_penerima} onChange={(event) => setForm((value) => ({ ...value, status_penerima: event.target.value }))} className="gov-input mt-1">
                    <option value="aktif">Aktif</option><option value="graduasi">Graduasi</option><option value="penangguhan">Penangguhan</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-slate-700">Nomor KK (opsional)
                  <input maxLength="16" value={form.no_kk} onChange={(event) => setForm((value) => ({ ...value, no_kk: event.target.value }))} className="gov-input mt-1 font-mono" />
                </label>
              </div>
              {editingItem && !editingItem.is_active && <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Desil mengikuti data induk warga. Pulihkan data ini hanya jika penetapan program masih berlaku.</p>}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => { setIsFormOpen(false); setError(''); }} className="gov-btn-outline">Batal</button>
                <button type="submit" disabled={saving} className="gov-btn-primary"><span className={`material-symbols-outlined text-base ${saving ? 'animate-spin' : ''}`}>{saving ? 'progress_activity' : 'save'}</span>{saving ? 'Menyimpan...' : editingItem?.is_active === false ? 'Pulihkan data' : 'Simpan data'}</button>
              </div>
            </form>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
