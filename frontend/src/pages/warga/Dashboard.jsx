import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WargaSidebar from '../../components/WargaSidebar';
import WargaMain from '../../components/WargaMain';
import { authService } from '../../services/auth';
import { getAssetUrl } from '../../services/apiClient';
import { bansosService, pengaduanService, notificationService } from '../../services/api';
import { enablePushNotifications, isFcmConfigured, listenForPushMessages } from '../../services/firebase';

export default function Dashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [bansosData, setBansosData] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [bansosLoaded, setBansosLoaded] = useState(false);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [pushEnabling, setPushEnabling] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  // In-App Database Notifications state
  const [notifications, setNotifications] = useState([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [latestPopupNotif, setLatestPopupNotif] = useState(null);
  const [notificationError, setNotificationError] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    let active = true;
    const fetchData = async () => {
      setIsLoading(true);
      const results = await Promise.allSettled([
        authService.getProfile(),
        user.nik ? bansosService.cekBansosByNik(user.nik) : Promise.reject(new Error('NIK akun tidak tersedia.')),
        user.id_user ? pengaduanService.getByUser(user.id_user) : Promise.reject(new Error('Identitas akun tidak tersedia.')),
      ]);
      if (!active) return;
      const errors = [];
      const [profileResult, bansosResult, reportsResult] = results;
      if (profileResult.status === 'fulfilled') {
        setCurrentUser(profileResult.value);
        setProfileLoaded(true);
      } else {
        errors.push(profileResult.reason?.message || 'Profil warga gagal dimuat.');
      }
      if (bansosResult.status === 'fulfilled' && Array.isArray(bansosResult.value)) {
        setBansosData(bansosResult.value);
        setBansosLoaded(true);
      } else {
        errors.push(bansosResult.status === 'rejected' ? bansosResult.reason?.message : 'Format data bansos tidak valid.');
      }
      if (reportsResult.status === 'fulfilled' && Array.isArray(reportsResult.value)) {
        setUserReports(reportsResult.value);
        setReportsLoaded(true);
      } else {
        errors.push(reportsResult.status === 'rejected' ? reportsResult.reason?.message : 'Format data pengaduan tidak valid.');
      }
      setDashboardError(errors.filter(Boolean).join(' '));
      setIsLoading(false);
    };

    void fetchData();
    return () => { active = false; };
  }, [navigate]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    const handleProfileUpdate = (event) => {
      if (event?.detail) {
        setCurrentUser(event.detail);
      } else {
        const u = authService.getCurrentUser();
        if (u) setCurrentUser(u);
      }
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribe = () => {};
    listenForPushMessages((notification) => {
      setPushMessage(`${notification.title}${notification.body ? `: ${notification.body}` : ''}`);
    }).then((stopListening) => {
      if (active) unsubscribe = stopListening;
      else stopListening();
    }).catch(() => {});
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // In-App Notification Polling & Fetch
  const fetchNotifications = async () => {
    try {
      const list = await notificationService.getNotifications();
      if (Array.isArray(list)) {
        setNotifications(list);
        setNotificationError('');
        const newUnread = list.find((n) => !n.is_read && !n.read_at);
        setLatestPopupNotif(newUnread || null);
      }
    } catch (error) {
      setNotificationError(error.message || 'Notifikasi belum dapat disinkronkan.');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 8000); // Polling real-time setiap 8 detik
    return () => window.clearInterval(interval);
  }, []);

  const handleDismissPopup = async (idNotification) => {
    await handleMarkAsRead(idNotification);
  };

  const handleMarkAsRead = async (idNotification) => {
    try {
      await notificationService.markAsRead(idNotification);
      setNotificationError('');
      const readAt = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.id_notification === idNotification ? { ...n, is_read: true, read_at: readAt } : n))
      );
      if (latestPopupNotif?.id_notification === idNotification) {
        setLatestPopupNotif(null);
      }
      await fetchNotifications();
      return true;
    } catch (error) {
      setNotificationError(error.message || 'Status baca gagal disimpan. Coba lagi saat koneksi tersedia.');
      return false;
    }
  };

  const handleEnablePush = async () => {
    try {
      setPushEnabling(true);
      setPushMessage('');
      await enablePushNotifications();
      setPushMessage('Notifikasi berhasil diaktifkan pada perangkat ini.');
    } catch (err) {
      setPushMessage(err.message || 'Notifikasi belum dapat diaktifkan.');
    } finally {
      setPushEnabling(false);
    }
  };

  const activeBansos = bansosData.length > 0 ? bansosData[0] : null;

  const hasUserReports = userReports.length > 0;
  const activeReportCount = userReports.filter((report) => report.status_laporan !== 'selesai' && report.status_laporan !== 'ditolak').length;
  const unreadCount = notifications.filter((n) => !n.is_read && !n.read_at).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <WargaSidebar />

      <WargaMain>
      <Header />

      <main className="flex-1 pb-24 lg:pb-10">
        <div className="warga-shell pt-5 sm:pt-7">

          <div className="flex flex-col gap-5 sm:gap-6">
            {/* Pop-up / Banner Pengumuman Real-time dari Admin */}
            {latestPopupNotif && (
              <aside
                role="region"
                aria-label="Pengumuman Penting"
                className="relative animate-slide-up overflow-hidden rounded-xl border border-emerald-600 bg-gradient-to-r from-primary-dark via-primary to-primary-hover p-4 text-white shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 text-amber-300">
                      <span className="material-symbols-outlined text-[24px]">campaign</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-900">
                          Pengumuman Baru
                        </span>
                        <span className="text-[10px] text-emerald-100">
                          {latestPopupNotif.created_at
                            ? new Date(latestPopupNotif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                            : 'Baru Saja'}
                        </span>
                      </div>
                      <h2 className="mt-1 text-sm font-bold leading-snug text-white sm:text-base">{latestPopupNotif.title}</h2>
                      <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs leading-relaxed text-emerald-100/90">{latestPopupNotif.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNotifModalOpen(true);
                            void handleMarkAsRead(latestPopupNotif.id_notification);
                          }}
                          className="gov-btn min-h-9 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-emerald-50"
                        >
                          <span className="material-symbols-outlined text-[15px]">visibility</span>
                          Baca Selengkapnya
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissPopup(latestPopupNotif.id_notification)}
                          className="gov-btn min-h-9 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/20"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismissPopup(latestPopupNotif.id_notification)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                    title="Tutup banner pengumuman"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </aside>
            )}

            {notificationError && (
              <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 sm:flex-row sm:items-center sm:justify-between">
                <span>{notificationError}</span>
                <button type="button" onClick={() => fetchNotifications()} className="gov-btn-outline min-h-9 self-start px-3 py-1 text-xs sm:self-auto">
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                  Coba sinkronkan
                </button>
              </div>
            )}
            {dashboardError && (
              <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-950">
                <span>{dashboardError} Ringkasan yang gagal dimuat tidak ditampilkan sebagai angka nol.</span>
                <button type="button" onClick={() => window.location.reload()} className="shrink-0 font-bold underline">Muat ulang</button>
              </div>
            )}

            {/* Hero sambutan & status warga */}
            <section className="motion-hero relative overflow-hidden rounded-2xl border border-emerald-900 bg-gradient-to-br from-primary-dark via-primary to-primary-hover px-5 py-6 text-white shadow-card sm:px-8 sm:py-8">
              <div className="motion-orb pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="motion-orb motion-orb-delay pointer-events-none absolute -bottom-16 right-1/3 h-40 w-40 rounded-full bg-emerald-300/10 blur-2xl" />
              <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold backdrop-blur">
                    <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Warga Terverifikasi &middot; RT {currentUser?.rt || '001'} / RW {currentUser?.rw || '001'}
                  </span>
                  <h1 className="motion-title mt-3 text-xl font-extrabold leading-tight text-white sm:text-2xl lg:text-3xl">
                    Halo, {currentUser?.nama_lengkap || 'Warga Ngrowo'}
                  </h1>
                  <p className="mt-1.5 max-w-2xl text-sm text-emerald-50/90">
                    Selamat datang di portal layanan bantuan sosial Kelurahan Ngrowo. Berikut ringkasan bantuan dan pengaduan Anda.
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-black/15 px-2.5 py-1 text-[11px] font-medium text-emerald-50" aria-live="polite">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })} &middot; {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                  </p>
                </div>
              </div>
            </section>

            {/* Ringkasan statistik */}
            <section aria-label="Ringkasan bansos, desil, dan pengaduan saya" className="motion-stagger grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="gov-card motion-card flex items-center gap-3.5 p-4" style={{ '--stagger-index': 0 }}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <span className="material-symbols-outlined text-[24px]">volunteer_activism</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Bansos Saya</p>
                  <p className="text-2xl font-extrabold leading-tight text-slate-900">{isLoading ? '–' : bansosLoaded ? bansosData.length : '—'}</p>
                  <p className="text-xs font-medium text-slate-500">program terdata</p>
                </div>
              </div>
              <div className="gov-card motion-card flex items-center gap-3.5 p-4" style={{ '--stagger-index': 1 }}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <span className="material-symbols-outlined text-[24px]">assignment</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Pengaduan Saya</p>
                  <p className="text-2xl font-extrabold leading-tight text-slate-900">{isLoading ? '–' : reportsLoaded ? userReports.length : '—'}</p>
                  <p className="text-xs font-medium text-slate-500">pernah dikirim</p>
                </div>
              </div>
              <div className="gov-card motion-card flex items-center gap-3.5 p-4" style={{ '--stagger-index': 2 }}>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <span className="material-symbols-outlined text-[24px]">pending_actions</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Belum Selesai</p>
                  <p className="text-2xl font-extrabold leading-tight text-slate-900">{isLoading ? '–' : reportsLoaded ? activeReportCount : '—'}</p>
                  <p className="text-xs font-medium text-slate-500">menunggu / diproses</p>
                </div>
              </div>
              <div className="gov-card motion-card flex items-center gap-3.5 p-4" style={{ '--stagger-index': 3 }}>
                <div className="motion-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-800">
                  <span className="material-symbols-outlined text-[24px]">insights</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Desil Kesejahteraan</p>
                  <p className="text-xl font-extrabold leading-tight text-slate-900">
                    {isLoading ? '–' : !profileLoaded ? '—' : currentUser?.desil != null ? `Desil ${currentUser.desil}` : 'Belum ditetapkan'}
                  </p>
                  <p className="text-xs font-medium text-slate-500">Mengacu pada data induk warga</p>
                </div>
              </div>
            </section>

