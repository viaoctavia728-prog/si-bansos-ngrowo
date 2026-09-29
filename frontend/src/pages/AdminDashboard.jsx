import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, authService } from '../services/api';

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
  const [activeView, setActiveView] = useState('reports');
  const [warga, setWarga] = useState([]);
  const [wargaLoading, setWargaLoading] = useState(false);
  const [wargaError, setWargaError] = useState('');
  const [wargaSearch, setWargaSearch] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      navigate('/login', { replace: true });
      return;
    }
    setCurrentUser(user);
    loadData();
    loadWarga();
  }, [navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getPengaduan();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Gagal memuat data laporan.');
    } finally {
      setLoading(false);
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

  const handleStatusChange = async (idLaporan, status_laporan, catatan_admin = '') => {
    try {
      setSavingId(idLaporan);
      setError('');
      await adminService.updateStatus(idLaporan, {
        status_laporan,
        catatan_admin: catatan_admin || undefined,
      });
      await loadData();
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
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-emerald-900 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Admin Panel</p>
            <h1 className="text-2xl font-bold">SI-BANSOS NGROWO</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-emerald-200">Login sebagai</p>
              <p className="font-semibold">{currentUser?.nama_lengkap || 'Administrator'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-emerald-300 bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Laporan" value={stats.total} tone="slate" />
          <StatCard label="Pending" value={stats.pending} tone="amber" />
          <StatCard label="Proses" value={stats.proses} tone="blue" />
          <StatCard label="Selesai" value={stats.selesai} tone="green" />
        </div>

        <div role="tablist" aria-label="Data admin" className="mb-4 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'reports'}
            onClick={() => setActiveView('reports')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeView === 'reports' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Pengaduan <span className="ml-1 text-xs">{items.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeView === 'warga'}
            onClick={() => setActiveView('warga')}
            className={`border-b-2 px-4 py-3 text-sm font-semibold ${activeView === 'warga' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            Warga Terdaftar <span className="ml-1 text-xs">{warga.length}</span>
          </button>
        </div>

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
              <button
                onClick={loadData}
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
                        <button
                          onClick={() => handleStatusChange(item.id_laporan, item.status_laporan || 'pending', item.catatan_admin || '')}
                          disabled={savingId === item.id_laporan}
                          className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60 hover:bg-emerald-700"
                        >
                          {savingId === item.id_laporan ? 'Menyimpan...' : 'Simpan'}
                        </button>
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
      </main>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneMap = {
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <div className={`rounded-2xl border border-slate-200 p-4 ${toneMap[tone] || toneMap.slate}`}>
      <p className="text-xs uppercase tracking-[0.16em] font-semibold opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}
