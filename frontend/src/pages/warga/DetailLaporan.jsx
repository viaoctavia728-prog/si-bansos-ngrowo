import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WargaSidebar from '../../components/WargaSidebar';
import WargaMain from '../../components/WargaMain';
import { pengaduanService } from '../../services/api';

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
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <WargaSidebar />
      <WargaMain>
      
      {/* HEADER UTAMA */}
      <Header title="Tracking Laporan" eyebrow="Layanan Aspirasi Desa" backTo="/dashboard" />

      {/* KONTEN UTAMA */}
      <main className="flex-1 pb-24 lg:pb-10">
        <div className="flex flex-col w-full">
          <div className="warga-content flex flex-col gap-4 pt-5 pb-8 sm:gap-5 sm:pt-7">
            
            {/* PENCARIAN TIKET */}
            <section className="gov-card p-4 sm:p-5">
              <label className="text-xs sm:text-sm font-bold text-[#0F172A]" htmlFor="ticket">
                Cari Nomor Tiket Pengaduan Bansos
              </label>
              <form onSubmit={handleSearch} className="mt-2 flex gap-2">
                <input 
                  id="ticket" 
                  value={ticketInput} 
                  onChange={(event) => setTicketInput(event.target.value)} 
                  className="gov-input min-w-0 flex-1 font-mono text-sm" 
                  placeholder="Contoh: ADU-20260929-XXXX"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="rounded-xl bg-[#166534] hover:bg-[#15803D] px-5 font-bold text-white text-sm transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
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
                <section className="gov-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase">Nomor Tiket Aduan</p>
                      <h2 className="text-lg sm:text-xl font-mono font-extrabold text-[#166534]">{reportData.nomor_tiket}</h2>
                    </div>
                    {getStatusBadge(reportData.status_laporan)}
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-slate-500">Kategori Aduan:</span>
                      <span className="font-semibold text-slate-800">{reportData.kategori_aduan}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-slate-500">Program Terkait:</span>
                      <span className="font-semibold text-slate-800">{reportData.program_terkait}</span>
                    </div>
                    {reportData.nik_terlapor && (
                      <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-slate-500">NIK Terlapor:</span>
                        <span className="font-mono font-semibold text-slate-800">{reportData.nik_terlapor}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1 border-b border-gray-50">
                      <span className="text-slate-500">Sifat Pengirim:</span>
                      <span className="font-semibold text-slate-800">{reportData.is_anonymous ? 'Anonim (Dirahasiakan)' : 'Warga Terdata'}</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-slate-500 block mb-1">Deskripsi Aduan:</span>
                      <p className="p-3 bg-slate-50 rounded-xl text-slate-600 italic text-xs sm:text-sm border border-slate-100">
                        "{reportData.deskripsi_kejadian}"
                      </p>
                    </div>
                    {reportData.catatan_admin && (
                      <div className="pt-2">
                        <span className="text-[#166534] font-bold block mb-1">Catatan Verifikator Desa:</span>
                        <div className="p-3 bg-emerald-50/70 rounded-xl text-emerald-950 font-medium text-xs sm:text-sm border border-emerald-200">
                          {reportData.catatan_admin}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* TIMELINE PROGRES */}
                <section className="gov-card p-5 space-y-4">
                  <h2 className="text-base sm:text-lg font-bold text-[#0F172A]">Progres Penanganan</h2>
                  <ol className="space-y-6 border-l-2 border-emerald-700 pl-5 ml-2">
                    <li className="relative">
                      <div className="absolute -left-[27px] top-0 w-3 h-3 rounded-full bg-[#166534] ring-4 ring-white"></div>
                      <strong className="block text-[#0F172A] text-sm">Laporan Berhasil Masuk</strong>
                      <span className="text-xs text-slate-500">Tercatat di sistem Kelurahan Ngrowo</span>
                    </li>
                    <li className="relative">
                      <div className={`absolute -left-[27px] top-0 w-3 h-3 rounded-full ${
                        reportData.status_laporan !== 'pending' ? 'bg-[#166534]' : 'bg-gray-300 animate-pulse'
                      } ring-4 ring-white`}></div>
                      <strong className={`block text-sm ${reportData.status_laporan !== 'pending' ? 'text-[#0F172A]' : 'text-[#166534] font-bold'}`}>
                        Verifikasi Lapangan & RT/RW
                      </strong>
                      <span className="text-xs text-slate-500">Pengecekan faktual data sanggahan bersama ketua RT setempat.</span>
                    </li>
                    <li className="relative">
                      <div className={`absolute -left-[27px] top-0 w-3 h-3 rounded-full ${
                        reportData.status_laporan === 'selesai' ? 'bg-[#166534]' : 'bg-gray-300'
                      } ring-4 ring-white`}></div>
                      <strong className={`block text-sm ${reportData.status_laporan === 'selesai' ? 'text-[#166534] font-bold' : 'text-slate-500'}`}>
                        Musdes / Keputusan Tindak Lanjut
                      </strong>
                      <span className="text-xs text-slate-500">Penetapan pembaruan data usulan DTKS kelurahan.</span>
                    </li>
                  </ol>
                </section>
              </>
            )}

            {!reportData && !isLoading && searched && !errorMsg && (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="material-symbols-outlined text-slate-400 text-[36px]">search_off</span>
                <p className="text-sm font-bold text-slate-600 mt-2">Nomor Tiket Tidak Ditemukan</p>
                <p className="text-xs text-slate-500 mt-1">Periksa kembali penulisan nomor tiket yang tertera pada bukti pengaduan Anda.</p>
              </div>
            )}

            {/* TOMBOL KEMBALI KE FORM */}
            <div className="pt-2">
              <Link 
                to="/pengaduan" 
                className="w-full h-12 rounded-xl bg-slate-100 hover:bg-gray-200 text-slate-600 font-semibold flex items-center justify-center transition-all text-sm"
              >
                ← Buat Pengaduan Baru
              </Link>
            </div>

          </div>
        </div>
      </main>

      {/* FOOTER */}
      <Footer />
      </WargaMain>
    </div>
  );
}