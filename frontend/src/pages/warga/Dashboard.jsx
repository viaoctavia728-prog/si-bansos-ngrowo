import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoNgrowo from '../../images/logo ngrowo.png';
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
  const [now, setNow] = useState(() => new Date());
  const [pushEnabling, setPushEnabling] = useState(false);
  const [pushMessage, setPushMessage] = useState('');

  // In-App Database Notifications state
  const [notifications, setNotifications] = useState([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [latestPopupNotif, setLatestPopupNotif] = useState(null);
  const [dismissedNotifIds, setDismissedNotifIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_in_app_notifs') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const profile = await authService.getProfile();
        setCurrentUser(profile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
      try {
        const [bansosRes, reportsRes] = await Promise.all([
          user.nik ? bansosService.cekBansosByNik(user.nik) : Promise.resolve([]),
          user.id_user ? pengaduanService.getByUser(user.id_user) : Promise.resolve([]),
        ]);
        setBansosData(Array.isArray(bansosRes) ? bansosRes : []);
        setUserReports(Array.isArray(reportsRes) ? reportsRes : []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setBansosData([]);
        setUserReports([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
        const dismissed = JSON.parse(localStorage.getItem('dismissed_in_app_notifs') || '[]');
        const newUnread = list.find((n) => !n.is_read && !dismissed.includes(n.id_notification));
        if (newUnread) {
          setLatestPopupNotif(newUnread);
        }
      }
    } catch {
      // keep silent on polling error
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 8000); // Polling real-time setiap 8 detik
    return () => window.clearInterval(interval);
  }, []);

  const handleDismissPopup = async (idNotification) => {
    try {
      await notificationService.markAsRead(idNotification);
    } catch {}
    const updated = [...dismissedNotifIds, idNotification];
    setDismissedNotifIds(updated);
    localStorage.setItem('dismissed_in_app_notifs', JSON.stringify(updated));
    setLatestPopupNotif(null);
    fetchNotifications();
  };

  const handleMarkAsRead = async (idNotification) => {
    try {
      await notificationService.markAsRead(idNotification);
    } catch {}
    setNotifications((prev) =>
      prev.map((n) => (n.id_notification === idNotification ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
    );
    if (latestPopupNotif?.id_notification === idNotification) {
      setLatestPopupNotif(null);
    }
    fetchNotifications();
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

  const isProfileComplete = Boolean(
    currentUser?.nama_lengkap && currentUser?.no_kk && currentUser?.no_hp &&
    currentUser?.rt && currentUser?.rw && currentUser?.alamat_detail,
  );

  // Ambil inisial nama
  const getInitials = (name) => {
    if (!name) return 'W';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const activeBansos = bansosData.length > 0 ? bansosData[0] : null;

  const hasUserReports = userReports.length > 0;
  const activeReportCount = userReports.filter((report) => report.status_laporan !== 'selesai' && report.status_laporan !== 'ditolak').length;
  const unreadCount = notifications.filter((n) => !n.is_read && !n.read_at).length;

  return (
    <div className="bg-[#f8f9ff] font-body-md text-[#121c2a] min-h-screen flex flex-col justify-between selection:bg-[#acf4a4]">
      
      {/* HEADER / NAVBAR ATAS */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-white border-b border-gray-200 shadow-sm">
        <div className="h-16 px-4 sm:px-6 max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs flex items-center justify-center bg-emerald-50 border border-emerald-100 p-0.5">
              <img src={logoNgrowo} alt="Logo Kelurahan Ngrowo" className="w-full h-full object-contain rounded-lg" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-[16px] sm:text-[17px] font-bold tracking-tight text-[#121c2a] leading-tight">
                SI-BANSOS NGROWO
              </span>
              <span className="font-caption text-[11px] sm:text-[12px] text-[#40493d] font-medium">
                Portal Warga Desa
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsNotifModalOpen(true)}
              title="Pengumuman & Notifikasi Warga"
              aria-label="Pengumuman & Notifikasi Warga"
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-emerald-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[21px]">
                {unreadCount > 0 ? 'notifications_active' : 'notifications_none'}
              </span>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            <Link to="/profil" title="Buka profil warga" aria-label="Buka profil warga" className="w-9 h-9 rounded-full border-2 border-emerald-200 overflow-hidden flex items-center justify-center bg-emerald-700 text-white font-bold text-xs flex-shrink-0 shadow-xs">
              {currentUser?.foto_profil ? <img src={getAssetUrl(currentUser.foto_profil)} alt="" className="h-full w-full object-cover" /> : getInitials(currentUser?.nama_lengkap)}
            </Link>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-white min-h-screen">
        <div className="flex flex-col w-full max-w-2xl mx-auto">
          <div className="px-4 sm:px-6 pt-4 flex flex-col gap-5">
            
            {/* Pop-up / Banner Pengumuman Real-time dari Admin */}
            {latestPopupNotif && (
              <aside
                role="region"
                aria-label="Pengumuman Penting"
                className="relative overflow-hidden rounded-2xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-900 via-emerald-800 to-[#1B4D3E] p-4 text-white shadow-lg animate-in fade-in slide-in-from-top-4 duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-yellow-300 backdrop-blur-xs">
                      <span className="material-symbols-outlined text-[24px]">campaign</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-md bg-yellow-400 px-2 py-0.5 text-[10px] font-black tracking-wide text-gray-900 uppercase">
                          Pengumuman Baru
                        </span>
                        <span className="text-[10px] text-emerald-100">
                          {latestPopupNotif.created_at
                            ? new Date(latestPopupNotif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
                            : 'Baru Saja'}
                        </span>
                      </div>
                      <h2 className="mt-1 text-sm sm:text-base font-bold text-white leading-snug">
                        {latestPopupNotif.title}
                      </h2>
                      <p className="mt-1 text-xs text-emerald-100/90 leading-relaxed whitespace-pre-line line-clamp-3">
                        {latestPopupNotif.body}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNotifModalOpen(true);
                            handleMarkAsRead(latestPopupNotif.id_notification);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 hover:bg-emerald-50 active:scale-95 transition-all shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">visibility</span>
                          Baca Selengkapnya
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissPopup(latestPopupNotif.id_notification)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-950/40 border border-emerald-400/30 px-2.5 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-950/60 transition-colors"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismissPopup(latestPopupNotif.id_notification)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
                    title="Tutup banner pengumuman"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </aside>
            )}

            {/* Greetings & Status Warga */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col gap-2">
                <div className="flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DCFCE7] bg-[#F0FDF4] px-2.5 py-1 text-[10px] font-semibold text-[#166534] sm:text-xs">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span>
                    Warga Terverifikasi • RT {currentUser?.rt || '001'} / RW {currentUser?.rw || '001'}
                  </span>
                  </div>
                  <p className="shrink-0 text-[9px] font-medium text-gray-700 sm:text-[10px]" aria-live="polite">
                    {now.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' })} · {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                  </p>
                </div>
                <h1 className="text-xl font-extrabold text-[#121c2a] sm:text-2xl">
                  Halo, {currentUser?.nama_lengkap || 'Warga Ngrowo'}!
                </h1>
                <p className="text-xs sm:text-[14px] text-[#40493d]">
                  NIK: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded font-bold text-gray-800">{currentUser?.nik}</code> • Berikut ringkasan bantuan sosial dan pengaduan Anda.
                </p>
              </div>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-gray-900 sm:text-sm">Profil Warga</h2>
                    <p className="mt-0.5 text-[10px] leading-snug text-gray-600 sm:text-xs">{isProfileComplete ? 'Data profil Anda sudah lengkap.' : 'Lengkapi data agar layanan warga dapat memverifikasi informasi Anda.'}</p>
                  </div>
                </div>
                <button type="button" onClick={() => navigate('/profil')} className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md bg-emerald-800 px-2.5 text-[10px] font-semibold text-white hover:bg-emerald-900 sm:text-xs">
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  {isProfileComplete ? 'Lihat Profil' : 'Lengkapi Profil'}
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-gray-100 pt-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  <span className="text-[10px] font-medium text-emerald-800">
                    Sistem Pengumuman Real-time Aktif ({notifications.length} info)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNotifModalOpen(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 hover:text-emerald-950"
                  >
                    <span className="material-symbols-outlined text-[14px]">notifications</span>
                    Lihat Pengumuman
                  </button>
                  {isFcmConfigured && (
                    <button
                      type="button"
                      onClick={handleEnablePush}
                      disabled={pushEnabling}
                      className="text-[9px] text-gray-500 hover:text-emerald-700 underline"
                      title="Sinkronkan notifikasi browser web push jika diinginkan"
                    >
                      {pushEnabling ? 'Mengaktifkan...' : 'Push Browser'}
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section aria-label="Ringkasan bansos dan pengaduan saya" className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs font-semibold text-emerald-900">Bansos saya</p>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{isLoading ? '–' : bansosData.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-600">program terdata</p>
              </div>
              <div className="min-w-0 rounded-xl border border-sky-100 bg-sky-50/70 p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs font-semibold text-sky-900">Pengaduan saya</p>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{isLoading ? '–' : userReports.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-600">pernah dikirim</p>
              </div>
              <div className="min-w-0 rounded-xl border border-amber-100 bg-amber-50/70 p-3 sm:p-4">
                <p className="text-[10px] sm:text-xs font-semibold text-amber-900">Belum selesai</p>
                <p className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{isLoading ? '–' : activeReportCount}</p>
                <p className="text-[10px] sm:text-xs text-gray-600">menunggu / diproses</p>
              </div>
            </section>

            {/* Kartu Status Bantuan Aktif (Dynamic dari Database) */}
            {isLoading ? (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 animate-pulse flex items-center justify-center gap-3">
                <span className="animate-spin material-symbols-outlined text-emerald-700">progress_activity</span>
                <span className="text-sm font-medium text-gray-600">Memuat status bantuan sosial Anda...</span>
              </div>
            ) : activeBansos ? (
              <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden ring-1 ring-emerald-100">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1B4D3E]"></div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E8F5E9] text-[#1B4D3E]">
                      <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-[#40493d]">Program Bantuan Aktif Anda</span>
                      <span className="text-[17px] font-bold text-[#121c2a] leading-tight mt-0.5">
                        {activeBansos.jenis_bansos} (Tahun {activeBansos.periode_tahun})
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-[#DCFCE7] border-[#BBF7D0] text-[#166534]">
                    <span className="w-2 h-2 rounded-full animate-pulse bg-[#166534]"></span>
                    {activeBansos.status_penerima === 'aktif' ? 'Terdaftar Aktif' : activeBansos.status_penerima}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#40493d]">Wilayah Penerima Terdaftar</span>
                    <span className="text-[14px] font-bold tracking-tight text-[#1B4D3E]">
                      RT {activeBansos.rt} / RW {activeBansos.rw}, {activeBansos.dusun || 'Desa Ngrowo'}
                    </span>
                  </div>
                  <Link 
                    to="/cek-bansos"
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline self-start sm:self-auto"
                  >
                    <span>Lihat Rincian Program</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 flex items-start gap-3.5 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[22px]">info</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">Belum Ada Program Bansos Aktif</h3>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    NIK Anda saat ini belum tercatat dalam alokasi bantuan sosial aktif tahun 2026. Anda dapat memeriksa kuota bansos desa atau mengajukan usulan mandiri.
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Link to="/cek-bansos" className="text-xs font-bold text-emerald-800 hover:underline">
                      Cek Database Bansos →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Riwayat Pengaduan / Usulan Pengguna (Jika Ada) */}
            {hasUserReports && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-800 text-[20px]">assignment</span>
                    <h2 className="text-sm sm:text-base font-bold text-gray-900">Pengaduan Terakhir Anda</h2>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {userReports.length} Laporan
                  </span>
                </div>
                <div className="space-y-2">
                  {userReports.slice(0, 2).map((report) => (
                    <div key={report.id_laporan} className="p-3 bg-gray-50 rounded-xl flex items-center justify-between gap-2 border border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-900">{report.nomor_tiket}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            report.status_laporan === 'selesai' ? 'bg-green-100 text-green-800' :
                            report.status_laporan === 'proses' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {report.status_laporan.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">{report.deskripsi_kejadian}</p>
                      </div>
                      <Link 
                        to={`/detail-laporan?tiket=${report.nomor_tiket}`}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 shrink-0 flex items-center"
                      >
                        <span>Lacak</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && !hasUserReports && (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700">
                    <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Belum ada laporan yang dibuat</p>
                    <p className="text-xs text-gray-600 mt-1">Anda bisa mengajukan sanggahan atau laporan baru melalui menu pengaduan.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Banner Pengumuman Desa */}
            <div className="bg-white rounded-xl p-3.5 flex items-center gap-3.5 border border-gray-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#F3F4F6] text-[#1B4D3E]">
                <span className="material-symbols-outlined text-[22px]">campaign</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white leading-none bg-[#1B4D3E]">Pengumuman</span>
                  <span className="text-xs text-[#40493d]">Admin Desa Ngrowo</span>
                </div>
                <h2 className="text-[14px] font-bold text-[#121c2a] truncate mt-1">
                  {notifications[0]?.title || 'Belum ada pengumuman terbaru'}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                  {notifications[0]?.body || 'Informasi dari admin akan tampil otomatis di bagian ini.'}
                </p>
              </div>
              <Link to="/jadwal" className="material-symbols-outlined text-gray-400 hover:text-emerald-700 text-[20px]">
                chevron_right
              </Link>
            </div>

            {/* SECTION: Layanan Utama Warga */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] sm:text-[18px] font-bold text-[#121c2a]">Layanan Utama Warga</h2>
                <span className="text-xs text-[#40493d] font-medium">4 Menu Terintegrasi</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Menu 1 */}
                <Link to="/cek-bansos" className="group flex items-start gap-3.5 bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-emerald-300 transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors bg-[#E8F5E9] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[24px]">search_check</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-[#121c2a]">Cek Status Bansos</h3>
                      <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-[13px] text-[#40493d] mt-1 leading-relaxed">Cari data penerima PKH, BPNT, dan BLT berdasarkan NIK warga.</p>
                  </div>
                </Link>

                {/* Menu 2 */}
                <Link to="/pengaduan" className="group flex items-start gap-3.5 bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-emerald-300 transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors bg-[#E8F5E9] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[24px]">edit_note</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-[#121c2a]">Ajukan Sanggahan / Aduan</h3>
                      <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-[13px] text-[#40493d] mt-1 leading-relaxed">Laporkan ketidaksesuaian bansos atau usulkan warga yang berhak.</p>
                  </div>
                </Link>

                {/* Menu 3 */}
                <Link to="/detail-laporan" className="group flex items-start gap-3.5 bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-emerald-300 transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors bg-[#E8F5E9] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[24px]">timeline</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-[#121c2a]">Tracking Pengaduan</h3>
                      <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-[13px] text-[#40493d] mt-1 leading-relaxed">Pantau tindak lanjut nomor tiket aduan Anda secara real-time.</p>
                  </div>
                </Link>

                {/* Menu 4 */}
                <Link to="/jadwal" className="group flex items-start gap-3.5 bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-emerald-300 transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors bg-[#E8F5E9] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-[#121c2a]">Jadwal &amp; Info Bansos</h3>
                      <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-[13px] text-[#40493d] mt-1 leading-relaxed">Jadwal pembagian sembako, beras CPP, dan info kuota desa.</p>
                  </div>
                </Link>

              </div>
            </section>

            {/* Kartu Kontak Balai Desa & WhatsApp */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-bold">
                    <span className="material-symbols-outlined text-[24px]">support_agent</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#40493d] font-medium">Layanan Bantuan Warga</span>
                    <h4 className="text-[15px] sm:text-[16px] font-bold text-[#121c2a] leading-tight">Admin Kelurahan Ngrowo</h4>
                    <span className="text-[11px] sm:text-[12px] font-semibold flex items-center gap-1 mt-0.5 text-[#1B4D3E]">
                      <span className="w-2 h-2 rounded-full bg-[#1B4D3E] animate-pulse"></span>Pelayanan Hari Kerja (08:00 - 15:00 WIB)
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-[#40493d] leading-relaxed">
                Butuh bantuan seputar data DTKS atau pencairan bantuan? Anda dapat menghubungi nomor resmi kelurahan.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[#121c2a] font-semibold text-[13px] sm:text-[14px] hover:bg-gray-50 active:scale-[0.98] transition-all" href="tel:085807078899">
                  <span className="material-symbols-outlined text-[18px] text-[#1B4D3E]">call</span>
                  <span>Hubungi Kantor Desa</span>
                </a>
                <a className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-semibold text-[13px] sm:text-[14px] active:scale-[0.98] transition-all shadow-sm bg-[#1B4D3E] hover:bg-[#153e32]" href="https://wa.me/6285807078899" target="_blank" rel="noopener noreferrer">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>WhatsApp (0858-0707-8899)</span>
                </a>
              </div>
            </div>

            {/* Footer Text Copyright */}
            <div className="text-center py-2">
              <p className="text-[12px] text-[#40493d]">Pemerintah Desa Ngrowo • Sistem Akuntabel, Tepat Sasaran &amp; Transparan</p>
            </div>

          </div>
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-white border-t border-gray-200 shadow-sm">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-5">
          <Link aria-current="page" className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] relative text-[#1B4D3E]" to="/dashboard">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            <span className="text-[11px] font-bold">Beranda</span>
            <span className="w-5 h-1 rounded-full absolute -bottom-1 bg-[#1B4D3E]"></span>
          </Link>
          <Link className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] text-[#40493d] hover:text-emerald-800 transition-colors" to="/cek-bansos">
            <span className="material-symbols-outlined text-[22px]">search</span>
            <span className="text-[11px] font-medium">Cek Bansos</span>
          </Link>
          <Link className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] text-[#40493d] hover:text-emerald-800 transition-colors" to="/pengaduan">
            <span className="material-symbols-outlined text-[22px]">edit_document</span>
            <span className="text-[11px] font-medium">Pengaduan</span>
          </Link>
          <Link className="flex flex-col items-center justify-center gap-0.5 min-w-[60px] text-[#40493d] hover:text-emerald-800 transition-colors" to="/info">
            <span className="material-symbols-outlined text-[22px]">info</span>
            <span className="text-[11px] font-medium">Info</span>
          </Link>
        </div>
      </nav>

      {/* MODAL / DRAWER PENGUMUMAN & NOTIFIKASI WARGA */}
      {isNotifModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-notif-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-gray-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-emerald-900 bg-[#1B4D3E] px-5 py-4 text-white">
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
              {notifications.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[28px]">notifications_off</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">Belum Ada Pengumuman</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
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
                          : 'bg-white border-gray-100 hover:bg-gray-50/70'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!isRead && (
                            <span className="flex h-2 w-2 rounded-full bg-emerald-600"></span>
                          )}
                          <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">
                            Pemberitahuan Desa
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-600">
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

                      <h4 className="text-sm font-bold text-gray-900 mt-1">{item.title}</h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-line">
                        {item.body}
                      </p>

                      {!isRead && (
                        <div className="mt-2.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(item.id_notification)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-200 shadow-2xs hover:bg-emerald-50"
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
            <div className="border-t border-gray-100 bg-gray-50/90 px-5 py-3 flex items-center justify-between">
              <span className="text-[11px] text-gray-600">
                Total {notifications.length} info ({unreadCount} belum dibaca)
              </span>
              <button
                type="button"
                onClick={() => setIsNotifModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#1B4D3E] text-xs font-semibold text-white hover:bg-[#153e32]"
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