import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const programs = [
  {
    name: 'PKH',
    fullName: 'Program Keluarga Harapan',
    status: 'Aktif Menerima',
    icon: 'diversity_1',
    detailLabel: 'Keterangan Periode:',
    detailValue: 'Tahap 2 • April - Juni 2024'
  },
  {
    name: 'BPNT',
    fullName: 'Bantuan Pangan Non-Tunai',
    status: 'Aktif Menerima',
    icon: 'shopping_bag',
    detailLabel: 'Mekanisme Penyaluran:',
    detailValue: 'E-Warong Balai Desa Ngrowo'
  },
  {
    name: 'BLT Dana Desa',
    fullName: 'Bantuan Langsung Tunai Desa',
    status: 'Aktif Menerima',
    icon: 'payments',
    detailLabel: 'Nominal Bantuan:',
    detailValue: 'Rp 300.000 / Bulan',
    isBoldValue: true
  },
  {
    name: 'Bansos Prov Jatim',
    fullName: 'Sosial Provinsi Jawa Timur',
    status: 'Belum Terdaftar',
    icon: 'apartment',
    detailLabel: 'Status / Catatan:',
    detailValue: 'Kuota wilayah terisi penuh'
  },
  {
    name: 'Bansos Kab Bojonegoro',
    fullName: 'Bantuan Pemkab Bojonegoro',
    status: 'Belum Terdaftar',
    icon: 'location_city',
    detailLabel: 'Status / Kriteria:',
    detailValue: 'Tidak memenuhi kriteria penerima'
  }
];

export default function CekBansos() {
  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen bg-white" style={{ color: 'rgb(17, 24, 39)' }}>
      
      {/* HEADER UTAMA */}
      <Header title="Cek Status Bansos" backTo="/dashboard" />

      {/* KONTEN UTAMA */}
      <main className="flex flex-col relative w-full pt-16 pb-24 bg-surface min-h-screen" style={{ paddingTop: '64px', paddingBottom: '96px', backgroundColor: '#ffffff' }}>
        <div className="flex flex-col w-full">
          <div className="px-4 pt-4 pb-8 flex flex-col gap-4 max-w-lg mx-auto w-full">
            
            {/* KARTU NIK & STATUS DTKS */}
            <div className="bg-[#F9FAFB] border border-gray-200 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[#1B4D3E] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <div>
                  <p className="text-[11px] font-medium text-gray-500 uppercase leading-none">Data Kependudukan</p>
                  <p className="text-[14px] font-bold text-gray-900 mt-1">NIK: 352201******0804</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-[#1B4D3E] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                Terdata DTKS
              </span>
            </div>

            {/* KARTU RINGKASAN PENERIMA MANFAAT */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#1B4D3E] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[24px]">person</span>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-gray-500 leading-none">Nama Penerima Manfaat</p>
                    <h3 className="text-[17px] font-bold text-gray-900 mt-1 leading-tight">Si*** Ah***</h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block text-[11px] font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                    KK: Bpk. Su***
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                <div className="flex items-start gap-2 text-gray-700 text-[13px]">
                  <span className="material-symbols-outlined text-[18px] text-[#1B4D3E] mt-0.5">location_on</span>
                  <span className="font-medium leading-snug">RT 02 / RW 01, Dusun Ngrowo, Desa Ngrowo</span>
                </div>
                <div className="flex items-center justify-between text-[12px] text-gray-500 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
                    <span>Sinkronisasi Data:</span>
                  </div>
                  <span className="font-semibold text-gray-800">01 Mei 2024, 08:30 WIB</span>
                </div>
              </div>
            </div>

            {/* HEADER DAFTAR PROGRAM BANSOS */}
            <div className="flex items-center justify-between pt-2 px-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-gray-900">Daftar Program Bansos</h2>
                <span className="bg-emerald-100 text-[#1B4D3E] text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                  {programs.length} Program
                </span>
              </div>
              <span className="text-[12px] font-medium text-[#1B4D3E] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1B4D3E] inline-block animate-pulse"></span>
                Server Aktif
              </span>
            </div>

            {/* DAFTAR PROGRAM BANSOS (GRID/LIST) */}
            <div className="flex flex-col gap-3">
              {programs.map((item) => {
                const isActive = item.status === 'Aktif Menerima';
                return (
                  <div 
                    key={item.name} 
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-emerald-50 text-[#1B4D3E]' : 'bg-gray-100 text-gray-500'}`}>
                          <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                        </div>
                        <div>
                          <h4 className="text-[15px] font-bold text-gray-900 leading-tight">{item.name}</h4>
                          <p className="text-[12px] text-gray-500">{item.fullName}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[12px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                        isActive 
                          ? 'bg-emerald-50 border border-emerald-200 text-[#1B4D3E]' 
                          : 'bg-rose-50 border border-rose-200 text-rose-700'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {isActive ? 'check_circle' : 'cancel'}
                        </span>
                        {item.status}
                      </span>
                    </div>

                    <div className="bg-[#F9FAFB] rounded-lg p-2.5 text-[13px] flex items-center justify-between">
                      <span className="text-gray-500">{item.detailLabel}</span>
                      <span className={item.isBoldValue ? 'font-bold text-[#1B4D3E]' : 'font-semibold text-gray-900'}>
                        {item.detailValue}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* INFORMASI PENYALURAN */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3 mt-1">
              <span className="material-symbols-outlined text-[#1B4D3E] text-[22px] shrink-0 mt-0.5">info</span>
              <div className="text-[13px]">
                <p className="font-bold text-gray-900 mb-0.5">Informasi Penyaluran</p>
                <p className="text-gray-600 leading-relaxed">
                  Saat pengambilan bantuan di Balai Desa atau agen resmi, warga penerima wajib membawa KTP Elektronik asli dan Kartu Keluarga (KK).
                </p>
              </div>
            </div>

            {/* TOMBOL AJUKAN SANGGAHAN */}
            <div className="sticky bottom-2 z-20 pt-2">
              <Link 
                to="/pengaduan" 
                className="w-full min-h-[52px] h-[52px] bg-[#1B4D3E] hover:bg-[#153e32] active:scale-[0.99] text-white font-bold text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Data Tidak Sesuai? Ajukan Sanggahan</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}