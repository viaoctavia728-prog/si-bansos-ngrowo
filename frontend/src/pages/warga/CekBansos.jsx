import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WargaSidebar from '../../components/WargaSidebar';
import WargaMain from '../../components/WargaMain';
import { bansosService } from '../../services/api';
import { authService } from '../../services/auth';

const ALL_MASTER_PROGRAMS = [
  { name: 'PKH', fullName: 'Program Keluarga Harapan', icon: 'diversity_1', defaultPeriod: 'Tahap 4 • Triwulan IV 2026' },
  { name: 'BPNT', fullName: 'Bantuan Pangan Non-Tunai (Sembako)', icon: 'shopping_bag', defaultPeriod: 'Penyaluran Tiap Bulan' },
  { name: 'BLT Desa', fullName: 'Bantuan Langsung Tunai Dana Desa', icon: 'payments', defaultPeriod: 'Rp 300.000 / Bulan' },
  { name: 'BST', fullName: 'Bantuan Sosial Tunai', icon: 'account_balance_wallet', defaultPeriod: 'Sesuai periode penyaluran' },
  { name: 'Bansos Beras CPP', fullName: 'Cadangan Pangan Pemerintah 10 Kg', icon: 'inventory_2', defaultPeriod: 'Alokasi Bulanan Balai Desa' },
];

