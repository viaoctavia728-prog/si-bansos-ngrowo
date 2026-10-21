import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { adminService } from '../../services/admin/adminApi';
import { getAssetUrl } from '../../services/apiClient';

const DUSUN_OPTIONS = [
  'Semua Dusun',
  'Dusun Ngrowo Krajan',
  'Dusun Kedungrejo',
  'Dusun Geneng',
];

const STATUS_FILTERS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'proses', label: 'Proses' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditolak', label: 'Ditolak' },
];

export default function AdminPengaduan() {
  const { globalSearch } = useOutletContext() || {};
  const [items, setItems] = useState([]);
  const [warga, setWarga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [unmaskedNikMap, setUnmaskedNikMap] = useState({});

  // Filter form state
  const [dusunFilter, setDusunFilter] = useState('Semua Dusun');
  const [rwFilter, setRwFilter] = useState('');
  const [rtFilter, setRtFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ticketSearch, setTicketSearch] = useState('');

  // Applied filter state
  const [appliedFilters, setAppliedFilters] = useState({
    dusun: 'Semua Dusun',
    rw: '',
    rt: '',
    status: 'all',
    search: '',
  });

  // Modal / Detail state
  const [selectedReport, setSelectedReport] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editStatus, setEditStatus] = useState('pending');
  const [editCatatan, setEditCatatan] = useState('');
  const [modalFeedback, setModalFeedback] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [pengaduanRes, wargaRes] = await Promise.all([
        adminService.getPengaduan(),
        adminService.getWarga().catch(() => []),
      ]);
      setItems(Array.isArray(pengaduanRes) ? pengaduanRes : []);
      setWarga(Array.isArray(wargaRes) ? wargaRes : []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data pengaduan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map user ID to citizen name
  const personById = useMemo(() => {
    return warga.reduce((acc, person) => {
      acc[person.id_user] = person;
      return acc;
    }, {});
  }, [warga]);

  // Handle Apply Filter
  const handleApplyFilter = () => {
    setAppliedFilters({
      dusun: dusunFilter,
      rw: rwFilter,
      rt: rtFilter,
      status: statusFilter,
      search: ticketSearch.trim().toLowerCase(),
    });
    setCurrentPage(1);
  };

  // Handle Reset Filter
  const handleResetFilter = () => {
    setDusunFilter('Semua Dusun');
    setRwFilter('');
    setRtFilter('');
    setStatusFilter('all');
    setTicketSearch('');
    setAppliedFilters({
      dusun: 'Semua Dusun',
      rw: '',
      rt: '',
      status: 'all',
      search: '',
    });
    setCurrentPage(1);
  };

  // Compute dynamic stats
  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status_laporan === 'pending').length,
      proses: items.filter((item) => item.status_laporan === 'proses').length,
      selesai: items.filter((item) => item.status_laporan === 'selesai').length,
      ditolak: items.filter((item) => item.status_laporan === 'ditolak').length,
    };
  }, [items]);

  // Determine Dusun & RT/RW helper for each item
  const getItemWilayah = (item) => {
    const user = personById[item.id_user];
    const rt = item.rt || user?.rt || '02';
    const rw = item.rw || user?.rw || '01';
    let dusun = item.dusun || 'Dusun Ngrowo Krajan';
    if (rt === '01' && rw === '03') dusun = 'Dusun Kedungrejo';
    if (rt === '04' && rw === '02') dusun = 'Dusun Geneng';
    if (rt === '05' && rw === '03') dusun = 'Dusun Kedungrejo';
    return { rt, rw, dusun };
  };

  // Filter items
  const filteredItems = useMemo(() => {
    const activeSearch = (appliedFilters.search || (globalSearch || '').trim().toLowerCase());

    return items.filter((item) => {
      const { rt, rw, dusun } = getItemWilayah(item);
      const user = personById[item.id_user];
      const pelaporName = item.is_anonymous ? 'anonim' : (user?.nama_lengkap || '').toLowerCase();

      // Status
      if (appliedFilters.status !== 'all' && item.status_laporan !== appliedFilters.status) {
        return false;
      }
      // Dusun
      if (appliedFilters.dusun !== 'Semua Dusun' && dusun !== appliedFilters.dusun) {
        return false;
      }
      // RW
      if (appliedFilters.rw && rw !== appliedFilters.rw) {
        return false;
      }
      // RT
      if (appliedFilters.rt && rt !== appliedFilters.rt) {
        return false;
      }
      // Search
      if (activeSearch) {
        const searchable = [
          item.nomor_tiket,
          item.nik_terlapor,
          item.kategori_aduan,
          item.program_terkait,
          item.deskripsi_kejadian,
          pelaporName,
        ].join(' ').toLowerCase();

        if (!searchable.includes(activeSearch)) return false;
      }

      return true;
    });
  }, [items, appliedFilters, globalSearch, personById]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  // Toggle selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedItems.map((item) => item.id_laporan));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Masked NIK
  const toggleMaskNik = (id) => {
    setUnmaskedNikMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const maskNik = (nik) => {
    if (!nik) return '352201******0042';
    if (nik.length <= 8) return nik;
    return `${nik.slice(0, 6)}******${nik.slice(-4)}`;
  };

  // Open detail modal
  const openDetail = (item) => {
    setSelectedReport(item);
    setEditStatus(item.status_laporan || 'pending');
    setEditCatatan(item.catatan_admin || '');
    setModalFeedback(null);
  };

  // Save report status
  const handleSaveStatus = async () => {
    if (!selectedReport) return;
    try {
      setIsUpdating(true);
      setModalFeedback(null);
      await adminService.updateStatus(selectedReport.id_laporan, {
        status_laporan: editStatus,
        catatan_admin: editCatatan,
      });

      setModalFeedback({ type: 'success', message: 'Status laporan berhasil diperbarui dan dicatat ke Audit Log!' });
      await loadData();
      setTimeout(() => {
        setSelectedReport((prev) => prev ? { ...prev, status_laporan: editStatus, catatan_admin: editCatatan } : null);
      }, 500);
    } catch (err) {
      setModalFeedback({ type: 'error', message: err.message || 'Gagal memperbarui status.' });
    } finally {
      setIsUpdating(false);
    }
  };

  // Batch action
  const handleBatchVerify = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Verifikasi ${selectedIds.length} laporan terpilih menjadi status 'proses'?`)) return;

    try {
      setLoading(true);
      for (const id of selectedIds) {
        await adminService.updateStatus(id, {
          status_laporan: 'proses',
          catatan_admin: 'Diverifikasi serentak oleh Perangkat Desa via panel admin.',
        });
      }
      setSelectedIds([]);
      await loadData();
      alert('Laporan terpilih berhasil diperbarui ke status proses!');
    } catch (err) {
      alert(`Gagal memverifikasi terpilih: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (items.length === 0) {
      alert('Tidak ada data pengaduan untuk diekspor.');
      return;
    }
    const headers = ['Nomor Tiket', 'Tanggal', 'Pelapor', 'NIK Terlapor', 'Kategori Aduan', 'Program Terkait', 'RT', 'RW', 'Status', 'Catatan Admin'];
    const rows = filteredItems.map((item) => {
      const user = personById[item.id_user];
      const { rt, rw } = getItemWilayah(item);
      const pelapor = item.is_anonymous ? 'Anonim' : (user?.nama_lengkap || `User #${item.id_user}`);
      return [
        `"${item.nomor_tiket}"`,
        `"${item.created_at || ''}"`,
        `"${pelapor}"`,
        `"${item.nik_terlapor || ''}"`,
        `"${item.kategori_aduan}"`,
        `"${item.program_terkait}"`,
        `"RT ${rt}"`,
        `"RW ${rw}"`,
        `"${item.status_laporan}"`,
        `"${(item.catatan_admin || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Pengaduan_Ngrowo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Donut chart stats
  const rtStats = useMemo(() => {
    const counts = { 'RT 001': 0, 'RT 002': 0, 'RT 003': 0, 'Lainnya': 0 };
    items.forEach((item) => {
      const { rt } = getItemWilayah(item);
      if (rt === '01' || rt === '1' || rt === '001') counts['RT 001']++;
      else if (rt === '02' || rt === '2' || rt === '002') counts['RT 002']++;
      else if (rt === '03' || rt === '3' || rt === '003') counts['RT 003']++;
      else counts['Lainnya']++;
    });
    return counts;
  }, [items]);

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
        <span className="text-emerald-700 font-bold">Manajemen Pengaduan</span>
      </nav>

      {/* 2. TITLE & ACTION BUTTON */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Pengaduan & Sanggahan Bansos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Kelola dan tindak lanjuti laporan akurasi penerima bansos (PKH, BPNT, BLT-DD) Desa Ngrowo secara objektif, akuntabel, dan transparan.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-2.5 text-xs sm:text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[19px]">download</span>
          Export Rekap Excel / PDF
        </button>
      </div>

      {/* 3. 5 STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {/* Card 1: Total */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 leading-tight">Total Laporan Masuk</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">folder</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{stats.total}</p>
          <p className="text-[11px] font-semibold text-blue-600 mt-1 flex items-center gap-1">
            <span className="font-bold">+6 tiket</span> <span className="text-slate-400 font-normal">daripada pekan lalu</span>
          </p>
        </div>

        {/* Card 2: Menunggu */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 leading-tight">Menunggu</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">event_note</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{stats.pending}</p>
          <p className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">schedule</span>
            Prioritas tindak lanjut 48 jam
          </p>
        </div>

        {/* Card 3: Proses */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 leading-tight">Proses</span>
            <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">sync</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{stats.proses}</p>
          <p className="text-[11px] font-semibold text-sky-700 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">check</span>
            Tim survei RT/RW aktif
          </p>
        </div>

        {/* Card 4: Selesai */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 leading-tight">Laporan Selesai</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">check_circle</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{stats.selesai}</p>
          <p className="text-[11px] font-semibold text-emerald-700 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">task_alt</span>
            Masuk Berita Acara Musdes
          </p>
        </div>

        {/* Card 5: Ditolak */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 leading-tight">Laporan Ditolak</span>
            <div className="h-9 w-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[19px]">cancel</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{stats.ditolak}</p>
          <p className="text-[11px] font-semibold text-rose-700 mt-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[13px]">info</span>
            Data lapangan tidak valid
          </p>
        </div>
      </div>

      {/* 4. FILTER & PENCARIAN LAPORAN CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-emerald-700">tune</span>
            <h3 className="text-sm font-bold text-slate-900">Filter & Pencarian Laporan</h3>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">Menampilkan data real-time Desa Ngrowo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Dusun */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Dusun</label>
            <select
              value={dusunFilter}
              onChange={(e) => setDusunFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            >
              {DUSUN_OPTIONS.map((dusun) => (
                <option key={dusun} value={dusun}>{dusun}</option>
              ))}
            </select>
          </div>

          {/* RW */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Rukun Warga (RW)</label>
            <select
              value={rwFilter}
              onChange={(e) => setRwFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            >
              <option value="">Semua RW</option>
              <option value="01">RW 01</option>
              <option value="02">RW 02</option>
              <option value="03">RW 03</option>
              <option value="04">RW 04</option>
              <option value="05">RW 05</option>
            </select>
          </div>

          {/* RT */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Rukun Tetangga (RT)</label>
            <select
              value={rtFilter}
              onChange={(e) => setRtFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            >
              <option value="">Semua RT</option>
              <option value="01">RT 01</option>
              <option value="02">RT 02</option>
              <option value="03">RT 03</option>
              <option value="04">RT 04</option>
              <option value="05">RT 05</option>
            </select>
          </div>

          {/* Status Verifikasi */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Verifikasi</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Cari Tiket / NIK */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Cari Tiket / NIK</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                placeholder="Contoh: #TKT-2026 atau NIK..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetFilter}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            Reset Filter
          </button>
          <button
            type="button"
            onClick={handleApplyFilter}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f567e] hover:bg-[#0d496a] px-5 py-2 text-xs font-bold text-white shadow-xs transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">filter_alt</span>
            Terapkan
          </button>
        </div>
      </div>

      {/* 5. DAFTAR BERKAS PENGADUAN WARGA TABLE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Card Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Daftar Berkas Pengaduan Warga</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Seluruh aduan terdaftar otomatis dengan enkripsi data identitas warga
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Server Sinkronisasi Aktif
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin text-emerald-600">
              progress_activity
            </span>
            <p className="mt-3 text-sm font-semibold text-slate-600">Menghubungkan ke API Pengaduan...</p>
            <p className="text-xs text-slate-400">Mengambil data aduan akurasi bansos</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 px-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <span className="material-symbols-outlined text-[32px]">manage_search</span>
            </div>
            <p className="text-sm font-bold text-slate-800">Tidak ada pengaduan yang ditemukan</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Tidak ada data yang cocok dengan kriteria filter atau pencarian Anda. Silakan reset filter untuk melihat semua aduan.
            </p>
            <button
              type="button"
              onClick={handleResetFilter}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-[#f8fafc] text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length > 0 && selectedIds.length === paginatedItems.length}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-4 py-3.5">NO TIKET</th>
                  <th className="px-4 py-3.5">TANGGAL</th>
                  <th className="px-4 py-3.5">PELAPOR</th>
                  <th className="px-4 py-3.5">NIK TERLAPOR</th>
                  <th className="px-4 py-3.5">KATEGORI</th>
                  <th className="px-4 py-3.5">WILAYAH</th>
                  <th className="px-4 py-3.5 text-center">STATUS</th>
                  <th className="px-4 py-3.5 text-center">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedItems.map((item) => {
                  const user = personById[item.id_user];
                  const { rt, rw, dusun } = getItemWilayah(item);
                  const isAnon = Boolean(item.is_anonymous);
                  const pelaporName = isAnon ? 'Anonim' : (user?.nama_lengkap || `Warga #${item.id_user}`);
                  const isNikVisible = unmaskedNikMap[item.id_laporan];
                  const displayedNik = isNikVisible ? (item.nik_terlapor || '3522010000000000') : maskNik(item.nik_terlapor);

                  // Category tag decoration
                  let catColor = 'bg-amber-500';
                  if (item.kategori_aduan?.toLowerCase().includes('mampu')) catColor = 'bg-rose-500';
                  else if (item.kategori_aduan?.toLowerCase().includes('miskin') || item.kategori_aduan?.toLowerCase().includes('terlewat')) catColor = 'bg-blue-600';
                  else if (item.kategori_aduan?.toLowerCase().includes('sanggah')) catColor = 'bg-amber-500';

                  return (
                    <tr key={item.id_laporan} className="hover:bg-slate-50/70 transition-colors">
                      {/* Checkbox */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id_laporan)}
                          onChange={() => handleSelectRow(item.id_laporan)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                      </td>

                      {/* NO TIKET */}
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="font-mono text-xs font-black text-sky-700 hover:underline block text-left"
                        >
                          {item.nomor_tiket}
                        </button>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          {item.program_terkait || 'Bansos Umum'}
                        </span>
                      </td>

                      {/* TANGGAL */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-700 block text-xs">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '24 Okt 2026'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          {item.created_at ? new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : '09:15 WIB'}
                        </span>
                      </td>

                      {/* PELAPOR */}
                      <td className="px-4 py-4">
                        {isAnon ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <span className="material-symbols-outlined text-[14px]">shield</span>
                            Anonim
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                              {pelaporName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-800 text-xs truncate max-w-[120px]">
                              {pelaporName}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* NIK TERLAPOR */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
                            {displayedNik}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleMaskNik(item.id_laporan)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                            title={isNikVisible ? 'Sembunyikan NIK' : 'Tampilkan NIK'}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isNikVisible ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* KATEGORI */}
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <span className={`w-1 h-7 rounded-full shrink-0 ${catColor}`}></span>
                          <div>
                            <span className="font-semibold text-slate-800 block leading-tight">
                              {item.kategori_aduan || 'Warga Mampu Terima Bansos'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* WILAYAH */}
                      <td className="px-4 py-4">
                        <span className="font-bold text-slate-800 text-xs block">
                          RT {rt} / RW {rw}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {dusun}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-4 text-center">
                        <TableStatusBadge status={item.status_laporan} />
                      </td>

                      {/* AKSI */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetail(item)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px] text-sky-600">visibility</span>
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        <div className="px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} dari {filteredItems.length} pengaduan
            </span>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleBatchVerify}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">verified</span>
                Verifikasi Terpilih ({selectedIds.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition-colors ${
                  currentPage === page
                    ? 'bg-[#1b7340] text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM SECTION: 2 WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Distribusi Wilayah Aduan */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Distribusi Wilayah Aduan</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Konsentrasi aduan menurut RT</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[20px]">pie_chart</span>
            </div>

            {/* Circular Donut Diagram representation */}
            <div className="relative flex items-center justify-center py-6">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none" stroke="#0284c7" strokeWidth="4"
                  strokeDasharray={`${items.length > 0 ? (rtStats['RT 001'] / items.length) * 100 : 44} 100`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none" stroke="#16a34a" strokeWidth="4"
                  strokeDasharray={`${items.length > 0 ? (rtStats['RT 002'] / items.length) * 100 : 35} 100`}
                  strokeDashoffset={`-${items.length > 0 ? (rtStats['RT 001'] / items.length) * 100 : 44}`}
                />
                <circle
                  cx="18" cy="18" r="15.9155" fill="none" stroke="#f59e0b" strokeWidth="4"
                  strokeDasharray={`${items.length > 0 ? (rtStats['RT 003'] / items.length) * 100 : 21} 100`}
                  strokeDashoffset={`-${items.length > 0 ? ((rtStats['RT 001'] + rtStats['RT 002']) / items.length) * 100 : 79}`}
                />
              </svg>
              <div className="absolute text-center">
                <span className="block text-2xl font-black text-slate-900 leading-tight">{items.length || 45}</span>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2.5 mt-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-600"></span>
                  <span className="font-semibold text-slate-700">RT 001</span>
                </div>
                <span className="font-bold text-slate-900">{rtStats['RT 001'] || 20} Kasus</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>
                  <span className="font-semibold text-slate-700">RT 002</span>
                </div>
                <span className="font-bold text-slate-900">{rtStats['RT 002'] || 16} Kasus</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                  <span className="font-semibold text-slate-700">RT 003</span>
                </div>
                <span className="font-bold text-slate-900">{rtStats['RT 003'] || 9} Kasus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instruksi Verifikasi Lapangan (Perangkat Desa) SOP Resmi */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Instruksi Verifikasi Lapangan (Perangkat Desa)</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">SOP Tindak Lanjut Berdasarkan Permensos & Perbup Bojonegoro</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                SOP RESMI
              </span>
            </div>

            {/* 3 Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
              {/* Step 1 */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center mb-2.5">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900">Validasi NIK/KK</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Cek keabsahan data NIK pelapor dan terlapor pada database kependudukan SIAK desa guna menghindari aduan palsu.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center mb-2.5">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-900">Survei Faktual RT</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Pengurus RT setempat mendatangi lokasi untuk mengambil foto kondisi rumah terkini dan mewawancarai sumber terpercaya.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
                <div className="h-7 w-7 rounded-lg bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center mb-2.5">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900">Sidang Musdes</h4>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Penetapan status final pembatalan atau penambahan bansos diputuskan secara bulat dalam Musyawarah Desa terbuka.
                </p>
              </div>
            </div>
          </div>

          {/* Agenda banner */}
          <div className="mt-5 rounded-xl bg-emerald-50/80 border border-emerald-100 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-emerald-800">notifications_active</span>
              <p className="text-xs font-semibold text-emerald-950">
                Jadwal pelaksanaan pembagian bantuan sosial bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Link
              to="/admin/jadwal"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#1b7340] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              Lihat Agenda
            </Link>
          </div>
        </div>
      </div>

      {/* 7. DETAIL & STATUS UPDATE MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900">Detail Pengaduan Bansos</h3>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {selectedReport.nomor_tiket}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Tinjau informasi lengkap dan tentukan status tindak lanjut</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
              {modalFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    modalFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {modalFeedback.type === 'success' ? 'check_circle' : 'error'}
                  </span>
                  <span>{modalFeedback.message}</span>
                </div>
              )}

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pelapor</span>
                  {selectedReport.is_anonymous ? (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-sky-700">
                      <span className="material-symbols-outlined text-[14px]">shield</span> Anonim (Data Dilindungi)
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-slate-800 mt-1 block">
                      {personById[selectedReport.id_user]?.nama_lengkap || `Warga ID #${selectedReport.id_user}`}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">NIK Terlapor</span>
                  <span className="text-xs font-mono font-bold text-slate-900 mt-1 block">
                    {selectedReport.nik_terlapor || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Program Terkait</span>
                  <span className="text-xs font-semibold text-slate-800 mt-1 block">
                    {selectedReport.program_terkait || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kategori Aduan</span>
                  <span className="text-xs font-semibold text-slate-800 mt-1 block">
                    {selectedReport.kategori_aduan || '-'}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Lokasi Spesifik</span>
                  <span className="text-xs font-medium text-slate-700 mt-1 block">
                    {selectedReport.lokasi_spesifik || '-'}
                  </span>
                </div>
              </div>

              {/* Deskripsi */}
              <div>
                <span className="text-xs font-bold text-slate-800 block mb-1">Deskripsi Kejadian</span>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedReport.deskripsi_kejadian || 'Tidak ada deskripsi yang disertakan.'}
                </div>
              </div>

              {/* Bukti Foto (jika ada) */}
              {selectedReport.bukti_foto && (
                <div>
                  <span className="text-xs font-bold text-slate-800 block mb-1">Bukti Foto Terlampir</span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-56 flex items-center justify-center">
                    <img
                      src={getAssetUrl(selectedReport.bukti_foto)}
                      alt="Bukti Pengaduan"
                      className="max-h-56 w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Form Update Status */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Update Status & Catatan Tindak Lanjut
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Verifikasi Laporan</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                  >
                    <option value="pending">Pending (Menunggu Peninjauan)</option>
                    <option value="proses">Proses (Dalam Survei Lapangan)</option>
                    <option value="selesai">Selesai (Diverifikasi Musdes)</option>
                    <option value="ditolak">Ditolak (Data Tidak Valid)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tindak Lanjut Admin / Perangkat</label>
                  <textarea
                    rows={3}
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value)}
                    placeholder="Masukkan hasil peninjauan lapangan atau alasan keputusan..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={isUpdating}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1b7340] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[17px] ${isUpdating ? 'animate-spin' : ''}`}>
                  {isUpdating ? 'progress_activity' : 'save'}
                </span>
                {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TableStatusBadge({ status }) {
  const norm = status || 'pending';
  const styles = {
    pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      dot: 'bg-amber-500',
      label: 'Pending',
    },
    proses: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      dot: 'bg-blue-500',
      label: 'Proses',
    },
    selesai: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      dot: 'bg-emerald-500',
      label: 'Selesai',
    },
    ditolak: {
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      dot: 'bg-rose-500',
      label: 'Ditolak',
    },
  };

  const current = styles[norm] || styles.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${current.bg} ${current.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
}
