import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Jadwal() {
  const [downloadState, setDownloadState] = useState('default'); // 'default' | 'loading' | 'success'

  const handleDownload = () => {
    if (downloadState !== 'default') return;
    setDownloadState('loading');
    setTimeout(() => {
      setDownloadState('success');
      setTimeout(() => {
        setDownloadState('default');
      }, 2500);
    }, 1200);
  };

  const handleMapClick = () => {
    alert('Navigasi ke Balai Desa Ngrowo siap dibuka di aplikasi peta Anda.');
  };

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen bg-[#f8f9ff]">
      
      {/* HEADER UTAMA */}
      <Header title="Jadwal" eyebrow="Desa Ngrowo, Bojonegoro" backTo="/dashboard" />

      {/* KONTEN UTAMA */}
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface min-h-screen">
        <div className="flex flex-col w-full">
          <div className="px-4 pt-3 pb-8 flex flex-col gap-4 max-w-lg mx-auto w-full">
            
            {/* Status Tahap & Penyaluran */}
            <div className="flex items-center justify-between gap-2">
              <div 
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold" 
                style={{ backgroundColor: '#F0F5F2', color: '#1B4D3E', border: '1px solid #DCE7E1' }}
              >
                <span className="material-symbols-outlined text-[15px]">verified</span> 
                Tahap II - 2026
              </div>
              <span className="text-[12px] font-medium text-gray-500">Penyaluran Reguler</span>
            </div>

            {/* KARTU INFORMASI PAKET BANSOS */}
            <section className="rounded-2xl p-5 bg-white flex flex-col gap-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#F0F5F2] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Paket Bansos</span>
                    <h2 className="text-[15px] font-bold text-gray-900 leading-tight">Beras CPP 10 Kg / KPM</h2>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#1B4D3E]">
                  Gratis
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {/* Tanggal */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                    <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium leading-none">Hari &amp; Tanggal</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-1">Sabtu, 18 November 2026</span>
                  </div>
                </div>

                {/* Waktu */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium leading-none">Waktu Pengambilan</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-1">08.00 - 12.00 WIB (Sesuai Gelombang RT)</span>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium leading-none">Lokasi Titik Kumpul</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-1">Balai Desa Ngrowo (Pendopo Utama)</span>
                    <span className="text-[12px] text-gray-500 mt-0.5">Jl. Rajawali No. 12, Krajan, Ngrowo</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SESI & KUOTA PENGAMBILAN (PER RT) */}
            <section className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-gray-900">Sesi &amp; Kuota Pengambilan (Per RT)</h3>
                <span className="text-[12px] font-semibold text-[#1B4D3E]">Total: 222 KPM</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* RT 01 */}
                <div className="rounded-xl p-3.5 bg-white flex flex-col justify-between transition-shadow hover:shadow-sm border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-900">RT 01</span>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#F0F5F2] text-[#1B4D3E]">1</span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1">
                    <span className="text-[22px] font-extrabold text-[#1B4D3E]">124</span>
                    <span className="text-[12px] text-gray-500 font-medium">KPM</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-gray-500 text-[11px] font-medium pt-2 border-t border-gray-100">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>08.00 - 10.00 WIB</span>
                  </div>
                </div>

                {/* RT 02 */}
                <div className="rounded-xl p-3.5 bg-white flex flex-col justify-between transition-shadow hover:shadow-sm border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-bold text-gray-900">RT 02</span>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-[#F0F5F2] text-[#1B4D3E]">2</span>
                  </div>
                  <div className="mt-2.5 flex items-baseline gap-1">
                    <span className="text-[22px] font-extrabold text-[#1B4D3E]">98</span>
                    <span className="text-[12px] text-gray-500 font-medium">KPM</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-gray-500 text-[11px] font-medium pt-2 border-t border-gray-100">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    <span>10.00 - 12.00 WIB</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SYARAT WAJIB DIBAWA */}
            <section className="rounded-2xl p-4 bg-white flex flex-col gap-3 border border-gray-200 shadow-sm">
              <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#1B4D3E]">fact_check</span> 
                Syarat Wajib Dibawa Saat Hadir
              </h3>
              <ul className="flex flex-col gap-2.5">
                <li className="flex items-start gap-2.5 text-[13px] text-gray-700 leading-snug">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-[#1B4D3E]">check_circle</span>
                  <span><strong>e-KTP Asli</strong> penerima bantuan (bukan fotokopi).</span>
                </li>
                <li className="flex items-start gap-2.5 text-[13px] text-gray-700 leading-snug">
                  <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5 text-[#1B4D3E]">check_circle</span>
                  <span><strong>Surat Undangan barcode resmi</strong> dari RT/RW atau Kartu Bansos Desa.</span>
                </li>
              </ul>
            </section>

            {/* CATATAN RAMAH LANSIA */}
            <div className="rounded-xl p-3.5 bg-white flex items-start gap-3 border border-gray-200 shadow-sm">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-[#F0F5F2] text-[#1B4D3E]">
                <span className="material-symbols-outlined text-[18px]">elderly</span>
              </div>
              <div className="flex flex-col">
                <h4 className="text-[13px] font-bold text-gray-900">Catatan Ramah Lansia &amp; Disabilitas</h4>
                <p className="text-[12px] text-gray-600 mt-0.5 leading-relaxed">
                  Warga lansia atau berkebutuhan khusus yang berhalangan hadir dapat diwakilkan oleh anggota keluarga dalam 1 KK dengan membawa KK asli dan KTP asli penerima.
                </p>
              </div>
            </div>

            {/* TOMBOL AKSI UTAMA */}
            <div className="flex flex-col gap-2.5 pt-1">
              <button 
                type="button" 
                onClick={handleMapClick}
                className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm bg-[#1B4D3E]"
              >
                <span className="material-symbols-outlined text-[20px]">directions</span>
                <span>Petunjuk Arah Balai Desa</span>
              </button>

              <button 
                type="button" 
                onClick={handleDownload}
                className="w-full h-12 rounded-xl text-[14px] font-semibold bg-white flex items-center justify-center gap-2 active:scale-[0.99] transition-all border border-gray-200 text-[#1B4D3E]"
              >
                {downloadState === 'loading' && (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                    <span>Mengunduh Dokumen PDF...</span>
                  </>
                )}
                {downloadState === 'success' && (
                  <>
                    <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
                    <span>Dokumen Tersimpan di HP</span>
                  </>
                )}
                {downloadState === 'default' && (
                  <>
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    <span>Unduh Jadwal &amp; Daftar Warga</span>
                  </>
                )}
              </button>
            </div>

            {/* PETA LOKASI PENYALURAN */}
            <section className="rounded-2xl p-4 bg-white flex flex-col gap-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-gray-900">Peta Lokasi Penyaluran</span>
                <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold hover:underline flex items-center gap-1 text-[#1B4D3E]">
                  <span>Buka Google Maps</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
              <div 
                className="w-full h-36 bg-cover bg-center rounded-xl relative overflow-hidden flex items-end p-2.5 border border-gray-200" 
                style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCPbIG6my3LeeCE7RX5628o_I4ySok_hYf0h6exkFweuR0VzBfwoYtCMZ2EMG2eQFjgsAzowaasRmnhSNv5r0FiKDTkvTwlrMWmPb-_nXa3_mCpz0n0a1MmllO-U5-8LPEcokQdgZaeLv18hvs-KJguXRSW8L-1qz1ZEgSv8Dw2WNBnwEVzSLq5PWSIeIv5F2XJ1MOYIb4LZ7PiM8GGtl8mGHbQA5rxDK-zAdIwhtDnq9h0oF10j8ne')` }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 shadow-sm border border-gray-100">
                  <span className="material-symbols-outlined text-[16px] text-[#1B4D3E]">pin_drop</span>
                  <span className="text-[12px] text-gray-900 font-semibold">Pendopo Utama Desa Ngrowo</span>
                </div>
              </div>
            </section>

            {/* BANTUAN POSKO BANSOS */}
            <Link to="/pengaduan" className="flex items-center justify-between p-3.5 bg-white rounded-xl transition-all hover:bg-gray-50 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#F0F5F2] text-[#1B4D3E]">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-gray-900">Nama belum terdaftar?</span>
                  <span className="text-[11px] text-gray-500">Hubungi atau lapor ke Posko Bansos Desa Ngrowo</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400 text-[20px]">chevron_right</span>
            </Link>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}