<div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
              {/* Kolom utama */}
              <div className="flex flex-col gap-5 lg:col-span-2">
                {/* Kartu Status Bantuan Aktif */}
                <section className="gov-card overflow-hidden">
                  <div className="gov-section-title">
                    <span className="material-symbols-outlined text-[20px] text-primary">payments</span>
                    <h2>Status Bantuan Sosial</h2>
                  </div>
                  <div className="p-4 sm:p-5">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-3 rounded-lg bg-slate-50 p-6 text-sm font-medium text-slate-500">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                        Memuat status bantuan sosial Anda...
                      </div>
                    ) : !bansosLoaded ? (
                      <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Status bantuan belum dapat dimuat. Coba muat ulang halaman.</div>
                    ) : activeBansos ? (
                      <div className="rounded-lg border border-emerald-200 bg-primary-soft/60 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                              <span className="material-symbols-outlined text-[23px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-500">Program Bantuan Aktif</p>
                              <p className="text-base font-bold leading-tight text-slate-900">
                                {activeBansos.jenis_bansos} <span className="font-semibold text-slate-500">(Tahun {activeBansos.periode_tahun})</span>
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-xs font-bold text-primary">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
                            {activeBansos.status_penerima === 'aktif' ? 'Terdaftar Aktif' : activeBansos.status_penerima}
                          </span>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 border-t border-emerald-200/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <div>
                              <p className="text-xs font-medium text-slate-600">Wilayah Penerima Terdaftar</p>
                              <p className="text-sm font-bold text-primary">RT {activeBansos.rt} / RW {activeBansos.rw}</p>
                            </div>
                          </div>
                          <Link to="/cek-bansos" className="inline-flex items-center gap-1 self-start text-xs font-bold text-primary hover:text-primary-dark sm:self-auto">
                            Lihat Rincian <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3.5 rounded-lg border border-emerald-200 bg-primary-soft p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                          <span className="material-symbols-outlined text-[22px]">info</span>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">Belum Ada Program Bansos Aktif</h3>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600">
                            NIK Anda saat ini belum tercatat dalam alokasi bantuan sosial aktif. Anda dapat memeriksa kuota bansos kelurahan atau mengajukan usulan mandiri.
                          </p>
                          <Link to="/cek-bansos" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-dark">
                            Cek Database Bansos <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Riwayat Pengaduan */}
                <section className="gov-card overflow-hidden">
                  <div className="gov-section-title">
                    <span className="material-symbols-outlined text-[20px] text-primary">assignment</span>
                    <h2>Pengaduan Terakhir</h2>
                    <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">{reportsLoaded ? `${userReports.length} laporan` : 'Data tidak tersedia'}</span>
                  </div>
                  <div className="p-4 sm:p-5">
                    {!reportsLoaded ? (
                      <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Riwayat pengaduan belum dapat dimuat.</div>
                    ) : hasUserReports ? (
                      <div className="space-y-2.5">
                        {userReports.slice(0, 3).map((report) => (
                          <div key={report.id_laporan} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold text-primary">{report.nomor_tiket}</span>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  report.status_laporan === 'selesai' ? 'bg-green-100 text-green-800' :
                                  report.status_laporan === 'proses' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {report.status_laporan.toUpperCase()}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-1 text-sm text-slate-600">{report.deskripsi_kejadian}</p>
                            </div>
                            <Link to={`/detail-laporan?tiket=${report.nomor_tiket}`} className="flex shrink-0 items-center text-xs font-bold text-primary hover:text-primary-dark">
                              Lacak <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
                          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Belum ada laporan yang dibuat</p>
                          <p className="mt-1 text-sm text-slate-600">Anda dapat mengajukan sanggahan atau laporan baru melalui menu pengaduan.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Layanan Utama */}
                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-slate-900 sm:text-lg">Layanan Utama Warga</h2>
                    <span className="text-sm font-medium text-slate-500">4 menu terintegrasi</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { to: '/cek-bansos', icon: 'search', title: 'Cek Status Bansos', desc: 'Cari data penerima PKH, BPNT, dan BLT berdasarkan NIK warga.' },
                      { to: '/pengaduan', icon: 'edit_note', title: 'Ajukan Sanggahan', desc: 'Laporkan ketidaksesuaian bansos atau usulkan warga yang berhak.' },
                      { to: '/detail-laporan', icon: 'timeline', title: 'Tracking Pengaduan', desc: 'Pantau tindak lanjut nomor tiket aduan Anda secara real-time.' },
                      { to: '/jadwal', icon: 'calendar_month', title: 'Jadwal & Info Bansos', desc: 'Jadwal pembagian sembako, beras CPP, dan info kuota kelurahan.' },
                    ].map((menu) => (
                      <Link key={menu.to} to={menu.to} className="gov-card gov-card-hover group flex items-start gap-3.5 p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                          <span className="material-symbols-outlined text-[24px]">{menu.icon}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{menu.title}</h3>
                            <span className="material-symbols-outlined text-[18px] text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-primary">arrow_forward</span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">{menu.desc}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              </div>

              {/* Kolom samping */}
              <div className="flex flex-col gap-5">
                {/* Kontak */}
                <section className="gov-card overflow-hidden">
                  <div className="gov-section-title">
                    <span className="material-symbols-outlined text-[20px] text-primary">support_agent</span>
                    <h2>Layanan Bantuan Warga</h2>
                  </div>
                  <div className="flex flex-col gap-3 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-600" />
                      Pelayanan hari kerja 08.00&ndash;15.00 WIB
                    </div>
                    <p className="text-sm leading-relaxed text-slate-600">
                      Butuh bantuan seputar data DTKS atau pencairan bantuan? Hubungi nomor resmi kelurahan.
                    </p>
                    <a href="tel:085806503734" className="gov-btn-outline w-full">
                      <span className="material-symbols-outlined text-[18px] text-primary">call</span>
                      Hubungi Kantor Desa
                    </a>
                    <a href="https://wa.me/6285806503734" target="_blank" rel="noopener noreferrer" className="gov-btn-primary w-full">
                      <span className="material-symbols-outlined text-[18px]">chat</span>
                      WhatsApp Admin
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      </WargaMain>

      {/* MODAL / DRAWER PENGUMUMAN & NOTIFIKASI WARGA */}
      {isNotifModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-notif-title"
          className="modal-backdrop"
          onClick={() => setIsNotifModalOpen(false)}
        >
          <div className="modal-panel modal-panel-flush flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden border border-slate-100" onClick={(event) => event.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-900 bg-primary-dark px-5 py-4 text-white">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
                  <span className="material-symbols-outlined text-[20px]">campaign</span>
                </div>
                <div>
                  <h3 id="modal-notif-title" className="text-base font-bold text-white">Pengumuman &amp; Notifikasi</h3>
                  <p className="text-[11px] text-emerald-100/90">Pesan dan informasi resmi Pemerintah Desa Ngrowo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNotifModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Tutup"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notificationError && (
                <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  {notificationError}
                </p>
              )}
              {notifications.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[28px]">notifications_off</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Belum Ada Pengumuman</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Pengumuman bansos, jadwal pembagian, dan informasi desa akan langsung muncul di sini secara otomatis.
                  </p>
                </div>
              ) : (
                notifications.map((item) => {
                  const isRead = !!item.read_at || !!item.is_read;
                  return (
                    <div
                      key={item.id_notification}
                      className={`p-3.5 rounded-xl transition-colors border ${
                        !isRead
                          ? 'bg-emerald-50/70 border-emerald-200 shadow-2xs'
                          : 'bg-white border-slate-100 hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!isRead && (
                            <span className="flex h-2 w-2 rounded-full bg-emerald-600"></span>
                          )}
                          <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                            Pemberitahuan Desa
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Baru saja'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#0F172A] mt-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed whitespace-pre-line">
                        {item.body}
                      </p>

                      {!isRead && (
                        <div className="mt-2.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(item.id_notification)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dark bg-white px-2.5 py-1 rounded-md border border-emerald-200 shadow-sm hover:bg-primary-soft"
                          >
                            <span className="material-symbols-outlined text-[14px]">done</span>
                            Tandai Sudah Dibaca
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 bg-slate-50/90 px-5 py-3 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Total {notifications.length} info ({unreadCount} belum dibaca)
              </span>
              <button
                type="button"
                onClick={() => setIsNotifModalOpen(false)}
                className="gov-btn-primary min-h-9 rounded-lg px-4 py-1.5 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}