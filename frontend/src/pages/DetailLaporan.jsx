import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { pengaduanService } from '../services/api';

export default function DetailLaporan() {
  const [searchParams] = useSearchParams();
  const initialTicket = searchParams.get('tiket') || 'ADU-';
  
  const [ticketInput, setTicketInput] = useState(initialTicket === 'ADU-' ? '' : initialTicket);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searched, setSearched] = useState(false);

  const fetchTracking = async (ticket) => {
    if (!ticket || !ticket.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setSearched(true);

    try {
      const data = await pengaduanService.tracking(ticket.trim());
      setReportData(data);
    } catch (err) {
      setErrorMsg(err.message || 'Nomor tiket tidak ditemukan dalam database.');
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialTicket && initialTicket !== 'ADU-') {
      fetchTracking(initialTicket);
    }
  }, [initialTicket]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      fetchTracking(ticketInput.trim());
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'selesai':
        return <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full border border-green-200">Selesai Ditindaklanjuti</span>;
      case 'proses':
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">Sedang Diverifikasi</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full border border-amber-200">Menunggu Verifikasi (Pending)</span>;
    }
  };

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen bg-white" style={{ color: 'rgb(17, 24, 39)' }}>
      
      {/* HEADER UTAMA */}
      <Header title="Tracking Laporan" eyebrow="Layanan Aspirasi Desa" backTo="/dashboard" />

      {/* KONTEN UTAMA */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-surface min-h-screen" style={{ paddingTop: '64px', paddingBottom: '112px', backgroundColor: '#ffffff' }}>
        <div className="flex flex-col w-full">
          <div className="px-4 pt-4 pb-8 flex flex-col gap-4 max-w-lg mx-auto w-full">
            
            {/* PENCARIAN TIKET */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <label className="text-xs sm:text-sm font-bold text-gray-900" htmlFor="ticket">
                Cari Nomor Tiket Pengaduan Bansos
              </label>
              <form onSubmit={handleSearch} className="mt-2 flex gap-2">
                <input 
                  id="ticket" 
                  value={ticketInput} 
                  onChange={(event) => setTicketInput(event.target.value)} 
                  className="min-w-0 flex-1 h-12 rounded-xl border border-gray-200 px-4 text-[14px] sm:text-[15px] font-mono focus:border-[#1B4D3E] focus:outline-none" 
                  placeholder="Contoh: ADU-20260929-XXXX"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="rounded-xl bg-[#1b4d3e] hover:bg-[#153e32] px-5 font-bold text-white text-sm transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isLoading ? 'Mencari...' : 'Lacak'}
                </button>
              </form>
            </section>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0 mt-0.5">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STATUS INFORMASI TIKET */}
            {reportData && (
              <>
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-gray-500 font-semibold uppercase">Nomor Tiket Aduan</p>
                      <h2 className="text-lg sm:text-xl font-mono font-extrabold text-[#1b4d3e]">{reportData.nomor_tiket}</h2>
                    </div>
                    {getStatusBadge(reportData.status_laporan)}
                  </div>

                  <div className="border-t border-gray-100 pt-3 space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Kategori Aduan:</span>
                      <span className="font-semibold text-gray-800">{reportData.kategori_aduan}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Program Terkait:</span>
                      <span className="font-semibold text-gray-800">{reportData.program_terkait}</span>
                    </div>
                    {reportData.nik_terlapor && (
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">NIK Terlapor:</span>
                        <span className="font-mono font-semibold text-gray-800">{reportData.nik_terlapor}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-gray-500">Sifat Pengirim:</span>
                      <span className="font-semibold text-gray-800">{reportData.is_anonymous ? 'Anonim (Dirahasiakan)' : 'Warga Terdata'}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-gray-500 block mb-1">Deskripsi Aduan:</span>
                      <p className="p-3 bg-gray-50 rounded-xl text-gray-700 italic text-xs sm:text-sm border border-gray-100">
                        "{reportData.deskripsi_kejadian}"
                      </p>
                    </div>
                    {reportData.catatan_admin && (
                      <div className="pt-2">
                        <span className="text-emerald-800 font-bold block mb-1">Catatan Verifikator Desa:</span>
                        <div className="p-3 bg-emerald-50/70 rounded-xl text-emerald-950 font-medium text-xs sm:text-sm border border-emerald-200">
                          {reportData.catatan_admin}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* TIMELINE PROGRES */}
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900">Progres Penanganan</h2>
                  <ol className="space-y-6 border-l-2 border-emerald-700 pl-5 ml-2">
                    <li className="relative">
                      <div className="absolute -left-[27px] top-0 w-3 h-3 rounded-full bg-emerald-700 ring-4 ring-white"></div>
                      <strong className="block text-gray-900 text-sm">Laporan Berhasil Masuk</strong>
                      <span className="text-xs text-gray-500">Tercatat di sistem Kelurahan Ngrowo</span>
                    </li>
                    <li className="relative">
                      <div className={`absolute -left-[27px] top-0 w-3 h-3 rounded-full ${
                        reportData.status_laporan !== 'pending' ? 'bg-emerald-700' : 'bg-gray-300 animate-pulse'
                      } ring-4 ring-white`}></div>
                      <strong className={`block text-sm ${reportData.status_laporan !== 'pending' ? 'text-gray-900' : 'text-emerald-800 font-bold'}`}>
                        Verifikasi Lapangan & RT/RW
                      </strong>
                      <span className="text-xs text-gray-500">Pengecekan faktual data sanggahan bersama ketua RT setempat.</span>
                    </li>
                    <li className="relative">
                      <div className={`absolute -left-[27px] top-0 w-3 h-3 rounded-full ${
                        reportData.status_laporan === 'selesai' ? 'bg-emerald-700' : 'bg-gray-300'
                      } ring-4 ring-white`}></div>
                      <strong className={`block text-sm ${reportData.status_laporan === 'selesai' ? 'text-emerald-800 font-bold' : 'text-gray-500'}`}>
                        Musdes / Keputusan Tindak Lanjut
                      </strong>
                      <span className="text-xs text-gray-500">Penetapan pembaruan data usulan DTKS kelurahan.</span>
                    </li>
                  </ol>
                </section>
              </>
            )}

            {!reportData && !isLoading && searched && !errorMsg && (
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                <span className="material-symbols-outlined text-gray-400 text-[36px]">search_off</span>
                <p className="text-sm font-bold text-gray-700 mt-2">Nomor Tiket Tidak Ditemukan</p>
                <p className="text-xs text-gray-500 mt-1">Periksa kembali penulisan nomor tiket yang tertera pada bukti pengaduan Anda.</p>
              </div>
            )}

            {/* TOMBOL KEMBALI KE FORM */}
            <div className="pt-2">
              <Link 
                to="/pengaduan" 
                className="w-full h-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold flex items-center justify-center transition-all text-sm"
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