import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const SLIDES = [
    {

        desc: "Sistem Informasi Penyaluran Bansos yang Transparan dan Akurat untuk Warga Ngrowo, Bojonegoro",
    },
    {
        desc: "Memastikan hak bantuan sosial warga tersalurkan secara adil, transparan, dan terdata dengan baik",
    },
    {
        desc: "Pantau jadwal penyaluran, kuota per RT, hingga sampaikan aspirasi dengan mudah",
    }
];

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [showLanding, setShowLanding] = useState(true);

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
        // LANDING PAGE: Full screen slider with Login button
        return (
            <div className="min-h-screen relative bg-emerald-900 overflow-hidden flex flex-col">
                {/* Navbar */}
                <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-30">
                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/20 shadow-lg">
                        <img 
                            src="/logo_ngrowo.png" 
                            alt="Logo Ngrowo" 
                            className="w-8 h-8 object-contain" 
                        />
                        <span className="text-xl font-bold text-white tracking-wide">SI-BANSOS NGROWO</span>
                    </div>
                    <button 
                        onClick={() => setShowLanding(false)}
                        className="bg-white text-emerald-700 hover:bg-emerald-50 text-sm font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg"
                    >
                        Masuk Portal Warga
                    </button>
                </nav>

                {/* Slider Backgrounds */}
                {SLIDES.map((slide, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            currentSlide === index ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900 via-emerald-900/70 to-black/40 z-10"></div>
                        <img
                            src={slide.image}
                            alt={slide.title}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                ))}

                {/* Content */}
                <div className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-6 mt-12">
                    <div className="max-w-4xl">
                        <div className="inline-flex items-center justify-center p-4 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 mb-8 shadow-2xl gap-5">
                            <img 
                                src="/logo-pemkab.jpg" 
                                alt="Logo Pemkab Bojonegoro" 
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-contain" 
                            />
                            <img 
                                src="/logo_ngrowo.png" 
                                alt="Logo Kelurahan Ngrowo" 
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-contain" 
                            />
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg leading-tight">
                            {SLIDES[currentSlide].title}
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-emerald-50 mb-12 drop-shadow-md font-medium max-w-2xl mx-auto">
                            {SLIDES[currentSlide].desc}
                        </p>
                        <button 
                            onClick={() => setShowLanding(false)}
                            className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold text-lg py-4 px-12 rounded-full shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all duration-300 flex items-center gap-2 mx-auto"
                        >
                            <span>Akses Layanan Bansos</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Dots Indicator */}
                <div className="relative z-20 pb-10 flex justify-center gap-3">
                    {SLIDES.map((_, dotIndex) => (
                        <button
                            key={dotIndex}
                            onClick={() => setCurrentSlide(dotIndex)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                currentSlide === dotIndex 
                                    ? 'w-10 bg-white' 
                                    : 'w-3 bg-white/40 hover:bg-white/60'
                            }`}
                            aria-label={`Go to slide ${dotIndex + 1}`}
                        />
                    ))}
                </div>
            </div>
        );
    }

    // LOGIN PAGE: Only Form (Centered)
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 sm:p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-100 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-emerald-900/5 p-8 sm:p-10 border border-gray-100 z-10">
                <div className="mb-6">
                    <button 
                        onClick={() => setShowLanding(true)}
                        className="text-gray-400 hover:text-emerald-600 text-sm font-semibold flex items-center gap-1.5 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                        </svg>
                        Kembali ke Beranda
                    </button>
                </div>

                {/* Welcome Text */}
                <div className="mb-8 text-center">
                    <img src="/logo_ngrowo.png" alt="Logo" className="w-16 h-16 mx-auto mb-4 object-contain drop-shadow-sm" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Login SI-BANSOS 👋</h2>
                    <p className="text-gray-500 text-sm">Masukkan NIK dan PIN terdaftar untuk cek status bantuan.</p>
                </div>

                {/* Form */}
                <form onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="space-y-5">
                    
                    {/* Input NIK */}
                    <div>
                        <label htmlFor="nik" className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
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
                                pattern={'[0-9]{16}'} 
                                maxLength="16" 
                                id="nik" 
                                name="nik" 
                                minLength={16}
                                placeholder="Contoh: 352201xxxxxxxxxx" 
                                className="w-full pl-11 pr-4 py-3.5 text-base font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all placeholder-gray-400" 
                                required 
                            />
                        </div>
                    </div>

                    {/* Input Password / PIN */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                PIN Akun Bansos <span className="text-red-500">*</span>
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
                                placeholder="Masukkan 6 digit PIN" 
                                className="w-full pl-11 pr-12 py-3.5 text-base font-medium text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all placeholder-gray-400" 
                                required 
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none" 
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
                    <div className="pt-4">
                        <button 
                            type="submit" 
                            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-base py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            <span>Masuk ke Dashboard</span>
                        </button>
                    </div>
                </form>

                {/* Bottom Actions */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-4 text-center">
                    <p className="text-sm text-gray-500">
                        Warga baru belum terdaftar?{' '}
                        <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-700 underline decoration-2 underline-offset-2">
                            Daftar Akun Bansos
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}