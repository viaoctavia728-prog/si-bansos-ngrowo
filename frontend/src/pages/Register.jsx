import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoBojonegoro from '../images/logo bojonegoro.jpg';
import logoNgrowo from '../images/logo ngrowo.png';
import { authService } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nik: '',
    no_kk: '',
    no_hp: '',
    dusun: 'Dusun Krajan',
    rw: '001',
    rt: '001',
    detail_alamat: '',
    username: '',
    password: '',
    confirm_password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validasi input
    if (formData.nik.length !== 16) {
      setErrorMessage('NIK harus terdiri dari 16 digit angka!');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password minimal 6 karakter!');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password yang dimasukkan!');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        nik: formData.nik,
        nama_lengkap: formData.nama_lengkap,
        no_kk: formData.no_kk,
        no_hp: formData.no_hp,
        username: formData.username || formData.nik,
        password: formData.password,
        rt: formData.rt,
        rw: formData.rw,
      });

      setSuccessMessage('Pendaftaran akun berhasil! Mengalihkan ke halaman login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || 'Pendaftaran gagal. Periksa data kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#f8f9ff] font-body-md text-[#121c2a] min-h-screen flex flex-col justify-center items-center p-3 sm:p-5">
      <main className="w-full max-w-xl bg-[#f8f9ff]">
        <div className="flex flex-col w-full pb-12">
          
          {/* Brand & Administrative Header */}
          <header className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
              <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white shadow-md border border-gray-100 gap-3">
                <img 
                  alt="Lambang Kabupaten Bojonegoro" 
                  className="w-12 h-14 object-contain" 
                  src={logoBojonegoro} 
                />
                <div className="w-px h-8 bg-gray-200"></div>
                <img 
                  alt="Lambang Resmi Desa Ngrowo" 
                  className="w-12 h-14 object-contain rounded-lg" 
                  src={logoNgrowo} 
                />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 bg-[#2e7d32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                RESMI
              </span>
            </div>
            <span className="text-[13px] sm:text-[14px] font-medium text-[#0d631b] tracking-wider uppercase">
              Sistem Informasi Bantuan Sosial
            </span>
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#121c2a] mt-1">Daftar Akun Warga</h1>
            <p className="text-sm sm:text-[16px] text-[#40493d] max-w-md mt-1">
              Pendaftaran Mandiri Layanan Bantuan Sosial &amp; Pengaduan Desa Ngrowo, Bojonegoro
            </p>
          </header>

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0 mt-0.5">error</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-[20px] shrink-0 mt-0.5">check_circle</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Notice Callout (Civic Notice) */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#acf4a4] flex items-center justify-center flex-shrink-0 text-[#0d631b]">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div>
                <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#121c2a]">Pendaftaran Khusus Warga Desa Ngrowo</h4>
                <p className="text-[13px] sm:text-[14px] text-[#40493d] mt-0.5 leading-relaxed">
                  NIK dan No. KK akan divalidasi langsung secara otomatis dengan database kependudukan Desa Ngrowo dan Data Terpadu Kesejahteraan Sosial (DTKS).
                </p>
              </div>
            </div>
          </div>

          {/* Registration Card Form Container */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-5 md:p-6 shadow-md flex flex-col gap-6">
            
            {/* SECTION 1: Identitas Kependudukan */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2">
                <span className="material-symbols-outlined text-[#0d631b] text-[24px]">badge</span>
                <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#121c2a]">1. Data Identitas Kependudukan</h2>
              </div>

              {/* Nama Lengkap */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] sm:text-[17px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="nama_lengkap">
                  Nama Lengkap (Sesuai KTP)
                  <span className="text-[#ba1a1a] text-[13px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">person</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] sm:text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="nama_lengkap" 
                    value={formData.nama_lengkap}
                    onChange={handleChange}
                    placeholder="Contoh: Siti Aminah" 
                    required 
                    type="text" 
                  />
                </div>
                <p className="text-[12px] sm:text-[13px] text-[#40493d]">Tulis nama lengkap tanpa singkatan berlebihan.</p>
              </div>

              {/* NIK */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] sm:text-[17px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="nik">
                  Nomor Induk Kependudukan (NIK)
                  <span className="text-[#ba1a1a] text-[13px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">id_card</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] sm:text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all tracking-wider border border-transparent focus:border-[#707a6c]" 
                    id="nik" 
                    value={formData.nik}
                    onChange={handleChange}
                    maxLength="16" 
                    minLength={16}
                    placeholder="Contoh: 3524011111110001" 
                    required 
                    type="tel" 
                  />
                </div>
                <p className="text-[12px] sm:text-[13px] text-[#40493d]">16 digit angka yang tertera pada e-KTP Bojonegoro.</p>
              </div>

              {/* No KK */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] sm:text-[17px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="no_kk">
                  Nomor Kartu Keluarga (KK)
                  <span className="text-[#ba1a1a] text-[13px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">diversity_3</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] sm:text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all tracking-wider border border-transparent focus:border-[#707a6c]" 
                    id="no_kk" 
                    value={formData.no_kk}
                    onChange={handleChange}
                    maxLength="16" 
                    placeholder="Contoh: 3524011111119999" 
                    required 
                    type="tel" 
                  />
                </div>
                <p className="text-[12px] sm:text-[13px] text-[#40493d]">16 digit angka di bagian paling atas lembar Kartu Keluarga.</p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-[#e6eeff]"></div>

            {/* SECTION 2: Kontak & Domisili */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2">
                <span className="material-symbols-outlined text-[#0d631b] text-[24px]">home_pin</span>
                <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#121c2a]">2. Kontak &amp; Alamat Wilayah Domisili</h2>
              </div>

              {/* No WhatsApp */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] sm:text-[17px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="no_hp">
                  Nomor WhatsApp / Handphone
                  <span className="text-[#ba1a1a] text-[13px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">phone_iphone</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] sm:text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="no_hp" 
                    value={formData.no_hp}
                    onChange={handleChange}
                    placeholder="Contoh: 081234567890" 
                    required 
                    type="tel" 
                  />
                </div>
                <p className="text-[12px] sm:text-[13px] text-[#40493d]">
                  Penting: Digunakan untuk menerima notifikasi status bansos via WhatsApp atau SMS.
                </p>
              </div>

              {/* Cascading Wilayah */}
              <div className="flex flex-col gap-2">
                <span className="text-[15px] sm:text-[17px] font-semibold text-[#121c2a] flex items-center gap-1">
                  Wilayah Domisili Desa Ngrowo
                  <span className="text-[#ba1a1a] text-[13px] font-medium">(Wajib)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Dusun */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#40493d]" htmlFor="dusun">Dusun</label>
                    <div className="relative flex items-center">
                      <select 
                        className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] rounded-lg px-3 appearance-none outline-none focus:bg-white cursor-pointer border border-transparent focus:border-[#707a6c]" 
                        id="dusun" 
                        value={formData.dusun}
                        onChange={handleChange}
                        required
                      >
                        <option value="Dusun Krajan">Dusun Krajan</option>
                        <option value="Dusun Ngrowo Timur">Dusun Ngrowo Timur</option>
                        <option value="Dusun Medang">Dusun Medang</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 pointer-events-none text-[#707a6c]">arrow_drop_down</span>
                    </div>
                  </div>
                  {/* RW */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#40493d]" htmlFor="rw">Rukun Warga (RW)</label>
                    <div className="relative flex items-center">
                      <select 
                        className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] rounded-lg px-3 appearance-none outline-none focus:bg-white cursor-pointer border border-transparent focus:border-[#707a6c]" 
                        id="rw" 
                        value={formData.rw}
                        onChange={handleChange}
                        required
                      >
                        <option value="001">RW 01</option>
                        <option value="002">RW 02</option>
                        <option value="003">RW 03</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 pointer-events-none text-[#707a6c]">arrow_drop_down</span>
                    </div>
                  </div>
                  {/* RT */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[13px] font-semibold text-[#40493d]" htmlFor="rt">Rukun Tetangga (RT)</label>
                    <div className="relative flex items-center">
                      <select 
                        className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] rounded-lg px-3 appearance-none outline-none focus:bg-white cursor-pointer border border-transparent focus:border-[#707a6c]" 
                        id="rt" 
                        value={formData.rt}
                        onChange={handleChange}
                        required
                      >
                        <option value="001">RT 01</option>
                        <option value="002">RT 02</option>
                        <option value="003">RT 03</option>
                        <option value="004">RT 04</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 pointer-events-none text-[#707a6c]">arrow_drop_down</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Alamat */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] sm:text-[17px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="detail_alamat">
                  Detail Alamat Lengkap
                </label>
                <textarea 
                  className="w-full bg-[#eff4ff] text-[#121c2a] text-[15px] rounded-lg p-3.5 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                  id="detail_alamat" 
                  value={formData.detail_alamat}
                  onChange={handleChange}
                  placeholder="Jalan / Gang / No. Rumah (Contoh: Jl. Balai Desa No. 12)" 
                  rows="2"
                ></textarea>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[1px] bg-[#e6eeff]"></div>

            {/* SECTION 3: Keamanan Akun */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2">
                <span className="material-symbols-outlined text-[#0d631b] text-[24px]">lock_reset</span>
                <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#121c2a]">3. Keamanan Akun Warga</h2>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] sm:text-[17px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="username">
                  Username Akun
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">alternate_email</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] sm:text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="username" 
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Buat username (opsional, contoh: siti_ngrowo)" 
                    type="text" 
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] sm:text-[17px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="password">
                  Password / PIN Akun
                  <span className="text-[#ba1a1a] text-[13px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">key</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] sm:text-[16px] rounded-lg pl-12 pr-12 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="password" 
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimal 6 karakter" 
                    required 
                    type={showPassword ? "text" : "password"} 
                  />
                  <button 
                    aria-label="Lihat kata sandi" 
                    className="absolute right-3 w-8 h-8 flex items-center justify-center text-[#707a6c] hover:text-[#121c2a]" 
                    onClick={() => setShowPassword(!showPassword)} 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Konfirmasi Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[15px] sm:text-[17px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="confirm_password">
                  Konfirmasi Password / PIN
                  <span className="text-[#ba1a1a] text-[13px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">lock</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[15px] sm:text-[16px] rounded-lg pl-12 pr-12 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="confirm_password" 
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Ulangi password yang sama" 
                    required 
                    type={showConfirmPassword ? "text" : "password"} 
                  />
                  <button 
                    aria-label="Lihat konfirmasi kata sandi" 
                    className="absolute right-3 w-8 h-8 flex items-center justify-center text-[#707a6c] hover:text-[#121c2a]" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Pernyataan & Persetujuan Warga */}
            <div className="bg-[#eff4ff] p-4 rounded-xl mt-2">
              <label className="flex items-start gap-3.5 cursor-pointer">
                <input className="w-5 h-5 mt-0.5 rounded text-[#0d631b] focus:ring-[#0d631b] flex-shrink-0 cursor-pointer accent-[#0d631b]" required type="checkbox" />
                <span className="text-[13px] sm:text-[14px] text-[#121c2a] leading-snug">
                  Saya menyatakan bahwa data yang diisikan adalah benar warga <strong>Desa Ngrowo</strong> dan bersedia diverifikasi oleh tim bansos desa.
                </span>
              </label>
            </div>

            {/* Tombol Aksi Utama */}
            <div className="flex flex-col gap-3 mt-2">
              <button 
                disabled={isLoading}
                className={`w-full h-[52px] ${
                  isLoading ? 'bg-emerald-400 cursor-not-allowed' : 'bg-[#0d631b] hover:bg-[#2e7d32]'
                } text-white rounded-xl text-[16px] sm:text-[18px] font-semibold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer`}
                type="submit"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Mendaftarkan Data...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Akun Sekarang</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </>
                )}
              </button>

              {/* Tautan Masuk (Balik ke Login) */}
              <div className="text-center py-2">
                <p className="text-[14px] sm:text-[15px] text-[#40493d]">
                  Sudah punya akun SI-BANSOS?{' '}
                  <Link className="text-[#0d631b] font-bold underline hover:text-[#2e7d32] ml-1" to="/login">
                    Masuk Sekarang
                  </Link>
                </p>
              </div>
            </div>
          </form>

          {/* Support Card for Seniors & Assisted Registration */}
          <aside className="mt-6 bg-[#e6eeff] rounded-xl p-5 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-white text-[#0d631b] flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-[24px]">support_agent</span>
              </div>
              <div>
                <h4 className="text-[15px] sm:text-[16px] font-semibold text-[#121c2a]">Mengalami Kendala Pendaftaran Mandiri?</h4>
                <p className="text-[13px] sm:text-[14px] text-[#40493d] mt-1 leading-relaxed">
                  Warga lansia atau yang terkendala akses digital dapat mendaftar langsung di <strong>Kantor Balai Desa Ngrowo</strong> setiap hari kerja (08.00 - 15.00 WIB) atau meminta pendampingan kepada <strong>Ketua RT setempat</strong>.
                </p>
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}