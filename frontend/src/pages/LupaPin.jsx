import React from 'react';
import { Link } from 'react-router-dom';

export default function LupaPin() {
  const handleSubmit = (event) => {
    event.preventDefault();
    window.alert('Silakan hubungi Admin Desa untuk reset PIN secara manual.');
  };

  return (
    <div className="bg-[#f8f9ff] font-body-md text-[#121c2a] min-h-screen flex flex-col justify-center items-center p-5">
      <main className="w-full max-w-md bg-white rounded-2xl border border-[#e6eeff] p-6 md:p-8 shadow-sm">
        
        {/* Tombol Kembali */}
        <Link to="/login" className="text-[14px] font-semibold text-[#0d631b] hover:text-[#2e7d32] inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Login
        </Link>

        {/* Header Icon & Title */}
        <div className="py-6 text-center">
          <div className="w-16 h-16 bg-[#acf4a4] rounded-full flex items-center justify-center mx-auto text-[#0d631b] shadow-sm mb-3">
            <span className="material-symbols-outlined text-[32px]">key</span>
          </div>
          <h1 className="text-[24px] font-bold text-[#121c2a]">Lupa Password / PIN?</h1>
          <p className="mt-1 text-[14px] text-[#40493d]">
            Masukkan NIK terdaftar untuk meminta bantuan reset akun ke Admin Desa Ngrowo.
          </p>
        </div>

        {/* Form NIK */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#121c2a]" htmlFor="nik_reset">
              Nomor Induk Kependudukan (NIK)
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-[#707a6c] text-[20px]">id_card</span>
              <input 
                id="nik_reset"
                required 
                maxLength="16" 
                className="h-12 w-full rounded-xl bg-[#eff4ff] text-[#121c2a] text-[16px] pl-12 pr-4 outline-none focus:bg-white transition-all border border-transparent focus:border-[#707a6c]" 
                placeholder="Masukkan 16 digit NIK" 
              />
            </div>
          </div>

          <button 
            type="submit"
            className="h-12 w-full rounded-xl bg-[#0d631b] hover:bg-[#2e7d32] text-white font-semibold text-[16px] shadow-md transition-transform active:scale-[0.99]"
          >
            Kirim Permintaan Reset
          </button>
        </form>

        {/* Bantuan WhatsApp Admin */}
        <a 
          href="https://wa.me/6285807078899" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 pt-5 border-t border-[#e6eeff] flex items-center justify-center gap-2 text-center text-[14px] font-semibold text-[#0d631b] hover:text-[#2e7d32]"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          Chat WhatsApp Admin Desa
        </a>

      </main>
    </div>
  );
}