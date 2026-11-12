import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logoBojonegoro from '../../images/logo bojonegoro.jpg';
import logoNgrowo from '../../images/logo ngrowo.png';
import { authService } from '../../services/auth';
import Register from './Register';

const SLIDES = [
    {
        tag: "PORTAL RESMI KELURAHAN NGROWO",
        title: "Portal Resmi Bantuan Sosial Kelurahan Ngrowo",
        desc: "Sistem Informasi Penyaluran Bansos yang Transparan, Akurat, dan Terintegrasi untuk Warga Ngrowo, Bojonegoro",
        theme: "from-primary-dark via-primary to-emerald-900",
    },
    {
        tag: "TRANSPARAN & AKUNTABEL",
        title: "Penyaluran Bantuan Tepat Sasaran",
        desc: "Memastikan hak bantuan sosial warga tersalurkan secara adil, transparan, dan terdata langsung dengan DTKS",
        theme: "from-primary via-primary-hover to-primary-dark",
    },
    {
        tag: "LAYANAN ASPIRASI & PENGADUAN",
        title: "Layanan Pengaduan & Informasi Cepat",
        desc: "Pantau jadwal penyaluran beras, BLT, BPNT, kuota per RT, hingga sampaikan aspirasi warga dengan mudah",
        theme: "from-emerald-900 via-primary-dark to-primary",
    }
];

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showLanding, setShowLanding] = useState(true);
    const [showPublicMenu, setShowPublicMenu] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showStaffPin, setShowStaffPin] = useState(false);
    const [staffPin, setStaffPin] = useState('');
    const [staffPinError, setStaffPinError] = useState('');
    const [checkingStaffPin, setCheckingStaffPin] = useState(false);

    // Form state & feedback
    const [nik, setNik] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Handle form login
    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        try {
            const res = await authService.login(nik, password);
            if (res?.data?.role === 'admin') {
                authService.logout();
                setErrorMessage('Portal ini khusus warga. Petugas silakan masuk melalui Portal Admin.');
            } else if (res?.data?.role === 'user' || res?.data?.role === 'warga') {
                navigate('/dashboard');
            } else {
                authService.logout();
                setErrorMessage('Akun tidak memiliki akses ke portal warga.');
            }
        } catch (err) {
            setErrorMessage(err.message || 'Login gagal. Periksa kembali NIK dan Password.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStaffPortalAccess = async (event) => {
        event.preventDefault();
        setStaffPinError('');
        setCheckingStaffPin(true);
        try {
            await authService.verifyStaffPortalPin(staffPin);
            sessionStorage.setItem('staff_portal_access', 'granted');
            navigate('/admin/login');
        } catch (error) {
            setStaffPinError(error.message || 'PIN Portal Petugas salah.');
        } finally {
            setCheckingStaffPin(false);
        }
    };

    // Auto-advance slider for landing page
    useEffect(() => {
        if (showLanding) {
            const timer = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
            }, 5000);
            return () => clearInterval(timer);
        }
    }, [showLanding]);

    if (showLanding) {
        // LANDING PAGE: Full screen responsive slider with Login CTA
        return (
            <div className="min-h-screen min-h-[100dvh] relative bg-primary-dark overflow-x-hidden overflow-y-auto flex flex-col justify-between">

                {/* Navbar */}
                <header className="relative z-30 w-full px-3.5 sm:px-6 md:px-8 py-3.5 sm:py-5 max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/20 shadow-lg transition-all">
                        <img
                            src={logoNgrowo}
                            alt="Logo Kelurahan Ngrowo"
                            className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-lg"
                        />
                        <div className="flex flex-col text-left">
                            <span className="text-xs sm:text-sm md:text-base font-extrabold text-amber-300 tracking-wide leading-tight">
                                SI-BANSOS NGROWO
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-emerald-200/90 font-medium tracking-normal hidden xs:inline">
                                Kel. Ngrowo • Bojonegoro
                            </span>
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setShowPublicMenu((visible) => !visible)}
                            aria-expanded={showPublicMenu}
                            aria-controls="public-info-menu"
                            aria-label="Buka menu informasi publik"
                            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/30 bg-white/15 text-white shadow-lg backdrop-blur-md transition-all hover:bg-white/25"
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                        {showPublicMenu && (
                            <div id="public-info-menu" className="absolute right-0 top-14 z-50 w-56 rounded-xl border border-white/20 bg-white p-2 text-left shadow-xl">
                                <Link
                                    to="/info-bansos"
                                    onClick={() => setShowPublicMenu(false)}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                                >
                                    <span className="material-symbols-outlined text-[19px]">info</span>
                                    Informasi Bansos &amp; FAQ
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPublicMenu(false);
                                        setShowLanding(false);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
                                >
                                    <span className="material-symbols-outlined text-[19px]">login</span>
                                    Masuk Portal Warga
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Slider Backgrounds */}
                {SLIDES.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out bg-gradient-to-br ${slide.theme} ${currentSlide === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
                            }`}
                    >
                        {/* Ambient glowing orbs */}
                        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] md:w-[700px] h-[300px] sm:h-[500px] md:h-[700px] bg-emerald-400/15 rounded-full blur-[100px] pointer-events-none"></div>
                        <div className="absolute bottom-10 right-10 w-60 sm:w-80 h-60 sm:h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
                        {/* Subtle decorative dot grid */}
                        <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
                    </div>
                ))}

                {/* Central Hero Content */}
                <main className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-6 sm:py-10 my-auto">
                    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">

                        {/* OFFICIAL EMBLEM BADGE (SESUAI GAMBAR LOGO) */}
                        <div className="flex flex-col items-center mb-5 sm:mb-7">
                            <div className="inline-flex items-center justify-center p-2.5 sm:p-3.5 bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/50 shadow-[0_12px_35px_rgba(0,0,0,0.3)] gap-3 sm:gap-5 transition-transform hover:scale-[1.02]">
                                <div className="w-12 h-14 sm:w-16 sm:h-18 md:w-20 md:h-22 flex items-center justify-center p-1">
                                    <img
                                        src={logoBojonegoro}
                                        alt="Logo Kabupaten Bojonegoro"
                                        className="w-full h-full object-contain filter drop-shadow-sm"
                                    />
                                </div>
                                <div className="h-10 sm:h-14 w-[1px] bg-[#EAF5EB]"></div>
                                <div className="w-12 h-14 sm:w-16 sm:h-18 md:w-20 md:h-22 flex items-center justify-center p-1">
                                    <img
                                        src={logoNgrowo}
                                        alt="Logo Kelurahan Ngrowo"
                                        className="w-full h-full object-contain rounded-xl shadow-xs"
                                    />
                                </div>
                            </div>

                            {/* Entity description tag */}
                            <div className="mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 backdrop-blur-md border border-emerald-400/30 text-emerald-200 text-[10px] sm:text-xs font-semibold tracking-wide shadow-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>Pemerintah Kabupaten Bojonegoro • Kelurahan Ngrowo</span>
                            </div>
                        </div>

                        {/* Slide Tagline */}
                        <div className="mb-2 sm:mb-3">
                            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-widest text-emerald-200 uppercase px-3 py-1 bg-white/10 rounded-full border border-white/10">
                                {SLIDES[currentSlide].tag}
                            </span>
                        </div>

                        {/* Slide Title */}
                        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-5 drop-shadow-lg leading-tight max-w-3xl">
                            {SLIDES[currentSlide].title}
                        </h1>

                        {/* Slide Desc */}
                        <p className="text-sm sm:text-base md:text-xl text-emerald-100/90 mb-8 sm:mb-10 drop-shadow font-normal max-w-2xl mx-auto leading-relaxed px-2">
                            {SLIDES[currentSlide].desc}
                        </p>

                        {/* CTA Button */}
                        <button
                            onClick={() => setShowLanding(false)}
                            className="w-full xs:w-auto bg-white active:scale-95 text-primary font-extrabold text-sm sm:text-base md:text-lg py-3 sm:py-4 px-8 sm:px-12 rounded-full shadow-lift hover:bg-emerald-50 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mx-auto"
                        >
                            <span>Akses Layanan Bansos</span>
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                        </button>
                    </div>
                </main>

                {/* Dots Indicator */}
                <footer className="relative z-20 pb-5 sm:pb-7 flex justify-center items-center gap-2 sm:gap-3">
                    {SLIDES.map((_, dotIndex) => (
                        <button
                            key={dotIndex}
                            onClick={() => setCurrentSlide(dotIndex)}
                            className={`h-2 sm:h-2.5 rounded-full transition-all duration-300 cursor-pointer ${currentSlide === dotIndex
                                    ? 'w-8 sm:w-10 bg-white shadow-md'
                                    : 'w-2.5 sm:w-3 bg-white/40 hover:bg-white/70'
                                }`}
                            aria-label={`Slide ${dotIndex + 1}`}
                        />
                    ))}
                </footer>
            </div>
        );
    }

    // LOGIN PAGE: Tata letak dua kolom bergaya portal pemerintah
    return (
        <>
        <div className="flex min-h-screen min-h-[100dvh] flex-col bg-[#F8FAFC] lg:flex-row">
            {/* Panel identitas instansi (desktop) */}
            <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary-dark via-primary to-primary-hover p-10 text-white lg:flex lg:w-2/5 lg:flex-col lg:justify-between xl:p-14">
                <div className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-emerald-300/10 blur-3xl" />
                <div className="relative">
                    <div className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 p-2.5 backdrop-blur">
                        <img src={logoBojonegoro} alt="Logo Pemkab Bojonegoro" className="h-11 w-11 rounded-lg bg-white object-contain p-1" />
                        <div className="h-9 w-px bg-white/25" />
                        <img src={logoNgrowo} alt="Logo Kelurahan Ngrowo" className="h-11 w-11 rounded-lg bg-white object-contain p-1" />
                    </div>
                    <p className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Pemerintah Kabupaten Bojonegoro</p>
                    <h1 className="mt-2 text-3xl font-extrabold leading-tight xl:text-4xl"><span className="text-amber-300">SI-BANSOS</span><br /><span className="text-amber-300">Kelurahan Ngrowo</span></h1>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-emerald-50/90">
                        Sistem Informasi Bantuan Sosial yang transparan, akurat, dan terintegrasi bagi warga Kelurahan Ngrowo.
                    </p>
                    <ul className="mt-8 space-y-3 text-sm">
                        {[
                            'Cek status penerima bantuan secara mandiri',
                            'Ajukan pengaduan & sanggahan dengan mudah',
                            'Pantau jadwal penyaluran secara real-time',
                        ].map((item) => (
                            <li key={item} className="flex items-start gap-2.5 text-emerald-50/95">
                                <span className="material-symbols-outlined text-[20px] text-emerald-300">check_circle</span>
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <p className="relative text-xs text-emerald-100/80">&copy; {new Date().getFullYear()} Pemerintah Kelurahan Ngrowo. Hak cipta dilindungi.</p>
            </aside>

            {/* Panel formulir login */}
            <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
                <div className="w-full max-w-md">
                    <button
                        onClick={() => setShowLanding(true)}
                        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-primary"
                    >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Kembali ke Beranda
                    </button>

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
                        {/* Logo pada mobile */}
                        <div className="mb-6 text-center lg:hidden">
                            <div className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-primary-soft p-2">
                                <img src={logoBojonegoro} alt="Logo Pemkab Bojonegoro" className="h-10 w-10 object-contain" />
                                <div className="h-6 w-px bg-emerald-200"></div>
                                <img src={logoNgrowo} alt="Logo Kelurahan Ngrowo" className="h-10 w-10 object-contain" />
                            </div>
                        </div>
                        <div className="mb-6">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                                <span className="material-symbols-outlined text-[14px]">verified</span>
                                Portal Resmi Warga
                            </span>
                            <h2 className="mt-3 text-xl font-extrabold text-slate-900 sm:text-2xl">Masuk ke Akun Warga</h2>
                            <p className="mt-1 text-sm text-slate-500">Gunakan NIK dan password akun bansos Anda.</p>
                        </div>

                        {/* Error Banner */}
                        {errorMessage && (
                            <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 sm:text-sm">
                                <svg className="mt-0.5 h-5 w-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Input NIK warga */}
                            <div>
                                <label htmlFor="nik" className="gov-label mb-1.5 flex items-center justify-between">
                                    <span>NIK Warga (16 digit) <span className="text-danger">*</span></span>
                                    <span className="rounded-full border border-emerald-200 bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">Sesuai KTP</span>
                                </label>
                                <div className="group relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-colors group-focus-within:text-primary">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                                        </svg>
                                    </div>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]{16}"
                                        maxLength="16"
                                        id="nik"
                                        name="nik"
                                        value={nik}
                                        onChange={(e) => setNik(e.target.value)}
                                        minLength={16}
                                        placeholder="Contoh: 3524011111110001"
                                        className="gov-input pl-11 font-mono tracking-wide"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Input Password / PIN */}
                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label htmlFor="password" className="gov-label">
                                        Password / PIN <span className="text-danger">*</span>
                                    </label>
                                    <Link to="/lupa-pin" className="text-xs font-semibold text-primary transition-colors hover:text-primary-dark">
                                        Lupa PIN?
                                    </Link>
                                </div>
                                <div className="group relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 transition-colors group-focus-within:text-primary">
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Masukkan password akun bansos"
                                        className="gov-input pl-11 pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-4 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
                                        aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {showPassword ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                            ) : (
                                                <>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                </>
                                            )}
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-1">
                                <button type="submit" disabled={isLoading} className="gov-btn-primary w-full">
                                    {isLoading ? (
                                        <>
                                            <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                            </svg>
                                            <span>Memproses Login...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[19px]">login</span>
                                            Masuk ke Dashboard
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>

                        {/* Bottom Actions */}
                        <div className="mt-6 flex flex-col items-center gap-3 border-t border-slate-100 pt-5 text-center">
                            <p className="text-sm text-slate-500">
                                Warga baru belum terdaftar?{' '}
                                <button type="button" onClick={() => setShowRegister(true)} className="font-bold text-primary underline decoration-2 underline-offset-2 hover:text-primary-dark">
                                    Daftar Akun Bansos
                                </button>
                            </p>
                            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStaffPin('');
                                        setStaffPinError('');
                                        setShowStaffPin(true);
                                    }}
                                    className="text-slate-500 hover:text-primary"
                                >
                                    Portal Petugas
                                </button>
                                <span className="h-3 w-px bg-slate-200" />
                                <Link to="/info-bansos" className="text-primary hover:text-primary-dark">Info Bansos &amp; FAQ</Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {showStaffPin && (
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="staff-pin-title"
                className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
                onClick={() => setShowStaffPin(false)}
            >
                <form
                    onSubmit={handleStaffPortalAccess}
                    className="w-full max-w-sm rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl"
                    onClick={(event) => event.stopPropagation()}
                >
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">lock</span>
                        <div>
                            <h2 id="staff-pin-title" className="text-base font-extrabold text-slate-900">Akses Portal Petugas</h2>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">Masukkan PIN akses sebelum melanjutkan ke login admin.</p>
                        </div>
                    </div>
                    {staffPinError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{staffPinError}</p>}
                    <label className="mt-4 block text-xs font-bold text-slate-700">
                        PIN Portal Petugas
                        <input
                            type="password"
                            value={staffPin}
                            onChange={(event) => setStaffPin(event.target.value)}
                            autoFocus
                            minLength={6}
                            required
                            className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
                            placeholder="Masukkan PIN"
                        />
                    </label>
                    <div className="mt-5 flex justify-end gap-2">
                        <button type="button" onClick={() => setShowStaffPin(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Batal</button>
                        <button type="submit" disabled={checkingStaffPin} className="rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-60">
                            {checkingStaffPin ? 'Memeriksa...' : 'Lanjut ke Portal'}
                        </button>
                    </div>
                </form>
            </div>
        )}

        {/* MODAL DAFTAR AKUN WARGA */}
        {showRegister && (
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="register-modal-title"
                className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 backdrop-blur-sm sm:p-6 animate-[fadeIn_.2s_ease-out]"
                onClick={() => setShowRegister(false)}
            >
                <div
                    className="my-4 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl animate-[popIn_.28s_cubic-bezier(.16,1,.3,1)] sm:my-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-4 py-3.5 backdrop-blur sm:px-6">
                        <div className="flex items-center gap-2.5">
                            <img src={logoNgrowo} alt="Logo Ngrowo" className="h-9 w-9 rounded-lg border border-emerald-100 bg-primary-soft object-contain p-1" />
                            <div className="leading-tight">
                                <h2 id="register-modal-title" className="text-sm font-extrabold text-secondary sm:text-base">Daftar Akun Warga</h2>
                                <p className="text-[11px] text-slate-500">Pendaftaran mandiri layanan bansos Desa Ngrowo</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowRegister(false)}
                            aria-label="Tutup pendaftaran"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                        >
                            <span className="material-symbols-outlined text-[22px]">close</span>
                        </button>
                    </div>
                    <div className="max-h-[calc(100dvh-8rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                        <Register embedded onClose={() => setShowRegister(false)} onSuccess={() => { setShowRegister(false); navigate('/dashboard'); }} />
                    </div>
                </div>
            </div>
        )}
        </>
    );
}