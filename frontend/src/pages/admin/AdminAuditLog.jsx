import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { adminService } from '../../services/admin/adminApi';

export default function AdminAuditLog() {
  const { globalSearch } = useOutletContext() || {};
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getAuditLogs();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Gagal memuat rekam jejak audit sistem.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const getLogCategory = (text) => {
    const lower = (text || '').toLowerCase();
    if (lower.includes('status') || lower.includes('laporan') || lower.includes('tiket')) {
      return { label: 'Pengaduan', icon: 'assignment', tone: 'blue' };
    }
    if (lower.includes('warga') || lower.includes('registrasi') || lower.includes('verifikasi')) {
      return { label: 'Warga', icon: 'person', tone: 'emerald' };
    }
    if (lower.includes('notifikasi') || lower.includes('broadcast')) {
      return { label: 'Notifikasi', icon: 'notifications', tone: 'purple' };
    }
    return { label: 'Sistem', icon: 'info', tone: 'slate' };
  };

  const filteredLogs = useMemo(() => {
    const activeSearch = (search || globalSearch || '').trim().toLowerCase();
    return logs.filter((log) => {
      const category = getLogCategory(log.aktivitas);
      if (filterType !== 'all' && category.label.toLowerCase() !== filterType) {
        return false;
      }
      if (activeSearch) {
        const text = [
          log.aktivitas,
          log.id_user,
          log.timestamp,
        ].join(' ').toLowerCase();
        if (!text.includes(activeSearch)) return false;
      }
      return true;
    });
  }, [logs, search, globalSearch, filterType]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Catatan Rekam Jejak (Audit Log)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rekam jejak transparan dan kronologis seluruh tindakan pengubahan data, update verifikasi, dan aktivitas perangkat desa.
          </p>
        </div>
        <button
          type="button"
          onClick={loadAuditLogs}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors self-start sm:self-auto disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          {loading ? 'Memuat...' : 'Segarkan Log'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Category Filter */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aktivitas, admin, atau kata kunci..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Semua Kategori' },
              { id: 'pengaduan', label: 'Pengaduan' },
              { id: 'warga', label: 'Warga' },
              { id: 'notifikasi', label: 'Notifikasi' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  filterType === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}

            {(search || filterType !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setFilterType('all');
                }}
                className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin text-emerald-600">
              progress_activity
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-600">Memuat catatan rekam jejak...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 px-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">history</span>
            <p className="text-sm font-bold text-slate-700 mt-2">Belum ada rekam jejak yang tercatat</p>
            <p className="text-xs text-slate-400 mt-1">Setiap perubahan status dan verifikasi oleh admin akan otomatis tercatat di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="px-5 py-3.5 w-16 text-center">No</th>
                  <th className="px-5 py-3.5">Waktu Aktivitas</th>
                  <th className="px-5 py-3.5">Kategori</th>
                  <th className="px-5 py-3.5">Pelaksana / User</th>
                  <th className="px-5 py-3.5">Uraian Tindakan / Kejadian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLogs.map((entry, index) => {
                  const cat = getLogCategory(entry.aktivitas);
                  const toneBadge = {
                    blue: 'bg-blue-50 text-blue-800 border-blue-200',
                    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    purple: 'bg-purple-50 text-purple-800 border-purple-200',
                    slate: 'bg-slate-50 text-slate-800 border-slate-200',
                  }[cat.tone];

                  return (
                    <tr key={entry.id_log || index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 text-center font-mono text-slate-400 text-xs">
                        #{entry.id_log || index + 1}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 block text-xs">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB' : ''}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${toneBadge}`}>
                          <span className="material-symbols-outlined text-[13px]">{cat.icon}</span>
                          {cat.label}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block text-xs">
                          {entry.id_user ? `Perangkat #${entry.id_user}` : 'Sistem / Admin'}
                        </span>
                        <span className="text-[10px] text-slate-400">Pemerintah Desa Ngrowo</span>
                      </td>

                      <td className="px-5 py-4 text-slate-800 font-medium leading-relaxed max-w-xl">
                        {entry.aktivitas}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 border-t border-slate-200 bg-slate-50/50 text-xs text-slate-500 flex items-center justify-between">
          <span>Menampilkan {filteredLogs.length} rekam jejak sistem</span>
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <span className="material-symbols-outlined text-[15px]">security</span>
            Integritas Audit Terjamin
          </span>
        </div>
      </div>
    </div>
  );
}
