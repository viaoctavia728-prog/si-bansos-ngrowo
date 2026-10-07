import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logoBojonegoro from '../images/logo bojonegoro.jpg';
import logoNgrowo from '../images/logo ngrowo.png';
import { authService } from '../services/auth';

const SLIDES = [
    {
        tag: "PORTAL RESMI KELURAHAN NGROWO",
        title: "Portal Resmi Bantuan Sosial Kelurahan Ngrowo",
        desc: "Sistem Informasi Penyaluran Bansos yang Transparan, Akurat, dan Terintegrasi untuk Warga Ngrowo, Bojonegoro",
        theme: "from-emerald-950 via-emerald-900 to-teal-950",
    },
    {
        tag: "TRANSPARAN & AKUNTABEL",
        title: "Penyaluran Bantuan Tepat Sasaran",
        desc: "Memastikan hak bantuan sosial warga tersalurkan secara adil, transparan, dan terdata langsung dengan DTKS",
        theme: "from-emerald-900 via-teal-900 to-emerald-950",
    },
    {
        tag: "LAYANAN ASPIRASI & PENGADUAN",
        title: "Layanan Pengaduan & Informasi Cepat",
        desc: "Pantau jadwal penyaluran beras, BLT, BPNT, kuota per RT, hingga sampaikan aspirasi warga dengan mudah",
        theme: "from-teal-950 via-emerald-900 to-emerald-950",
    }
];

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showLanding, setShowLanding] = useState(true);

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
            <div className="min-h-screen min-h-[100dvh] relative bg-emerald-950 overflow-x-hidden overflow-y-auto flex flex-col justify-between">

                {/* Navbar */}
                <header className="relative z-30 w-full px-3.5 sm:px-6 md:px-8 py-3.5 sm:py-5 max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2 sm:gap-3 bg-white/10 hover:bg-white/15 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-white/20 shadow-lg transition-all">
                        <img
                            src={logoNgrowo}
                            alt="Logo Kelurahan Ngrowo"
                            className="w-7 h-7 sm:w-9 sm:h-9 object-contain rounded-lg"
                        />
                        <div className="flex flex-col text-left">
                            <span className="text-xs sm:text-sm md:text-base font-extrabold text-white tracking-wide leading-tight">
                                SI-BANSOS NGROWO
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-emerald-200/90 font-medium tracking-normal hidden xs:inline">
                                Kel. Ngrowo • Bojonegoro
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowLanding(false)}
                        className="bg-white hover:bg-emerald-50 active:scale-95 text-emerald-800 text-xs sm:text-sm font-bold py-2 sm:py-2.5 px-3.5 sm:px-5 md:px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                        <span>Masuk Portal</span>
                        <span className="hidden sm:inline">Warga</span>
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                    </button>
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
                                <div className="h-10 sm:h-14 w-[1px] bg-emerald-200"></div>
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
                            <span className="inline-block text-[10px] sm:text-xs font-bold tracking-widest text-emerald-300 uppercase px-3 py-1 bg-white/10 rounded-full border border-white/10">
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
                            className="w-full xs:w-auto bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 text-emerald-950 font-extrabold text-sm sm:text-base md:text-lg py-3 sm:py-4 px-8 sm:px-12 rounded-full shadow-[0_0_35px_rgba(16,185,129,0.45)] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer mx-auto"
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

    // LOGIN PAGE: Responsive Centered Form with Official Dual Logos
    return (
        <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-[#F8FAF8] p-3 sm:p-6 py-6 sm:py-10 relative overflow-x-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-emerald-100/70 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-emerald-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl shadow-emerald-950/5 p-5 sm:p-8 md:p-9 border border-gray-100 z-10 transition-all">
                <div className="mb-5 sm:mb-6">
                    <button
                        onClick={() => setShowLanding(true)}
                        className="text-gray-500 hover:text-emerald-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        <span>Kembali ke Beranda</span>
                    </button>
                </div>

                {/* Welcome Logos & Heading */}
                <div className="mb-6 sm:mb-8 text-center">
                    <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-emerald-50/80 border border-emerald-100 mb-3 shadow-xs gap-3">
                        <img src={logoBojonegoro} alt="Logo Pemkab Bojonegoro" className="w-9 h-10 sm:w-11 sm:h-12 object-contain" />
                        <div className="w-px h-6 bg-emerald-200"></div>
                        <img src={logoNgrowo} alt="Logo Kelurahan Ngrowo" className="w-9 h-10 sm:w-11 sm:h-12 object-contain rounded-lg" />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Login SI-BANSOS 👋</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Masuk menggunakan NIK dan password akun warga.</p>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-start gap-2 animate-fadeIn">
                        <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">

                    {/* Input NIK warga */}
                    <div>
                        <label htmlFor="nik" className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                            <span>NIK Warga (16 digit) <span className="text-red-500">*</span></span>
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Sesuai KTP</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                className="w-full pl-11 pr-4 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all placeholder-gray-400"
                                required
                            />
                        </div>
                    </div>

                    {/* Input Password / PIN */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-gray-700">
                                Password / PIN Desa <span className="text-red-500">*</span>
                            </label>
                            <Link to="/lupa-pin" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                                Lupa PIN?
                            </Link>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-emerald-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                className="w-full pl-11 pr-12 py-3 sm:py-3.5 text-sm sm:text-base font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all placeholder-gray-400"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div className="pt-2 sm:pt-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full ${isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                                } text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                    <span>Memproses Login...</span>
                                </>
                            ) : (
                                <span>Masuk ke Dashboard</span>
                            )}
                        </button>
                    </div>

                </form>

                {/* Bottom Actions */}
                <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100 flex flex-col items-center gap-4 text-center">
                    <p className="text-xs sm:text-sm text-gray-500">
                        Warga baru belum terdaftar?{' '}
                        <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 underline decoration-2 underline-offset-2">
                            Daftar Akun Bansos
                        </Link>
                    </p>
                    <Link to="/admin/login" className="text-xs font-semibold text-slate-500 hover:text-emerald-700">
                        Portal khusus petugas
                    </Link>
                </div>
            </div>
        </div>
    );
}