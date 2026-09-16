import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="bg-[#f8f9ff] font-body-md text-[#121c2a] min-h-screen flex flex-col justify-between selection:bg-[#acf4a4]">
      
      {/* HEADER / NAVBAR ATAS */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-white border-b border-gray-200 shadow-sm">
        <div className="h-16 px-5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[18px] shadow-sm bg-[#1B4D3E]">
              <span className="material-symbols-outlined text-[22px]">account_balance</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-[17px] font-bold tracking-tight text-[#121c2a] leading-tight">SI-BANSOS NGROWO</span>
              <span className="font-caption text-[12px] text-[#40493d] font-medium">Dashboard Warga Desa</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center text-[#121c2a] hover:bg-gray-50 transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="w-2 h-2 rounded-full absolute top-2 right-2 bg-[#1B4D3E]"></span>
            </button>
            <div className="w-10 h-10 rounded-full border-2 border-gray-200 overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzp9wMOczF7pUPB089obHKjwNwuyANTXh_cEV8zplzbU-o15cs7DKJpQoYkNkBq_XTSQBnOB9T4QyZ5pNN7fRC6OPrVyMZABOkZmor96pX2w6Xhp_JfuHT4c34AXCMAqZ8_zN2q9TohUymC82OCF1zZ4BN-mqGXKbjIE3QG_EdNl2UWBoQd9GsMcHz8ws03sb4WCxRw2f4cSyAXXq_A2PJcLUr7MstC65uLu6z7L7rZeqZadpuGa614U4vXtdQoio0_EprF4FG3Oojng" 
                alt="Foto Bu Siti" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>
        </div>
      </header>

      {/* KONTEN UTAMA */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-white min-h-screen">
        <div className="flex flex-col w-full">
          <div className="px-5 pt-4 flex flex-col gap-5">
            
            {/* Greetings & Status Warga */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col gap-1.5">
                <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-xs font-semibold border bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]">
                  <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span>Warga Terverifikasi • RT 02 / RW 01 Dusun Krajan</span>
                </div>
                <h1 className="text-[26px] font-bold tracking-tight text-[#121c2a]">Halo, Bu Siti!</h1>
                <p className="text-[14px] text-[#40493d]">Berikut ringkasan bantuan sosial dan layanan warga desa anda.</p>
              </div>
            </div>

            {/* Kartu Status Bantuan Aktif */}
            <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#1B4D3E]"></div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E8F5E9] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-[#40493d]">Program Bantuan Aktif</span>
                    <span className="text-[17px] font-bold text-[#121c2a] leading-tight mt-0.5">BLT Dana Desa (BLT-DD)</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-[#DCFCE7] border-[#BBF7D0] text-[#166534]">
                  <span className="w-2 h-2 rounded-full animate-pulse bg-[#166534]"></span>Tersalurkan
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] text-[#40493d]">Nominal Bantuan</span>
                  <span className="text-[18px] font-bold tracking-tight leading-snug text-[#1B4D3E]">
                    Rp 300.000 <span className="text-[13px] font-normal text-[#40493d]">/ Bulan</span>
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[11px] text-[#40493d]">Jadwal Pencairan Berikutnya</span>
                  <span className="text-[13px] font-semibold text-[#121c2a]">Tahap II: 14 Mei 2026</span>
                </div>
              </div>
            </div>

            {/* Banner Pengumuman Desa */}
            <div className="bg-white rounded-xl p-3.5 flex items-center gap-3.5 border border-gray-200 shadow-sm">
              <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#F3F4F6] text-[#1B4D3E]">
                <span className="material-symbols-outlined text-[22px]">campaign</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white leading-none bg-[#1B4D3E]">Pengumuman</span>
                  <span className="text-xs text-[#40493d]">Balai Desa</span>
                </div>
                <h2 className="text-[14px] font-bold text-[#121c2a] truncate mt-1">Jadwal Sembako Beras: Selasa Pagi di Pendopo</h2>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-[20px]">chevron_right</span>
            </div>

            {/* SECTION: Layanan Utama Warga */}
            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-[#121c2a]">Layanan Utama Warga</h2>
                <span className="text-xs text-[#40493d] font-medium">4 Menu Layanan</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Menu 1 */}
                <Link to="/cek-bansos" className="group flex items-start gap-3.5 bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-gray-300 transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors bg-[#E8F5E9] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[24px]">search_check</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-[#121c2a]">Cek Status Bansos</h3>
                      <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-[13px] text-[#40493d] mt-1 leading-relaxed">Ketik NIK untuk cek kepesertaan PKH, BPNT, dan BLT.</p>
                  </div>
                </Link>

                {/* Menu 2 */}
                <Link to="/pengaduan" className="group flex items-start gap-3.5 bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-gray-300 transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors bg-[#E8F5E9] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[24px]">edit_note</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-[#121c2a]">Ajukan Sanggahan</h3>
                      <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-[13px] text-[#40493d] mt-1 leading-relaxed">Laporkan ketidaktepatan sasaran atau usulkan warga baru.</p>
                  </div>
                </Link>

                {/* Menu 3 */}
                <Link to="/tracking" className="group flex items-start gap-3.5 bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-gray-300 transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors bg-[#E8F5E9] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[24px]">timeline</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-[#121c2a]">Tracking Laporan</h3>
                      <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-[13px] text-[#40493d] mt-1 leading-relaxed">Pantau tindak lanjut usulan oleh Ketua RT dan Balai Desa.</p>
                  </div>
                </Link>

                {/* Menu 4 */}
                <Link to="/info" className="group flex items-start gap-3.5 bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:border-gray-300 transition-all active:scale-[0.99]">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors bg-[#E8F5E9] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[24px]">menu_book</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[15px] font-bold text-[#121c2a]">Info Program Bansos</h3>
                      <span className="material-symbols-outlined text-gray-400 text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                    <p className="text-[13px] text-[#40493d] mt-1 leading-relaxed">Syarat penerima, jadwal sembako, &amp; kuota desa tahun 2026.</p>
                  </div>
                </Link>

              </div>
            </section>

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
        </div>
      </main>

      {/* BOTTOM NAVIGATION BAR (BOTTOM NAV) */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-white border-t border-gray-200 shadow-sm">
        <div className="flex justify-around items-center h-20 px-5">
          <Link aria-current="page" className="flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] relative text-[#1B4D3E]" to="/dashboard">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
            <span className="text-[12px] font-bold">Beranda</span>
            <span className="w-5 h-1 rounded-full absolute -bottom-1 bg-[#1B4D3E]"></span>
          </Link>
          <Link className="flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] text-[#40493d] hover:text-gray-900 transition-colors" to="/cek-bansos">
            <span className="material-symbols-outlined text-[24px]">search</span>
            <span className="text-[12px] font-medium">Cek Bansos</span>
          </Link>
          <Link className="flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] text-[#40493d] hover:text-gray-900 transition-colors" to="/pengaduan">
            <span className="material-symbols-outlined text-[24px]">edit_document</span>
            <span className="text-[12px] font-medium">Pengaduan</span>
          </Link>
          <Link className="flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[48px] text-[#40493d] hover:text-gray-900 transition-colors" to="/info">
            <span className="material-symbols-outlined text-[24px]">info</span>
            <span className="text-[12px] font-medium">Info</span>
          </Link>
        </div>
      </nav>

    </div>
  );
}