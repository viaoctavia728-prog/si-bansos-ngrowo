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
          item.dusun,
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
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          {loading ? 'Memuat...' : 'Segarkan Data'}
        </button>
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
                  <th className="px-5 py-3.5">Wilayah</th>
                  <th className="px-5 py-3.5">Periode</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
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
                      <span className="font-semibold text-slate-800 block text-xs">
                        RT {item.rt} / RW {item.rw}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {item.dusun || 'Desa Ngrowo'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600">
                      Tahun {item.periode_tahun || 2026}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 capitalize">
                        {item.status_penerima || 'aktif'}
                      </span>
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
    </div>
  );
}
