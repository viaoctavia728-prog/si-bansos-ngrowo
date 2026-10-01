import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, authService } from '../services/api';
import logoNgrowo from '../images/logo ngrowo.png';

const STATUS_OPTIONS = ['pending', 'proses', 'selesai', 'ditolak'];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rtFilter, setRtFilter] = useState('');
  const [rwFilter, setRwFilter] = useState('');
  const [detailsId, setDetailsId] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [warga, setWarga] = useState([]);
  const [wargaLoading, setWargaLoading] = useState(false);
  const [wargaError, setWargaError] = useState('');
  const [wargaSearch, setWargaSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditError, setAuditError] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [notificationForm, setNotificationForm] = useState({ title: '', body: '' });
  const [notificationSending, setNotificationSending] = useState(false);
  const [notificationFeedback, setNotificationFeedback] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/login', { replace: true });
      return;
    }
    setCurrentUser(user);
    loadData();
    loadWarga();
    loadAuditLogs();
  }, [navigate]);

  const loadData = async (filters = { rt: rtFilter || undefined, rw: rwFilter || undefined }) => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getPengaduan(filters);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data laporan.');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setAuditLoading(true);
      setAuditError('');
      setAuditLogs(await adminService.getAuditLogs());
    } catch (err) {
      setAuditError(err.message || 'Gagal memuat audit aktivitas admin.');
    } finally {
      setAuditLoading(false);
    }
  };

  const handleNotificationSubmit = async (event) => {
    event.preventDefault();
    try {
      setNotificationSending(true);
      setNotificationFeedback('');
      const result = await adminService.sendNotification(notificationForm);
      setNotificationFeedback(result.status === 'no_devices'
        ? 'Belum ada perangkat warga yang mengaktifkan notifikasi.'
        : `Notifikasi terkirim ke ${result.sent} perangkat; ${result.failed} gagal.`);
      if (result.status === 'sent') await loadAuditLogs();
    } catch (err) {
      setNotificationFeedback(err.message || 'Notifikasi gagal dikirim. Periksa konfigurasi Firebase server.');
    } finally {
      setNotificationSending(false);
    }
  };

  const loadWarga = async () => {
    try {
      setWargaLoading(true);
      setWargaError('');
      const data = await adminService.getWarga();
      setWarga(Array.isArray(data) ? data : []);
    } catch (err) {
      setWargaError(err.message || 'Gagal memuat daftar warga terdaftar.');
    } finally {
      setWargaLoading(false);
    }
  };

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status_laporan === 'pending').length,
      proses: items.filter((item) => item.status_laporan === 'proses').length,
      selesai: items.filter((item) => item.status_laporan === 'selesai').length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status_laporan === statusFilter;
      const searchableText = [
        item.nomor_tiket,
        item.kategori_aduan,
        item.nik_terlapor,
        item.id_user,
        item.deskripsi_kejadian,
      ].join(' ').toLowerCase();
      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [items, searchTerm, statusFilter]);

  const filteredWarga = useMemo(() => {
    const query = wargaSearch.trim().toLowerCase();
    return warga.filter((person) => [
      person.nama_lengkap,
      person.nik,
      person.username,
      person.no_hp,
      person.rt,
      person.rw,
    ].join(' ').toLowerCase().includes(query));
  }, [warga, wargaSearch]);

  const rtOptions = [...new Set(warga.map((person) => person.rt).filter(Boolean))].sort();
  const rwOptions = [...new Set(warga.map((person) => person.rw).filter(Boolean))].sort();
  const navigationItems = [
    { key: 'overview', label: 'Ringkasan', icon: 'space_dashboard' },
    { key: 'reports', label: 'Pengaduan', icon: 'assignment' },
    { key: 'warga', label: 'Warga', icon: 'groups' },
    { key: 'audit', label: 'Audit aktivitas', icon: 'history' },
    { key: 'notifications', label: 'Notifikasi', icon: 'notifications' },
  ];
  const activePageTitle = navigationItems.find((item) => item.key === activeView)?.label || 'Ringkasan';

  const handleStatusChange = async (idLaporan, status_laporan, catatan_admin = '') => {
    try {
      setSavingId(idLaporan);
      setError('');
      await adminService.updateStatus(idLaporan, {
        status_laporan,
        catatan_admin,
      });
      await Promise.all([loadData(), loadAuditLogs()]);
    } catch (err) {
      setError(err.message || 'Gagal memperbarui status laporan.');
    } finally {
      setSavingId(null);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f4f7f4] text-slate-800">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-5">
          <img src={logoNgrowo} alt="" className="h-10 w-10 rounded-xl border border-emerald-100 bg-emerald-50 object-contain p-1" />
          <div className="min-w-0"><p className="truncate text-sm font-extrabold text-slate-900">SI-BANSOS</p><p className="text-[11px] font-medium text-slate-500">Panel Kelurahan Ngrowo</p></div>
        </div>
        <div className="px-4 pb-2 pt-5 text-[10px] font-bold uppercase text-slate-400">Ruang kerja admin</div>
        <nav aria-label="Navigasi admin" className="flex flex-col gap-1 px-3">
          {navigationItems.map((item) => (
            <button key={item.key} type="button" onClick={() => setActiveView(item.key)} aria-current={activeView === item.key ? 'page' : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold transition-colors ${activeView === item.key ? 'bg-emerald-50 text-emerald-900' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.key === 'reports' && <span className={`text-xs ${activeView === item.key ? 'text-emerald-700' : 'text-slate-400'}`}>{items.length}</span>}
              {item.key === 'warga' && <span className={`text-xs ${activeView === item.key ? 'text-emerald-700' : 'text-slate-400'}`}>{warga.length}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white">AD</div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{currentUser?.nama_lengkap || 'Administrator'}</p><p className="text-[10px] text-slate-500">Administrator</p></div>
          </div>
          <button type="button" onClick={handleLogout} className="mt-3 flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700"><span className="material-symbols-outlined text-[17px]">logout</span>Keluar dari panel</button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <img src={logoNgrowo} alt="" className="h-9 w-9 rounded-lg border border-emerald-100 bg-emerald-50 object-contain p-1 lg:hidden" />
              <div className="min-w-0"><p className="text-[10px] font-bold uppercase text-emerald-800">Panel Admin / {activePageTitle}</p><h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">{activePageTitle}</h1></div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <span className="hidden text-right sm:block"><span className="block text-xs font-semibold text-slate-800">{currentUser?.nama_lengkap || 'Administrator'}</span><span className="block text-[10px] text-slate-500">Administrator</span></span>
              <button type="button" onClick={handleLogout} aria-label="Keluar" title="Keluar" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700 lg:hidden"><span className="material-symbols-outlined text-[19px]">logout</span></button>
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white sm:flex">AD</div>
            </div>
          </div>
          <nav aria-label="Navigasi admin" className="grid grid-cols-5 border-t border-slate-100 lg:hidden">
            {navigationItems.map((item) => (
              <button key={item.key} type="button" onClick={() => setActiveView(item.key)} aria-current={activeView === item.key ? 'page' : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[9px] font-semibold ${activeView === item.key ? 'text-emerald-900' : 'text-slate-500'}`}>
                <span className="material-symbols-outlined text-[19px]">{item.icon}</span><span className="truncate">{item.label}</span>
              </button>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-xs text-slate-500">Kelola layanan dan data warga dari satu tempat.</p><p className="mt-1 text-[11px] text-slate-400">Kelurahan Ngrowo · {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p></div>
            {activeView !== 'notifications' && <button type="button" onClick={() => { loadData(); loadWarga(); loadAuditLogs(); }} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><span className="material-symbols-outlined text-[17px]">refresh</span>Segarkan data</button>}
          </div>

          {activeView === 'overview' && (
            <div className="space-y-4">
              <section aria-label="Statistik laporan" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard label="Total laporan" value={stats.total} tone="slate" icon="inbox" />
                <StatCard label="Perlu ditinjau" value={stats.pending} tone="amber" icon="pending_actions" />
                <StatCard label="Sedang diproses" value={stats.proses} tone="blue" icon="autorenew" />
                <StatCard label="Selesai" value={stats.selesai} tone="green" icon="task_alt" />
              </section>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <div><h2 className="text-sm font-bold text-slate-900">Tindak lanjut pengaduan</h2><p className="mt-1 text-xs text-slate-500">Ringkasan status dari semua laporan yang dimuat.</p></div>
                    <button type="button" onClick={() => setActiveView('reports')} className="text-xs font-semibold text-emerald-800 hover:underline">Buka daftar</button>
                  </div>
                  <div className="divide-y divide-slate-100 px-4">
                    {[
                      { label: 'Menunggu tinjauan', value: stats.pending, color: 'bg-amber-500', text: 'text-amber-800' },
                      { label: 'Sedang diproses', value: stats.proses, color: 'bg-sky-600', text: 'text-sky-800' },
                      { label: 'Selesai', value: stats.selesai, color: 'bg-emerald-600', text: 'text-emerald-800' },
                    ].map((row) => (
                      <div key={row.label} className="py-4">
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="font-medium text-slate-600">{row.label}</span><span className={`font-bold ${row.text}`}>{row.value} laporan</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${row.color}`} style={{ width: `${stats.total ? Math.min((row.value / stats.total) * 100, 100) : 0}%` }} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500">Warga terdaftar <strong className="ml-1 text-slate-800">{warga.length}</strong></div>
                </section>

                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                    <div><h2 className="text-sm font-bold text-slate-900">Laporan terbaru</h2><p className="mt-1 text-xs text-slate-500">Pengaduan terakhir masuk ke sistem.</p></div>
                    <button type="button" onClick={() => setActiveView('reports')} aria-label="Buka semua pengaduan" className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-800 hover:bg-emerald-50"><span className="material-symbols-outlined">arrow_forward</span></button>
                  </div>
                  {loading ? <p className="p-4 text-xs text-slate-500">Memuat laporan...</p> : items.length === 0 ? (
                    <div className="p-6 text-center"><span className="material-symbols-outlined text-3xl text-slate-300">inbox</span><p className="mt-2 text-xs font-semibold text-slate-700">Belum ada pengaduan</p><p className="mt-1 text-[11px] text-slate-500">Laporan warga akan tampil di sini.</p></div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {items.slice(0, 5).map((item) => <button type="button" key={item.id_laporan} onClick={() => { setDetailsId(item.id_laporan); setActiveView('reports'); }} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800"><span className="material-symbols-outlined text-[19px]">description</span></span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800">{item.kategori_aduan || 'Pengaduan warga'}</span><span className="mt-1 block font-mono text-[10px] text-slate-500">{item.nomor_tiket}</span></span>
                        <StatusBadge status={item.status_laporan} />
                      </button>)}
                    </div>
                  )}
                </section>
              </div>

              <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-100 px-4 py-4"><h2 className="text-sm font-bold text-slate-900">Akses cepat</h2><p className="mt-1 text-xs text-slate-500">Buka pekerjaan admin yang sering digunakan.</p></div>
                <div className="grid divide-y divide-slate-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  {[
                    { key: 'warga', icon: 'groups', title: 'Data warga', detail: `${warga.length} akun terdaftar` },
                    { key: 'audit', icon: 'history', title: 'Audit aktivitas', detail: `${auditLogs.length} aktivitas tercatat` },
                    { key: 'notifications', icon: 'notifications_active', title: 'Kirim informasi', detail: 'Broadcast ke perangkat warga' },
                  ].map((item) => <button key={item.key} type="button" onClick={() => setActiveView(item.key)} className="flex min-h-[76px] items-center gap-3 px-4 text-left hover:bg-emerald-50/40"><span className="material-symbols-outlined flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-emerald-800">{item.icon}</span><span><span className="block text-xs font-bold text-slate-800">{item.title}</span><span className="mt-1 block text-[10px] text-slate-500">{item.detail}</span></span></button>)}
                </div>
              </section>
            </div>
          )}

        {activeView === 'reports' && error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {activeView === 'reports' && <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-4 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Daftar Pengaduan</h2>
              <p className="mt-0.5 text-xs text-slate-500">Menampilkan {filteredItems.length} dari {items.length} laporan</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="relative min-w-0 sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[19px]">search</span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Cari tiket, kategori, atau NIK"
                  aria-label="Cari laporan"
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <label>
                <span className="sr-only">Filter status laporan</span>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:w-40"
                >
                  <option value="all">Semua status</option>
                  {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Filter RT</span>
                <select value={rtFilter} onChange={(event) => { setRtFilter(event.target.value); loadData({ rt: event.target.value || undefined, rw: rwFilter || undefined }); }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm sm:w-28">
                  <option value="">Semua RT</option>
                  {rtOptions.map((rt) => <option key={rt} value={rt}>RT {rt}</option>)}
                </select>
              </label>
              <label>
                <span className="sr-only">Filter RW</span>
                <select value={rwFilter} onChange={(event) => { setRwFilter(event.target.value); loadData({ rt: rtFilter || undefined, rw: event.target.value || undefined }); }} className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm sm:w-28">
                  <option value="">Semua RW</option>
                  {rwOptions.map((rw) => <option key={rw} value={rw}>RW {rw}</option>)}
                </select>
              </label>
              <button
                onClick={() => loadData({ rt: rtFilter || undefined, rw: rwFilter || undefined })}
                disabled={loading}
                className="h-10 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
              >
                {loading ? 'Memuat...' : 'Refresh'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-slate-500">Memuat data pengaduan...</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">Belum ada data pengaduan.</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-slate-400 text-[32px]">search_off</span>
              <p className="mt-2 text-sm font-semibold text-slate-700">Tidak ada laporan yang cocok</p>
              <p className="mt-1 text-xs text-slate-500">Ubah kata pencarian atau filter status.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Ticket</th>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 font-semibold">Pelapor</th>
                    <th className="px-4 py-3 font-semibold">Deskripsi</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Catatan</th>
                    <th className="px-4 py-3 font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredItems.map((item) => (
                    <tr key={item.id_laporan} className="align-top">
                      <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-700">{item.nomor_tiket}</td>
                      <td className="px-4 py-3">{item.kategori_aduan || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.nik_terlapor || 'Anonim'}</div>
                        <div className="text-xs text-slate-500">User #{item.id_user || '-'}</div>
                      </td>
                      <td className="px-4 py-3 max-w-md text-slate-600">{item.deskripsi_kejadian || '-'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status_laporan || 'pending'}
                          onChange={(e) => handleStatusChange(item.id_laporan, e.target.value, item.catatan_admin || '')}
                          disabled={savingId === item.id_laporan}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <textarea
                          defaultValue={item.catatan_admin || ''}
                          rows={2}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value !== (item.catatan_admin || '')) {
                              handleStatusChange(item.id_laporan, item.status_laporan || 'pending', value);
                            }
                          }}
                          className="w-52 rounded-lg border border-slate-300 bg-slate-50 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          placeholder="Catatan admin"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailsId(detailsId === item.id_laporan ? null : item.id_laporan)}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                          >
                            {detailsId === item.id_laporan ? 'Tutup detail' : 'Detail'}
                          </button>
                          <button
                            onClick={() => handleStatusChange(item.id_laporan, item.status_laporan || 'pending', item.catatan_admin || '')}
                            disabled={savingId === item.id_laporan}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 hover:bg-emerald-700"
                          >
                            {savingId === item.id_laporan ? 'Menyimpan...' : 'Simpan'}
                          </button>
                          {detailsId === item.id_laporan && (
                            <div className="min-w-48 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                              <p><strong>Program:</strong> {item.program_terkait || '-'}</p>
                              <p className="mt-1"><strong>Lokasi:</strong> {item.lokasi_spesifik || '-'}</p>
                              <p className="mt-1"><strong>Dibuat:</strong> {item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-'}</p>
                              {item.bukti_foto && <a className="mt-2 inline-block font-semibold text-emerald-700 underline" href={item.bukti_foto} target="_blank" rel="noreferrer">Buka bukti</a>}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>}

        {activeView === 'warga' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Warga Terdaftar</h2>
                <p className="mt-0.5 text-xs text-slate-500">Menampilkan {filteredWarga.length} dari {warga.length} akun warga</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  value={wargaSearch}
                  onChange={(event) => setWargaSearch(event.target.value)}
                  placeholder="Cari nama, NIK, username"
                  aria-label="Cari warga terdaftar"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-200 sm:w-72"
                />
                <button
                  type="button"
                  onClick={loadWarga}
                  disabled={wargaLoading}
                  className="h-10 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {wargaLoading ? 'Memuat...' : 'Refresh'}
                </button>
              </div>
            </div>

            {wargaError && <div className="m-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{wargaError}</div>}
            {wargaLoading ? (
              <p className="p-6 text-sm text-slate-500">Memuat daftar warga...</p>
            ) : filteredWarga.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">Belum ada warga yang cocok</p>
                <p className="mt-1 text-xs text-slate-500">Warga yang mendaftar akan muncul di daftar ini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nama</th>
                      <th className="px-4 py-3 font-semibold">NIK</th>
                      <th className="px-4 py-3 font-semibold">Username</th>
                      <th className="px-4 py-3 font-semibold">Kontak</th>
                      <th className="px-4 py-3 font-semibold">Wilayah</th>
                      <th className="px-4 py-3 font-semibold">Tanggal Daftar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredWarga.map((person) => (
                      <tr key={person.id_user}>
                        <td className="px-4 py-3 font-medium text-slate-800">{person.nama_lengkap}</td>
                        <td className="px-4 py-3 font-mono text-xs">{person.nik}</td>
                        <td className="px-4 py-3 font-mono text-xs">{person.username || '-'}</td>
                        <td className="px-4 py-3">{person.no_hp || '-'}</td>
                        <td className="px-4 py-3">RT {person.rt || '-'} / RW {person.rw || '-'}</td>
                        <td className="px-4 py-3">{person.created_at ? new Date(person.created_at).toLocaleDateString('id-ID') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeView === 'audit' && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <h2 className="text-lg font-semibold">Audit Aktivitas Admin</h2>
                <p className="mt-0.5 text-xs text-slate-500">Riwayat perubahan penting pada sistem.</p>
              </div>
              <button type="button" onClick={loadAuditLogs} disabled={auditLoading} className="h-10 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                {auditLoading ? 'Memuat...' : 'Refresh'}
              </button>
            </div>
            {auditError && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{auditError}</p>}
            {auditLoading ? <p className="p-6 text-sm text-slate-500">Memuat aktivitas...</p> : auditLogs.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Belum ada aktivitas admin yang tercatat.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600"><tr><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Aktivitas</th></tr></thead>
                  <tbody className="divide-y divide-slate-200">
                    {auditLogs.map((entry) => <tr key={entry.id_log}><td className="whitespace-nowrap px-4 py-3">{entry.timestamp ? new Date(entry.timestamp).toLocaleString('id-ID') : '-'}</td><td className="px-4 py-3">#{entry.id_user || '-'}</td><td className="px-4 py-3">{entry.aktivitas}</td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeView === 'notifications' && (
          <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Kirim Notifikasi Warga</h2>
            <p className="mt-1 text-sm text-slate-600">Pesan dikirim ke perangkat yang telah mengaktifkan notifikasi SI-BANSOS NGROWO.</p>
            <form onSubmit={handleNotificationSubmit} className="mt-5 flex flex-col gap-4">
              <label className="text-sm font-semibold text-slate-700">
                Judul
                <input required maxLength={120} value={notificationForm.title} onChange={(event) => setNotificationForm((form) => ({ ...form, title: event.target.value }))} className="mt-1 h-11 w-full rounded-lg border border-slate-300 px-3 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Isi pesan
                <textarea required maxLength={500} rows={4} value={notificationForm.body} onChange={(event) => setNotificationForm((form) => ({ ...form, body: event.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
              </label>
              {notificationFeedback && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{notificationFeedback}</p>}
              <button type="submit" disabled={notificationSending} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60">
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                {notificationSending ? 'Mengirim...' : 'Kirim ke Warga'}
              </button>
            </form>
          </section>
        )}
      </main>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalizedStatus = status || 'pending';
  const toneMap = {
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    proses: 'bg-sky-50 text-sky-800 ring-sky-200',
    selesai: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    ditolak: 'bg-rose-50 text-rose-800 ring-rose-200',
  };
  return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold capitalize ring-1 ring-inset ${toneMap[normalizedStatus] || toneMap.pending}`}>{normalizedStatus}</span>;
}

function StatCard({ label, value, tone, icon }) {
  const toneMap = {
    slate: 'bg-slate-50 text-slate-700',
    amber: 'bg-amber-50 text-amber-800',
    blue: 'bg-sky-50 text-sky-800',
    green: 'bg-emerald-50 text-emerald-800',
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneMap[tone] || toneMap.slate}`}><span className="material-symbols-outlined text-[18px]">{icon}</span></span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
