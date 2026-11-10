import React from 'react';
import { Link } from 'react-router-dom';

export default function LupaPin() {
  const handleSubmit = (event) => {
    event.preventDefault();
    window.alert('Silakan hubungi Admin Desa untuk reset PIN secara manual.');
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-3 font-sans text-slate-900 sm:p-6">
      <main className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-card sm:p-8">
        
        {/* Tombol Kembali */}
        <Link to="/login" className="text-[14px] font-semibold text-[#2E7D32] hover:text-[#256828] inline-flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali ke Login
        </Link>

        {/* Header Icon & Title */}
        <div className="py-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <span className="material-symbols-outlined text-[32px]">key</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#212529]">Lupa Password / PIN?</h1>
          <p className="mt-1 text-[14px] text-slate-500">
            Masukkan NIK terdaftar untuk meminta bantuan reset akun ke Admin Desa Ngrowo.
          </p>
        </div>

        {/* Form NIK */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-semibold text-[#212529]" htmlFor="nik_reset">
              Nomor Induk Kependudukan (NIK)
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-4 text-slate-400 text-[20px]">id_card</span>
              <input 
                id="nik_reset"
                required 
                maxLength="16" 
                className="gov-input pl-12" 
                placeholder="Masukkan 16 digit NIK" 
              />
            </div>
          </div>

          <button 
            type="submit"
            className="gov-btn-primary w-full"
          >
            Kirim Permintaan Reset
          </button>
        </form>

        {/* Bantuan WhatsApp Admin */}
        <a 
          href="https://wa.me/6285807078899" 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-center text-[14px] font-semibold text-[#2E7D32] hover:text-[#256828]"
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          Chat WhatsApp Admin Desa
        </a>

      </main>
    </div>
  );
}