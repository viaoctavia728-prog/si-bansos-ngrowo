import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const form = new FormData(event.currentTarget);
    if (form.get('password') !== form.get('confirm_password')) {
      setError('Konfirmasi password/PIN tidak sama.');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest('/register', {
        method: 'POST',
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      navigate('/login', { state: { message: 'Pendaftaran berhasil. Silakan login dengan NIK dan PIN Anda.' } });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f8f9ff] font-body-md text-[#121c2a] min-h-screen flex flex-col justify-center items-center p-5">
      <main className="w-full max-w-xl bg-[#f8f9ff]">
        <div className="flex flex-col w-full pb-12">
          
          {/* Brand & Administrative Header */}
          <header className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-xl bg-white shadow-md flex items-center justify-center p-2">
                <img 
                  alt="Lambang Resmi Desa Ngrowo" 
                  className="w-full h-full object-contain" 
                  src="/logo_ngrowo.png" 
                />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-[#2e7d32] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                RESMI
              </span>
            </div>
            <span className="text-[14px] font-medium text-[#0d631b] tracking-wider uppercase">
              Sistem Informasi Bantuan Sosial
            </span>
            <h1 className="text-[28px] font-bold text-[#121c2a] mt-1">Daftar Akun Warga</h1>
            <p className="text-[16px] text-[#40493d] max-w-md mt-1">
              Pendaftaran Mandiri Layanan Bantuan Sosial &amp; Pengaduan Desa Ngrowo, Bojonegoro
            </p>
          </header>

          {/* Notice Callout (Civic Notice) */}
          <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#acf4a4] flex items-center justify-center flex-shrink-0 text-[#0d631b]">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
              </div>
              <div>
                <h4 className="text-[16px] font-semibold text-[#121c2a]">Pendaftaran Khusus Warga Desa Ngrowo</h4>
                <p className="text-[14px] text-[#40493d] mt-0.5 leading-relaxed">
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
                <h2 className="text-[20px] font-semibold text-[#121c2a]">1. Data Identitas Kependudukan</h2>
              </div>

              {/* Nama Lengkap */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[18px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="nama_lengkap">
                  Nama Lengkap (Sesuai KTP)
                  <span className="text-[#ba1a1a] text-[14px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">person</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="nama_lengkap" 
                    name="nama_lengkap"
                    placeholder="Contoh: Siti Aminah" 
                    required 
                    type="text" 
                  />
                </div>
                <p className="text-[14px] text-[#40493d]">Tulis nama lengkap tanpa singkatan berlebihan.</p>
              </div>

              {/* NIK */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[18px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="nik">
                  Nomor Induk Kependudukan (NIK)
                  <span className="text-[#ba1a1a] text-[14px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">id_card</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all tracking-wider border border-transparent focus:border-[#707a6c]" 
                    id="nik" 
                    name="nik"
                    inputMode="numeric"
                    maxLength="16" 
                    minLength="16"
                    placeholder="352201xxxxxxxxxx" 
                    pattern="[0-9]{16}"
                    required 
                    type="tel" 
                  />
                </div>
                <p className="text-[14px] text-[#40493d]">16 digit angka yang tertera pada e-KTP Bojonegoro.</p>
              </div>

              {/* No KK */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[18px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="no_kk">
                  Nomor Kartu Keluarga (KK)
                  <span className="text-[#ba1a1a] text-[14px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">diversity_3</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all tracking-wider border border-transparent focus:border-[#707a6c]" 
                    id="no_kk" 
                    name="no_kk"
                    inputMode="numeric"
                    maxLength="16" 
                    minLength="16"
                    placeholder="352201xxxxxxxxxx" 
                    pattern="[0-9]{16}"
                    required 
                    type="tel" 
                  />
                </div>
                <p className="text-[14px] text-[#40493d]">16 digit angka di bagian paling atas lembar Kartu Keluarga.</p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[2px] bg-[#e6eeff]"></div>

            {/* SECTION 2: Kontak & Domisili */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2">
                <span className="material-symbols-outlined text-[#0d631b] text-[24px]">home_pin</span>
                <h2 className="text-[20px] font-semibold text-[#121c2a]">2. Kontak &amp; Alamat Wilayah Domisili</h2>
              </div>

              {/* No WhatsApp */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[18px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="no_wa">
                  Nomor WhatsApp / Handphone
                  <span className="text-[#ba1a1a] text-[14px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">phone_iphone</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="no_wa" 
                    name="no_wa"
                    placeholder="Contoh: 081234567890" 
                    required 
                    type="tel" 
                  />
                </div>
                <p className="text-[14px] text-[#40493d]">
                  Penting: Digunakan untuk menerima notifikasi status bansos via WhatsApp atau SMS konfirmasi pencairan dana.
                </p>
              </div>

              {/* Cascading Wilayah */}
              <div className="flex flex-col gap-2">
                <span className="text-[18px] font-semibold text-[#121c2a] flex items-center gap-1">
                  Wilayah Domisili Desa Ngrowo
                  <span className="text-[#ba1a1a] text-[14px] font-medium">(Wajib)</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                  {/* RW */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[14px] font-semibold text-[#40493d]" htmlFor="rw">Rukun Warga (RW)</label>
                    <div className="relative flex items-center">
                      <select name="rw" className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg px-3 appearance-none outline-none focus:bg-white cursor-pointer border border-transparent focus:border-[#707a6c]" id="rw" required defaultValue="01">
                        <option disabled value="">Pilih RW</option>
                        <option value="01">RW 01</option>
                        <option value="02">RW 02</option>
                        <option value="03">RW 03</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 pointer-events-none text-[#707a6c]">arrow_drop_down</span>
                    </div>
                  </div>
                  {/* RT */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[14px] font-semibold text-[#40493d]" htmlFor="rt">Rukun Tetangga (RT)</label>
                    <div className="relative flex items-center">
                      <select name="rt" className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg px-3 appearance-none outline-none focus:bg-white cursor-pointer border border-transparent focus:border-[#707a6c]" id="rt" required defaultValue="02">
                        <option disabled value="">Pilih RT</option>
                        <option value="01">RT 01</option>
                        <option value="02">RT 02</option>
                        <option value="03">RT 03</option>
                        <option value="04">RT 04</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 pointer-events-none text-[#707a6c]">arrow_drop_down</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detail Alamat */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[18px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="detail_alamat">
                  Detail Alamat Lengkap
                  <span className="text-[#ba1a1a] text-[14px] font-medium">(Wajib)</span>
                </label>
                <textarea 
                  className="w-full bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg p-3.5 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                  id="detail_alamat" 
                  name="detail_alamat"
                  placeholder="Jalan / Gang / No. Rumah (Contoh: Jl. Balai Desa No. 12, RT 02 / RW 01)" 
                  required 
                  rows="3"
                ></textarea>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-[2px] bg-[#e6eeff]"></div>

            {/* SECTION 3: Keamanan Akun */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2">
                <span className="material-symbols-outlined text-[#0d631b] text-[24px]">lock_reset</span>
                <h2 className="text-[20px] font-semibold text-[#121c2a]">3. Keamanan Akun Warga</h2>
              </div>

              {/* Username */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[18px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="username">
                  Username
                  <span className="text-[#ba1a1a] text-[14px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">alternate_email</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg pl-12 pr-4 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="username" 
                    name="username"
                    placeholder="Buat username (contoh: sitiaminah02)" 
                    required 
                    type="text" 
                  />
                </div>
                <p className="text-[14px] text-[#40493d]">Gunakan huruf kecil dan angka tanpa spasi.</p>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[18px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="password">
                  Buat Password / PIN Akun
                  <span className="text-[#ba1a1a] text-[14px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">key</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg pl-12 pr-12 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="password" 
                    name="password"
                    placeholder="Minimal 6 karakter atau PIN angka" 
                    required 
                    type={showPassword ? "text" : "password"} 
                  />
                  <button 
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'} 
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
                <label className="text-[18px] font-semibold text-[#121c2a] flex items-center gap-1" htmlFor="confirm_password">
                  Konfirmasi Password / PIN
                  <span className="text-[#ba1a1a] text-[14px] font-medium">(Wajib)</span>
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[22px]">lock</span>
                  <input 
                    className="w-full h-12 bg-[#eff4ff] text-[#121c2a] text-[16px] rounded-lg pl-12 pr-12 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                    id="confirm_password" 
                    name="confirm_password"
                    placeholder="Ulangi password/PIN yang sama" 
                    required 
                    type={showConfirmPassword ? "text" : "password"} 
                  />
                  <button 
                    aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Lihat konfirmasi kata sandi'} 
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
                <input className="w-6 h-6 mt-0.5 rounded text-[#0d631b] focus:ring-[#0d631b] flex-shrink-0 cursor-pointer accent-[#0d631b]" required type="checkbox" />
                <span className="text-[16px] text-[#121c2a] leading-snug">
                  Saya menyatakan bahwa data yang diisikan adalah benar warga <strong>Desa Ngrowo</strong> dan bersedia divalidasi serta diverifikasi oleh tim verifikator desa.
                </span>
              </label>
            </div>

            {/* Tombol Aksi Utama */}
            <div className="flex flex-col gap-3 mt-2">
              {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}
              <button disabled={isSubmitting} className="w-full h-[52px] bg-[#0d631b] hover:bg-[#2e7d32] disabled:opacity-60 text-white rounded-lg text-[18px] font-semibold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-[0.99]" type="submit">
                <span>{isSubmitting ? 'Menyimpan...' : 'Daftar Akun Sekarang'}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>

              {/* Tautan Masuk (Balik ke Login) */}
              <div className="text-center py-2">
                <p className="text-[16px] text-[#40493d]">
                  Sudah punya akun SI-BANSOS?{' '}
                  <Link className="text-[#0d631b] font-semibold underline hover:text-[#2e7d32] ml-1" to="/login">
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
                <h4 className="text-[16px] font-semibold text-[#121c2a]">Mengalami Kendala Pendaftaran Mandiri?</h4>
                <p className="text-[16px] text-[#40493d] mt-1 leading-relaxed">
                  Warga lansia, penyandang disabilitas, atau yang terkendala akses digital dapat mendaftar langsung di <strong>Kantor Balai Desa Ngrowo</strong> setiap senin-kamis (08.00 - 15.00 WIB) atau meminta pendampingan kepada <strong>Ketua RT setempat</strong>.
                </p>
                <div className="mt-3 flex items-center gap-2 text-[#0d631b] font-semibold text-[14px]">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                  <span>Balai Desa Ngrowo, Jl. Meliwis Putih Gg.Balong Kec. Bojonegoro</span>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}