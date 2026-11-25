import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { adminService } from '../../services/admin/adminApi';

export default function AdminPenerima() {
  const { globalSearch } = useOutletContext() || {};
  const [dataPenerima, setDataPenerima] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterRt, setFilterRt] = useState('');
  const [filterRw, setFilterRw] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const emptyForm = {
    nama_penerima: '', nik_penerima: '', no_kk: '', jenis_bansos: 'PKH',
    periode_tahun: new Date().getFullYear(), status_penerima: 'aktif', rt: '', rw: '', desil: 4,
  };
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getPenerimaBansos();
      setDataPenerima(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data penerima bansos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id_bansos);
    setForm({ ...item, nik_penerima: item.nik_penerima?.replace(/\*/g, '') || '', no_kk: item.no_kk?.replace(/\*/g, '') || '' });
    setIsModalOpen(true);
  };

  const savePenerima = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const payload = { ...form, periode_tahun: Number(form.periode_tahun), desil: Number(form.desil) };
      if (editingId) await adminService.updatePenerimaBansos(editingId, payload);
      else await adminService.createPenerimaBansos(payload);
      setIsModalOpen(false);
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data penerima bansos.');
    } finally {
      setSaving(false);
    }
  };

  const removePenerima = async (item) => {
    if (!window.confirm(`Hapus data penerima ${item.nama_penerima}?`)) return;
    try {
      await adminService.deletePenerimaBansos(item.id_bansos);
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menghapus data penerima bansos.');
    }
  };

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
  }, [dataPenerima, search, globalSearch, filterJenis, filterRt, filterRw]);

  return (
    <div className="space-y-6">
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
        <div className="flex items-center gap-2">
          <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#166534] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#14532d]">
            <span className="material-symbols-outlined text-[18px]">add</span> Tambah Penerima
          </button>
          <button type="button" onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50">
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            {loading ? 'Memuat...' : 'Segarkan Data'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
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
                  <th className="px-5 py-3.5">Desil</th>
                  <th className="px-5 py-3.5">Wilayah</th>
                  <th className="px-5 py-3.5">Periode</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPenerima.map((item) => (
                  <tr key={item.id_bansos} className="hover:bg-slate-50/70 transition-colors">
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
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                        Desil {item.desil ?? '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800 block text-xs">
                        RT {item.rt} / RW {item.rw}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      Tahun {item.periode_tahun || 2026}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#166534] border border-emerald-200 capitalize">
                        {item.status_penerima || 'aktif'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <button type="button" onClick={() => openEdit(item)} className="mr-1 rounded-lg p-1.5 text-blue-700 hover:bg-blue-50" title="Edit penerima">
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                      <button type="button" onClick={() => removePenerima(item)} className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-50" title="Hapus penerima">
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <form onSubmit={savePenerima} className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">{editingId ? 'Edit Data Penerima' : 'Tambah Data Penerima'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['nama_penerima', 'Nama penerima'], ['nik_penerima', 'NIK penerima'], ['no_kk', 'No. KK'],
                ['jenis_bansos', 'Program bansos'], ['periode_tahun', 'Periode tahun'], ['rt', 'RT'], ['rw', 'RW'],
              ].map(([key, label]) => (
                <label key={key} className="text-xs font-bold text-slate-700">{label}
                  <input required={key !== 'no_kk'} value={form[key] ?? ''} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-normal focus:border-emerald-600 focus:outline-none" />
                </label>
              ))}
              <label className="text-xs font-bold text-slate-700">Desil
                <select value={form.desil} onChange={(event) => setForm({ ...form, desil: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-normal focus:border-emerald-600 focus:outline-none">
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>Desil {value}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700">Status
                <select value={form.status_penerima} onChange={(event) => setForm({ ...form, status_penerima: event.target.value })} className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-xs font-normal focus:border-emerald-600 focus:outline-none">
                  <option value="aktif">Aktif</option><option value="graduasi">Graduasi</option><option value="penangguhan">Penangguhan</option>
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Batal</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-[#166534] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
