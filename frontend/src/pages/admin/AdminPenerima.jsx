import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { adminService } from '../../services/admin/adminApi';

export default function AdminPenerima() {
  const { globalSearch } = useOutletContext() || {};
  const [dataPenerima, setDataPenerima] = useState([]);
  const [eligibleResidents, setEligibleResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({
    nik_penerima: '',
    jenis_bansos: 'PKH',
    periode_tahun: new Date().getFullYear(),
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
      const [data, residents] = await Promise.all([
        adminService.getPenerimaBansos(),
        adminService.getEligibleResidents(),
      ]);
      setDataPenerima(Array.isArray(data) ? data : []);
      setEligibleResidents(Array.isArray(residents) ? residents.filter((resident) => resident.is_active) : []);
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

  const startCreate = () => {
    setEditingItem(null);
    setIsFormOpen(true);
    setForm({
      nik_penerima: '',
      jenis_bansos: 'PKH',
      periode_tahun: new Date().getFullYear(),
      status_penerima: 'aktif',
      rt: '',
      rw: '',
      no_kk: '',
    });
    setError('');
  };

  const startEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
    setForm({
      nik_penerima: item.nik_penerima,
      jenis_bansos: item.jenis_bansos,
      periode_tahun: item.periode_tahun,
      status_penerima: item.status_penerima,
      rt: item.rt,
      rw: item.rw,
      no_kk: item.no_kk || '',
    });
    setError('');
  };

  const saveItem = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError('');
      setFeedback('');
      if (editingItem) {
        await adminService.updatePenerimaBansos(editingItem.id_bansos, {
          jenis_bansos: form.jenis_bansos,
          periode_tahun: Number(form.periode_tahun),
          status_penerima: form.status_penerima,
          rt: form.rt,
          rw: form.rw,
          no_kk: form.no_kk || null,
          is_active: true,
        });
      } else {
        const resident = eligibleResidents.find((item) => item.nik === form.nik_penerima);
        if (!resident) throw new Error('Pilih warga dari daftar warga aktif.');
        await adminService.createPenerimaBansos({
          nik_penerima: resident.nik,
          nama_penerima: resident.nama_lengkap,
          no_kk: form.no_kk || null,
          jenis_bansos: form.jenis_bansos,
          periode_tahun: Number(form.periode_tahun),
          status_penerima: form.status_penerima,
          rt: form.rt,
          rw: form.rw,
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
                      Tahun {item.periode_tahun}
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

      {isFormOpen && (
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
                <label className="block text-xs font-semibold text-slate-700">Pilih warga eligible
                  <select required value={form.nik_penerima} onChange={(event) => setForm((value) => ({ ...value, nik_penerima: event.target.value }))} className="gov-input mt-1">
                    <option value="">Pilih warga...</option>
                    {eligibleResidents.map((resident) => <option key={resident.id} value={resident.nik}>{resident.nama_lengkap} · {resident.nik}</option>)}
                  </select>
                </label>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700">Program bantuan
                  <input required minLength="2" maxLength="50" value={form.jenis_bansos} onChange={(event) => setForm((value) => ({ ...value, jenis_bansos: event.target.value }))} className="gov-input mt-1" placeholder="Contoh: PKH" />
                </label>
                <label className="block text-xs font-semibold text-slate-700">Tahun periode
                  <input required type="number" min="2000" max="2100" value={form.periode_tahun} onChange={(event) => setForm((value) => ({ ...value, periode_tahun: event.target.value }))} className="gov-input mt-1" />
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
        </div>
      )}
    </div>
  );
}
