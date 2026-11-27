import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WargaSidebar from '../../components/WargaSidebar';
import WargaMain from '../../components/WargaMain';
import { authService } from '../../services/auth';
import { getAssetUrl } from '../../services/apiClient';
import { bansosService, pengaduanService } from '../../services/api';
import WelcomeTransition from '../../components/WelcomeTransition';

export default function Dashboard() {
  const location = useLocation();
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
  const [showWelcome, setShowWelcome] = useState(false);

  const finishWelcome = useCallback(() => setShowWelcome(false), []);

  useEffect(() => {
    if (location.state?.showWelcomeAfterLogin) {
      setShowWelcome(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

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

  const activeBansos = bansosData.length > 0 ? bansosData[0] : null;

  const hasUserReports = userReports.length > 0;
  const activeReportCount = userReports.filter((report) => report.status_laporan !== 'selesai' && report.status_laporan !== 'ditolak').length;
  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <WargaSidebar />

      <WargaMain>
      <Header />

      {showWelcome && (
        <WelcomeTransition
          userName={currentUser?.nama_lengkap || 'Warga Ngrowo'}
          rt={currentUser?.rt}
          rw={currentUser?.rw}
          onFinish={finishWelcome}
        />
      )}

      <main className="flex-1 pb-24 lg:pb-10">
        <div className="warga-shell pt-5 sm:pt-7">

          <div className="flex flex-col gap-5 sm:gap-6">
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
              <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
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

    </div>
  );
}