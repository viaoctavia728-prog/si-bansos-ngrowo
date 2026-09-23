import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { getCurrentUser } from '../api';

export default function Dashboard() {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  const firstName = user.nama_lengkap.trim().split(/\s+/)[0];

  return (
    <div className="min-h-screen bg-white font-body-md text-[#121c2a] selection:bg-[#acf4a4]">
      <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-3 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1B4D3E]/10 bg-[#E8F2EE] text-[#1B4D3E]">
              <span className="material-symbols-outlined text-[22px]">account_balance</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4D3E]">SI-BANSOS NGROWO</span>
              <span className="text-[18px] font-bold leading-tight text-gray-900">Dashboard Warga</span>
            </div>
          </div>
          <button aria-label="Notifikasi" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-[#121c2a] hover:bg-gray-50">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
        </div>
      </header>

      <main className="mx-auto min-h-screen w-full max-w-lg bg-[#f8f9ff] px-4 pb-24 pt-24">
        <div className="flex flex-col gap-5">
          <section className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="min-w-0 pr-3">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold text-gray-900">Halo, {firstName}!</h1>
                <span className="material-symbols-outlined text-[18px] text-[#1B4D3E]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="rounded-md bg-[#E8F2EE] px-2 py-1 text-[11px] font-semibold text-[#1B4D3E]">Warga Terverifikasi</span>
                <span className="truncate text-xs text-gray-500">• RT {user.rt}, RW {user.rw} Desa Ngrowo</span>
              </div>
            </div>
            <div className="relative shrink-0">
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-[#E8F2EE] bg-[#E8F2EE] text-xl font-bold text-[#1B4D3E]">{firstName.charAt(0).toUpperCase()}</div>
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-[#1B4D3E] ring-2 ring-white"></span>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-200 border-l-4 border-l-[#1B4D3E] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4D3E]">Program Bantuan Aktif</span>
                <h2 className="mt-0.5 text-xl font-bold leading-snug text-gray-900">BLT Dana Desa</h2>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#E8F2EE] px-2.5 py-1 text-xs font-bold text-[#1B4D3E]"><span className="h-2 w-2 rounded-full bg-[#1B4D3E]"></span>Tersalurkan</span>
            </div>
            <div className="flex flex-col rounded-xl border border-gray-100 bg-gray-50/80 p-3.5">
              <span className="text-xs font-medium text-gray-500">Nominal Manfaat Diterima</span>
              <div className="mt-0.5 flex items-baseline gap-1"><span className="text-2xl font-extrabold tracking-tight text-[#1B4D3E]">Rp 300.000</span><span className="text-xs font-semibold text-gray-500">/ Bulan</span></div>
            </div>
            <div className="flex items-center gap-2.5 rounded-lg border border-[#1B4D3E]/10 bg-[#F2F7F5] px-3 py-2 text-xs text-gray-600"><span className="material-symbols-outlined shrink-0 text-[18px] text-[#1B4D3E]">event_available</span><span>Jadwal Berikutnya: <strong className="text-gray-900">Penyaluran Tahap II: 14 Mei 2026</strong></span></div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-1"><Link className="inline-flex items-center gap-1 text-xs font-bold text-[#1B4D3E] hover:underline" to="/jadwal">Rincian Penyaluran Buku Kas <span className="material-symbols-outlined text-[16px]">arrow_forward</span></Link><span className="text-[11px] font-semibold text-gray-400">TA 2026</span></div>
          </section>

          <div className="flex items-center gap-3 rounded-xl border border-[#1B4D3E]/20 bg-[#E8F2EE]/60 p-3.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1B4D3E] text-white"><span className="material-symbols-outlined text-[20px]">calendar_month</span></div><div className="min-w-0"><span className="block truncate text-xs font-bold text-[#1B4D3E]">Musyawarah Desa (Musdes) Penyaluran</span><p className="mt-0.5 truncate text-[12px] text-gray-600">Kamis depan pukul 09.00 WIB di Pendopo Balai Desa</p></div></div>

          <section className="space-y-2.5 pt-1"><div className="flex items-center justify-between"><h2 className="text-sm font-bold tracking-tight text-gray-900">Layanan Utama Bansos</h2><span className="text-xs font-semibold text-gray-400">Pelayanan Terpadu</span></div><div className="grid grid-cols-2 gap-3">
                
                {/* Menu 1 */}
                <Link to="/cek-bansos" className="group flex min-h-[148px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#1B4D3E] hover:shadow">
                  <div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F2EE] text-[#1B4D3E]"><span className="material-symbols-outlined text-[24px]">search</span></div><span className="material-symbols-outlined text-[18px] text-gray-400">arrow_forward</span></div><div className="mt-3"><h3 className="text-sm font-bold leading-snug text-gray-900">Cek Status Bansos</h3><p className="mt-1 text-[12px] leading-tight text-gray-500">Periksa kepesertaan PKH, BPNT &amp; BLT</p></div>
                </Link>

                {/* Menu 2 */}
                <Link to="/pengaduan" className="group flex min-h-[148px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#1B4D3E] hover:shadow"><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F2EE] text-[#1B4D3E]"><span className="material-symbols-outlined text-[24px]">edit_note</span></div><span className="material-symbols-outlined text-[18px] text-gray-400">arrow_forward</span></div><div className="mt-3"><h3 className="text-sm font-bold leading-snug text-gray-900">Ajukan Sanggahan</h3><p className="mt-1 text-[12px] leading-tight text-gray-500">Laporkan ketidaktepatan penerima</p></div>
                </Link>

                {/* Menu 3 */}
                <Link to="/tracking" className="group flex min-h-[148px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#1B4D3E] hover:shadow"><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F2EE] text-[#1B4D3E]"><span className="material-symbols-outlined text-[24px]">query_stats</span></div><span className="material-symbols-outlined text-[18px] text-gray-400">arrow_forward</span></div><div className="mt-3"><h3 className="text-sm font-bold leading-snug text-gray-900">Tracking Laporan</h3><p className="mt-1 text-[12px] leading-tight text-gray-500">Pantau progres verifikasi aduan</p></div>
                </Link>

                {/* Menu 4 */}
                <Link to="/jadwal" className="group flex min-h-[148px] flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[#1B4D3E] hover:shadow"><div className="flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F2EE] text-[#1B4D3E]"><span className="material-symbols-outlined text-[24px]">event_note</span></div><span className="material-symbols-outlined text-[18px] text-gray-400">arrow_forward</span></div><div className="mt-3"><h3 className="text-sm font-bold leading-snug text-gray-900">Info Jadwal &amp; Syarat</h3><p className="mt-1 text-[12px] leading-tight text-gray-500">Jadwal sembako, syarat &amp; kuota</p></div>
                </Link>

          </div></section>

            {/* Kartu Kontak Pendamping Sosial */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                    <img 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzp9wMOczF7pUPB089obHKjwNwuyANTXh_cEV8zplzbU-o15cs7DKJpQoYkNkBq_XTSQBnOB9T4QyZ5pNN7fRC6OPrVyMZABOkZmor96pX2w6Xhp_JfuHT4c34AXCMAqZ8_zN2q9TohUymC82OCF1zZ4BN-mqGXKbjIE3QG_EdNl2UWBoQd9GsMcHz8ws03sb4WCxRw2f4cSyAXXq_A2PJcLUr7MstC65uLu6z7L7rZeqZadpuGa614U4vXtdQoio0_EprF4FG3Oojng" 
                      alt="Foto Pendamping Sosial" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-[#40493d] font-medium">Pendamping Sosial Desa</span>
                    <h4 className="text-[16px] font-bold text-[#121c2a] leading-tight">Mas Hendra Prabowo</h4>
                    <span className="text-[12px] font-semibold flex items-center gap-1 mt-0.5 text-[#1B4D3E]">
                      <span className="w-2 h-2 rounded-full bg-[#1B4D3E]"></span>Petugas Siaga di Balai Desa
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[13px] text-[#40493d] leading-relaxed">
                Butuh panduan pengisian formulir bansos atau ingin berkonsultasi langsung? Hubungi saluran resmi Balai Desa.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white text-[#121c2a] font-semibold text-[14px] hover:bg-gray-50 active:scale-[0.98] transition-all" href="tel:081234567890">
                  <span className="material-symbols-outlined text-[18px] text-[#1B4D3E]">call</span>
                  <span>Telepon Pak RT 02</span>
                </a>
                <a className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-semibold text-[14px] active:scale-[0.98] transition-all shadow-sm bg-[#1B4D3E]" href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>WhatsApp Balai Desa (0812-3456-7890)</span>
                </a>
              </div>
            </div>

            {/* Footer Text Copyright */}
            <div className="text-center py-2">
              <p className="text-[12px] text-[#40493d]">Pemerintah Desa Ngrowo • Sistem Akuntabel, Tepat Sasaran &amp; Transparan</p>
            </div>

          </div>
      </main>

      <Footer />
    </div>
  );
}