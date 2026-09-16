import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="min-h-screen flex flex-col justify-between bg-[#F8FBF9] text-[#1A2E1F]">
            
            {/* Top Accessibility & Government Banner */}
            <header className="w-full bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"></path>
                    </svg>
                    <span>Layanan Resmi Desa Ngrowo</span>
                </div>
                {/* Elderly Text Size Toggle */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 text-[11px] font-semibold">
                    <button type="button" className="px-2 py-0.5 rounded text-gray-500 hover:text-gray-800">A</button>
                    <button type="button" className="px-2 py-0.5 rounded bg-white text-emerald-800 shadow-sm">A+ (Besar)</button>
                </div>
            </header>

            {/* Main Container */}
            <main className="w-full max-w-md mx-auto px-5 pt-6 pb-8 flex-1 flex flex-col justify-center">

                {/* Brand & Village Header Card */}
                <div className="text-center mb-7">
                    <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-sm border border-emerald-100 mb-3.5">
                        <img 
                            src="https://lh3.googleusercontent.com/aida/AEtjO1Vu7Ok1ilr0QdmS-P_R2fWoeLNKjA1QEcOkNjeyCAO5qF879N-NlXh8wU6Ub2pGTIRr3lytin_UxlG5a7kcf1gdoVEwalaJ28DouB1M575MGO45qqYmkLM6Mk8eTSvZJaajaLvvJQxQF_gZLrUxXiIAM_zLyWotI4KpwnIf_g9EM1ZkVXEs-jPeuh2AIrD_4tEQH9SZDbEjllTMVcn4s76nBQ4UEO5GuYrIHlOee4hxx-Dc-4_YZx9ZGdE" 
                            alt="Logo SI-BANSOS NGROWO" 
                            className="w-14 h-14 rounded-xl object-contain shadow-xs" 
                        />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 leading-tight">
                        SI-BANSOS NGROWO
                    </h1>
                    <p className="text-sm font-medium text-emerald-800 mt-0.5">
                        Pemerintah Desa Ngrowo, Bojonegoro
                    </p>
                    <div className="mt-2.5 inline-block bg-emerald-50 border border-emerald-200/70 text-emerald-900 text-xs px-3 py-1 rounded-full font-medium">
                        Pelayanan untuk Membantu Warga
                    </div>
                </div>

                {/* Login Box Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-150 p-6">

                    {/* Welcoming subhead for rural seniors */}
                    <div className="mb-5 border-b border-gray-100 pb-3.5">
                        <h2 className="text-lg font-bold text-gray-900">Masuk Akun Warga</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Gunakan 16 digit NIK pada e-KTP Anda</p>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="space-y-5">
                        
                        {/* Input NIK */}
                        <div>
                            <label htmlFor="nik" className="block text-sm font-bold text-gray-800 mb-1.5 flex items-center justify-between">
                                <span>NIK (16 digit) <span className="text-red-600">*</span></span>
                                <span className="text-[11px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Sesuai KTP</span>
                            </label>
                            <div className="relative rounded-xl border-2 border-gray-200 bg-gray-50/50 focus-within:border-[#2E7D32] focus-within:ring-3 focus-within:ring-emerald-600/20 transition-all">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                                    </svg>
                                </div>
                                <input 
                                    type="tel" 
                                    inputMode="numeric" 
                                    pattern="[0-9]*" 
                                    maxLength="16" 
                                    id="nik" 
                                    name="nik" 
                                    placeholder="Contoh: 352201xxxxxxxxxx" 
                                    className="w-full pl-11 pr-4 py-3.5 text-base sm:text-lg font-semibold tracking-wider text-gray-900 bg-transparent rounded-xl focus:outline-none placeholder-gray-400" 
                                    required 
                                />
                            </div>
                            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                                <svg className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                16 angka nomor induk kependudukan di kartu keluarga/KTP
                            </p>
                        </div>

                        {/* Input Password / PIN */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-sm font-bold text-gray-800">
                                    Password / PIN Desa <span className="text-red-600">*</span>
                                </label>
                                <Link to="/lupa-pin" className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 underline">
                                    Lupa PIN?
                                </Link>
                            </div>
                            <div className="relative rounded-xl border-2 border-gray-200 bg-gray-50/50 focus-within:border-[#2E7D32] focus-within:ring-3 focus-within:ring-emerald-600/20 transition-all">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                    </svg>
                                </div>
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    id="password" 
                                    name="password" 
                                    placeholder="Masukkan password atau 6 angka PIN" 
                                    className="w-full pl-11 pr-12 py-3.5 text-base sm:text-lg font-medium text-gray-900 bg-transparent rounded-xl focus:outline-none placeholder-gray-400" 
                                    required 
                                />
                                {/* Toggle show password button */}
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-700 focus:outline-none cursor-pointer" 
                                    aria-label="Tampilkan password"
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

                        {/* Prominent Green CTA Button */}
                        <div className="pt-2">
                            <button 
                                type="submit" 
                                className="w-full bg-[#2E7D32] hover:bg-[#256629] active:bg-[#1B5E20] text-white font-bold text-lg py-3.5 px-4 rounded-xl shadow-md transition duration-150 ease-in-out flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Masuk</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                </svg>
                            </button>
                        </div>

                    </form>

                    {/* Registration Notice for Village Hall */}
                    <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-700 font-medium">
                            Belum punya akun?
                        </p>
                        <Link 
                            to="/register" 
                            className="mt-1 inline-flex items-center gap-1.5 text-base font-bold text-[#2E7D32] hover:text-[#1B5E20] underline decoration-2 underline-offset-2"
                        >
                            <span>Daftar Sekarang</span>
                            <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </Link>
                    </div>

                </div>

                {/* Elderly & Direct Village Assistance Quick Card */}
                <div className="mt-5 bg-emerald-50/80 rounded-xl border border-emerald-150 p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 4V3z"></path>
                        </svg>
                    </div>
                    <div className="text-xs">
                        <p className="font-bold text-emerald-950">Butuh bantuan?</p>
                        <p className="text-emerald-800 mt-0.5 leading-relaxed">Hubungi admin kantor balai desa ngrowo</p>
                        <div className="font-semibold text-emerald-900 mt-0.5">No.HP 085807078899</div>
                    </div>
                </div>

            </main>

            {/* Footer */}
            <footer className="w-full text-center py-4 text-xs text-gray-500 border-t border-gray-100 bg-white">
                <p>© 2026 Pemerintah Desa Ngrowo, Bojonegoro</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Sistem Informasi Penyaluran Bantuan Sosial Terpadu</p>
            </footer>

        </div>
    );
}