export default function CekBansos() {
  const currentUser = authService.getCurrentUser();
  const [searchNik, setSearchNik] = useState(currentUser?.nik || '3524011111110001');
  const [dataPenerima, setDataPenerima] = useState([]);
  const [selectedPenerima, setSelectedPenerima] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lakukan pencarian ke backend
  const handleSearch = async (nikToSearch = searchNik) => {
    const cleanNik = (nikToSearch || '').trim();

    if (!cleanNik) {
      setErrorMsg('Masukkan NIK yang ingin dicari!');
      setDataPenerima([]);
      setSelectedPenerima(null);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setHasSearched(true);

    try {
      let results = await bansosService.cekBansosByNik(cleanNik);

      if (!results || results.length === 0) {
        results = await bansosService.getPenerimaBansos({ search: cleanNik });
      }

      setDataPenerima(results || []);
      if (results && results.length > 0) {
        setSelectedPenerima(results[0]);
      } else {
        setSelectedPenerima(null);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengambil data dari server.');
      setDataPenerima([]);
      setSelectedPenerima(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Otomatis cari saat halaman pertama kali dimuat
  useEffect(() => {
    if (searchNik && searchNik.trim()) {
      handleSearch(searchNik);
    }
  }, []);

  // Format sensor NIK untuk privasi warga publik
  const maskNik = (nik) => {
    if (!nik || nik.length < 10) return nik;
    return nik.substring(0, 6) + '******' + nik.substring(nik.length - 4);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <WargaSidebar />
      <WargaMain>
      
      {/* HEADER UTAMA */}
      <Header title="Cek Status Bansos" backTo="/dashboard" />

      {/* KONTEN UTAMA */}
      <main className="flex-1 pb-24 lg:pb-10">
        <div className="flex flex-col w-full">
          <div className="warga-content flex flex-col gap-4 pt-5 pb-8 sm:gap-5 sm:pt-7">
            
            {/* SEARCH BOX FORM */}
            <div className="gov-card p-4 sm:p-5">
              <label htmlFor="input_cari_nik" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Cari Status Bansos Berdasarkan NIK</span>
                <span className="rounded-full border border-emerald-200 bg-primary-soft px-2.5 py-0.5 text-[11px] font-semibold text-primary">Database Resmi</span>
              </label>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch(searchNik);
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                    id_card
                  </span>
                  <input
                    id="input_cari_nik"
                    type="text"
                    value={searchNik}
                    onChange={(e) => setSearchNik(e.target.value)}
                    placeholder="Masukkan 16 digit NIK..."
                    className="w-full pl-10 pr-3 py-2.5 text-sm font-medium text-[#0F172A] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#166534] hover:bg-[#166534] active:scale-95 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">search</span>
                  )}
                  <span>Cek</span>
                </button>
              </form>

              {/* Quick Sample NIKs */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] text-slate-500">
                <span className="shrink-0 font-medium">Contoh NIK:</span>
                <button 
                  type="button"
                  onClick={() => { setSearchNik('3524011111110001'); handleSearch('3524011111110001'); }} 
                  className="bg-slate-100 hover:bg-emerald-100 hover:text-[#166534] px-2 py-0.5 rounded font-mono transition-colors"
                >
                  35240111111100**
                </button>
                
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-700 flex items-start gap-2">
                <span className="material-symbols-outlined text-red-600 text-[18px] shrink-0 mt-0.5">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* HASIL PENCARIAN DITEMUKAN */}
            {selectedPenerima && (
              <>
                {/* KARTU NIK & STATUS DTKS */}
                <div className="bg-[#F9FAFB] border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#166534] text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      verified
                    </span>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500 uppercase leading-none">Data Kependudukan</p>
                      <p className="text-[14px] font-bold text-[#0F172A] mt-1 font-mono">
                        NIK: {maskNik(selectedPenerima.nik_penerima)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-[#166534] text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                    Terdata DTKS
                  </span>
                </div>

                {/* KARTU RINGKASAN PENERIMA MANFAAT */}
                <div className="gov-card p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#166534] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]">person</span>
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-slate-500 leading-none">Nama Penerima Manfaat</p>
                        <h3 className="text-[17px] font-bold text-[#0F172A] mt-1 leading-tight">
                          {selectedPenerima.nama_penerima}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-mono">
                        KK: {selectedPenerima.no_kk ? maskNik(selectedPenerima.no_kk) : '352401******'}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-[12px]">
                      <span className="font-medium text-amber-900">Desil kesejahteraan</span>
                      <span className="font-bold text-amber-900">Desil {selectedPenerima.desil ?? '-'}</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600 text-[13px]">
                      <span className="material-symbols-outlined text-[18px] text-[#166534] mt-0.5">location_on</span>
                      <span className="font-medium leading-snug">
                        RT {selectedPenerima.rt} / RW {selectedPenerima.rw}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[12px] text-slate-500 pt-1">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">schedule</span>
                        <span>Tahun Periode Bantuan:</span>
                      </div>
                      <span className="font-semibold text-slate-800">Tahun {selectedPenerima.periode_tahun || 2026}</span>
                    </div>
                    {Number(selectedPenerima.desil) >= 4 && (
                      <Link
                        to="/pengaduan"
                        state={{ kategoriAduan: 'Desil Tidak Sesuai', program: 'Desil Tidak Sesuai', nikTerlapor: selectedPenerima.nik_penerima }}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900 hover:bg-amber-100"
                      >
                        <span className="material-symbols-outlined text-[17px]">flag</span>
                        Laporkan ketidaksesuaian desil
                      </Link>
                    )}
                  </div>
                </div>

                {/* HEADER DAFTAR PROGRAM BANSOS */}
                <div className="flex items-center justify-between pt-2 px-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[17px] sm:text-[18px] font-bold text-[#0F172A]">Program Bansos Warga</h2>
                    <span className="bg-emerald-100 text-[#166534] text-[12px] font-bold px-2.5 py-0.5 rounded-full">
                      {dataPenerima.length} Aktif
                    </span>
                  </div>
                  <span className="text-[12px] font-medium text-[#166534] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#166534] inline-block animate-pulse"></span>
                    Database MySQL Aktif
                  </span>
                </div>

                {/* DAFTAR PROGRAM BANSOS (DYNAMIC DARI DATABASE) */}
                <div className="flex flex-col gap-3">
                  {ALL_MASTER_PROGRAMS.map((program) => {
                    // Cek apakah NIK ini terdaftar pada program ini di database
                    const isReceived = dataPenerima.some(
                      (p) => p.jenis_bansos?.toLowerCase().includes(program.name.toLowerCase())
                    );
                    const matchedRecord = dataPenerima.find(
                      (p) => p.jenis_bansos?.toLowerCase().includes(program.name.toLowerCase())
                    );

                    return (
                      <div 
                        key={program.name} 
                        className={`bg-white border rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex flex-col gap-3 transition-all ${
                          isReceived ? 'border-emerald-200 ring-1 ring-emerald-50' : 'border-slate-200 opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              isReceived ? 'bg-emerald-100 text-[#166534]' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <span className="material-symbols-outlined text-[22px]">{program.icon}</span>
                            </div>
                            <div>
                              <h4 className="text-[15px] font-bold text-[#0F172A] leading-tight">{program.name}</h4>
                              <p className="text-[12px] text-slate-500">{program.fullName}</p>
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-1 text-[11px] sm:text-[12px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                            isReceived 
                              ? 'bg-emerald-50 border border-emerald-200 text-[#166534]' 
                              : 'bg-slate-100 border border-slate-200 text-slate-500'
                          }`}>
                            <span className="material-symbols-outlined text-[14px]">
                              {isReceived ? 'check_circle' : 'do_not_disturb_on'}
                            </span>
                            {isReceived ? 'Aktif Menerima' : 'Belum Terdaftar'}
                          </span>
                        </div>

                        <div className="bg-[#F9FAFB] rounded-lg p-2.5 text-[12px] sm:text-[13px] flex items-center justify-between">
                          <span className="text-slate-500">Keterangan:</span>
                          <span className={isReceived ? 'font-bold text-[#166534]' : 'font-medium text-slate-500'}>
                            {isReceived 
                              ? `Periode ${matchedRecord?.periode_tahun || 2026} • Status: ${matchedRecord?.status_penerima || 'Aktif'}` 
                              : 'Tidak tercatat dalam kuota bansos'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* HASIL PENCARIAN KOSONG (NOT FOUND) */}
            {!isLoading && hasSearched && !selectedPenerima && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 text-center flex flex-col items-center">
                <div className="w-14 h-14 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-[30px]">search_off</span>
                </div>
                <h3 className="text-base font-bold text-[#0F172A]">Data NIK Belum Terdaftar</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm leading-relaxed">
                  NIK <code className="font-mono font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-amber-200">{searchNik}</code> tidak ditemukan dalam daftar penerima bantuan sosial aktif di Kelurahan Ngrowo.
                </p>
                <div className="mt-4 pt-3 border-t border-amber-200/60 w-full flex flex-col gap-2">
                  <p className="text-xs text-amber-900 font-medium">Merasa memenuhi syarat DTKS atau ada ketidaksesuaian?</p>
                  <Link
                    to="/pengaduan"
                    className="inline-flex items-center justify-center gap-1.5 bg-[#166534] hover:bg-[#166534] text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all"
                  >
                    <span>Ajukan Usulan / Pengaduan Bansos</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}

            {/* INFORMASI PENYALURAN RESMI */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 mt-1">
              <span className="material-symbols-outlined text-[#166534] text-[22px] shrink-0 mt-0.5">info</span>
              <div className="text-[13px]">
                <p className="font-bold text-[#0F172A] mb-0.5">Ketentuan Pengambilan Bantuan</p>
                <p className="text-slate-500 leading-relaxed">
                  Penyaluran bantuan dilakukan dengan verifikasi biometrik atau pencocokan KTP-el dan Kartu Keluarga asli di Balai Desa Ngrowo atau loket penyalur resmi.
                </p>
              </div>
            </div>

            {/* TOMBOL AJUKAN SANGGAHAN */}
            <div className="sticky bottom-2 z-20 pt-2">
              <Link 
                to="/pengaduan" 
                className="w-full min-h-[50px] bg-[#166534] hover:bg-[#15803D] active:scale-[0.99] text-white font-bold text-[14px] sm:text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Data Tidak Sesuai? Ajukan Sanggahan Warga</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </Link>
            </div>

          </div>
        </div>
      </main>

      <Footer />
      </WargaMain>
    </div>
  );
}