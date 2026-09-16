import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function DetailLaporan() {
  const [ticketInput, setTicketInput] = useState('ADU-20260901-0001');
  const [activeTicket, setActiveTicket] = useState('ADU-20260901-0001');

  const handleSearch = (e) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      setActiveTicket(ticketInput.trim());
    }
  };

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen bg-white" style={{ color: 'rgb(17, 24, 39)' }}>
      
      {/* HEADER UTAMA */}
      <Header title="Tracking Laporan" eyebrow="Layanan Aspirasi Desa" backTo="/pengaduan" />

      {/* KONTEN UTAMA */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-surface min-h-screen" style={{ paddingTop: '64px', paddingBottom: '112px', backgroundColor: '#ffffff' }}>
        <div className="flex flex-col w-full">
          <div className="px-4 pt-4 pb-8 flex flex-col gap-4 max-w-lg mx-auto w-full">
            
            {/* PENCARIAN TIKET */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-sm font-semibold text-gray-900" htmlFor="ticket">
                Cari Nomor Tiket Pengaduan
              </label>
              <form onSubmit={handleSearch} className="mt-2 flex gap-2">
                <input 
                  id="ticket" 
                  value={ticketInput} 
                  onChange={(event) => setTicketInput(event.target.value)} 
                  className="min-w-0 flex-1 h-12 rounded-xl border border-gray-200 px-4 text-[15px] focus:border-[#1B4D3E] focus:outline-none" 
                  placeholder="Masukkan nomor tiket..."
                />
                <button 
                  type="submit" 
                  className="rounded-xl bg-[#1b4d3e] hover:bg-[#153e32] px-5 font-semibold text-white transition-all active:scale-95 cursor-pointer"
                >
                  Cari
                </button>
              </form>
            </section>

            {/* STATUS INFORMASI TIKET */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
              <p className="text-xs text-gray-500 font-medium">Nomor Tiket Aduan</p>
              <h2 className="text-xl font-bold text-[#1b4d3e]">{activeTicket}</h2>
              <div>
                <span className="inline-block rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#1b4d3e] border border-emerald-100">
                  Sedang Diverifikasi
                </span>
              </div>
              <p className="mt-3 text-sm text-gray-600 font-medium">
                Ketidaktepatan Sasaran Bansos (Dusun Krajan)
              </p>
            </section>

            {/* PROGRES PENANGANAN */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Progres Penanganan</h2>
              <ol className="space-y-6 border-l-2 border-emerald-700 pl-5 ml-2">
                <li className="relative">
                  <div className="absolute -left-[27px] top-0 w-3 h-3 rounded-full bg-emerald-700 ring-4 ring-white"></div>
                  <strong className="block text-gray-900">Laporan Diterima</strong>
                  <span className="text-sm text-gray-500">Selesai pada 01 Sep 2026, 09:15 WIB</span>
                </li>
                <li className="relative">
                  <div className="absolute -left-[27px] top-0 w-3 h-3 rounded-full bg-emerald-700 ring-4 ring-white animate-pulse"></div>
                  <strong className="block text-[#1b4d3e] font-bold">Sedang Diverifikasi</strong>
                  <span className="text-sm text-gray-600">Petugas lapangan sedang melakukan pengecekan faktual ke lokasi.</span>
                </li>
                <li className="relative text-gray-400">
                  <div className="absolute -left-[27px] top-0 w-3 h-3 rounded-full bg-gray-300 ring-4 ring-white"></div>
                  <strong className="block">Musdes / Keputusan Final</strong>
                  <span className="text-sm">Menunggu hasil musyawarah desa bersama RT/RW.</span>
                </li>
              </ol>
            </section>

            {/* TOMBOL KEMBALI KE FORM */}
            <div className="pt-2">
              <Link 
                to="/pengaduan" 
                className="w-full h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold flex items-center justify-center transition-all"
              >
                ← Buat Pengaduan Baru
              </Link>
            </div>

          </div>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}