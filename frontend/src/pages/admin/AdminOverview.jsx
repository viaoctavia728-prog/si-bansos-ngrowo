import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin/adminApi';

export default function AdminOverview() {
  const [items, setItems] = useState([]);
  const [warga, setWarga] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [pengaduanRes, wargaRes, auditRes] = await Promise.all([
        adminService.getPengaduan().catch(() => []),
        adminService.getWarga().catch(() => []),
        adminService.getAuditLogs().catch(() => []),
      ]);
      setItems(Array.isArray(pengaduanRes) ? pengaduanRes : []);
      setWarga(Array.isArray(wargaRes) ? wargaRes : []);
      setAuditLogs(Array.isArray(auditRes) ? auditRes : []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data statistik dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status_laporan === 'pending').length,
      proses: items.filter((item) => item.status_laporan === 'proses').length,
      selesai: items.filter((item) => item.status_laporan === 'selesai').length,
      ditolak: items.filter((item) => item.status_laporan === 'ditolak').length,
    };
  }, [items]);

  const recentReports = useMemo(() => {
    return [...items]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 5);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Ringkasan Sistem & Statistik
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau ringkasan real-time permohonan bansos, pengaduan warga, dan verifikasi kependudukan Desa Ngrowo.
          </p>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-xs self-start sm:self-auto transition-colors disabled:opacity-50"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          {loading ? 'Memuat...' : 'Segarkan Data'}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-600">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Laporan Masuk"
          value={stats.total}
          subtext="Semua tiket terdaftar"
          icon="folder"
          tone="blue"
          loading={loading}
        />
        <StatCard
          label="Perlu Tindak Lanjut"
          value={stats.pending}
          subtext="Prioritas verifikasi RT/RW"
          icon="schedule"
          tone="amber"
          loading={loading}
        />
        <StatCard
          label="Sedang Diproses"
          value={stats.proses}
          subtext="Tahap survei lapangan"
          icon="autorenew"
          tone="indigo"
          loading={loading}
        />
        <StatCard
          label="Laporan Selesai"
          value={stats.selesai}
          subtext="Masuk Berita Acara Musdes"
          icon="check_circle"
          tone="green"
          loading={loading}
        />
      </div>

      {/* 2 COLUMNS: Breakdown & Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progress Breakdown */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Distribusi Status Penanganan</h3>
              <p className="text-xs text-slate-500 mt-0.5">Persentase kemajuan penyelesaian aduan warga</p>
            </div>
            <Link
              to="/admin/pengaduan"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Lihat Detail
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {[
              { label: 'Menunggu Tinjauan (Pending)', value: stats.pending, color: 'bg-amber-500', text: 'text-amber-800' },
              { label: 'Sedang Proses Verifikasi', value: stats.proses, color: 'bg-blue-600', text: 'text-blue-800' },
              { label: 'Selesai / Terverifikasi Musdes', value: stats.selesai, color: 'bg-emerald-600', text: 'text-emerald-800' },
              { label: 'Ditolak (Data Tidak Sesuai)', value: stats.ditolak, color: 'bg-rose-500', text: 'text-rose-800' },
            ].map((row) => {
              const percentage = stats.total > 0 ? Math.round((row.value / stats.total) * 100) : 0;
              return (
                <div key={row.label} className="py-4">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-slate-700">{row.label}</span>
                    <span className={row.text}>{row.value} aduan ({percentage}%)</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${row.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total basis data kependudukan terdaftar:</span>
            <span className="font-bold text-slate-800">{warga.length} Jiwa</span>
          </div>
        </div>

        {/* Laporan Terbaru */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Laporan Pengaduan Terbaru</h3>
              <p className="text-xs text-slate-500 mt-0.5">5 laporan terakhir dari warga</p>
            </div>
            <Link
              to="/admin/pengaduan"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Semua
            </Link>
          </div>

          <div className="flex-1 mt-3">
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <span className="material-symbols-outlined text-3xl animate-spin text-slate-300">progress_activity</span>
                <p className="mt-2">Memuat daftar laporan...</p>
              </div>
            ) : recentReports.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
                <p className="mt-2 text-xs font-semibold text-slate-600">Belum ada laporan pengaduan</p>
                <p className="text-[11px] text-slate-400">Aduan warga akan otomatis masuk ke sini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReports.map((item) => (
                  <div key={item.id_laporan} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-700">{item.nomor_tiket}</span>
                        {item.is_anonymous && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                            Anonim
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-800 truncate mt-0.5">
                        {item.kategori_aduan || 'Pengaduan Warga'}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </p>
                    </div>
                    <StatusBadge status={item.status_laporan} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ACCESS ACTIONS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">Akses Pintas Layanan Desa</h3>
        <p className="text-xs text-slate-500 mb-4">Navigasi cepat ke modul kerja administrasi SI-BANSOS</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/pengaduan"
            className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-[#1b7340] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">assignment</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Manajemen Pengaduan</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{stats.pending} perlu ditinjau</p>
            </div>
          </Link>

          <Link
            to="/admin/warga"
            className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">groups</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Kelola Data Warga</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{warga.length} akun terdaftar</p>
            </div>
          </Link>

          <Link
            to="/admin/penerima"
            className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">folder_shared</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Data Penerima Bansos</p>
              <p className="text-[11px] text-slate-500 mt-0.5">PKH, BPNT & BLT</p>
            </div>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">history_edu</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Catatan Rekam Jejak</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{auditLogs.length} aksi tercatat</p>
            </div>
          </Link>

          <Link
            to="/admin/jadwal"
            className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">calendar_month</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Jadwal Penyaluran</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Kalender & Agenda Real-time</p>
            </div>
          </Link>

          <Link
            to="/admin/notifikasi"
            className="flex items-center gap-3.5 rounded-xl border border-slate-200/80 p-4 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all group"
          >
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[22px]">notifications_active</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Kirim Notifikasi Warga</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Broadcast push notifikasi</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, icon, tone, loading }) {
  const toneClasses = {
    blue: {
      bg: 'bg-blue-50/70',
      border: 'border-blue-100',
      text: 'text-blue-600',
    },
    amber: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-100',
      text: 'text-amber-600',
    },
    indigo: {
      bg: 'bg-sky-50/70',
      border: 'border-sky-100',
      text: 'text-sky-600',
    },
    green: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-100',
      text: 'text-emerald-600',
    },
  };

  const currentTone = toneClasses[tone] || toneClasses.blue;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500 tracking-wide">{label}</span>
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${currentTone.bg} ${currentTone.border} ${currentTone.text}`}>
          <span className="material-symbols-outlined text-[21px]">{icon}</span>
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-md"></div>
        ) : (
          <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        )}
        <p className="text-[11px] font-medium text-slate-400 mt-1">{subtext}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = status || 'pending';
  const styles = {
    pending: 'bg-amber-50 text-amber-700 border border-amber-200',
    proses: 'bg-blue-50 text-blue-700 border border-blue-200',
    selesai: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    ditolak: 'bg-rose-50 text-rose-700 border border-rose-200',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${styles[normalized] || styles.pending}`}>
      {normalized}
    </span>
  );
}
