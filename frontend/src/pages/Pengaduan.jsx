import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { pengaduanService, authService } from '../services/api';

export default function Pengaduan() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [jenisAduan, setJenisAduan] = useState('Warga Mampu Terima Bansos');
  const [program, setProgram] = useState('PKH');
  const [nikTerlapor, setNikTerlapor] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonim, setIsAnonim] = useState(false);
  const [buktiFoto, setBuktiFoto] = useState(null);
  const buktiFotoRef = useRef(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdTicket, setCreatedTicket] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const buktiFotoUrl = buktiFoto ? await pengaduanService.uploadBukti(buktiFoto) : null;
      const payload = {
        nik_terlapor: nikTerlapor || null,
        kategori_aduan: jenisAduan,
        program_terkait: program,
        deskripsi_kejadian: description,
        lokasi_spesifik: `RT ${currentUser?.rt || '001'} / RW ${currentUser?.rw || '001'}, Kelurahan Ngrowo`,
        bukti_foto: buktiFotoUrl,
        is_anonymous: isAnonim,
      };

      const res = await pengaduanService.buatPengaduan(payload);
      setCreatedTicket(res.nomor_tiket);
      setDescription('');
      setNikTerlapor('');
      setBuktiFoto(null);
      if (buktiFotoRef.current) buktiFotoRef.current.value = '';
    } catch (err) {
      setErrorMsg(err.message || 'Gagal mengirim pengaduan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen bg-white" style={{ color: 'rgb(17, 24, 39)' }}>
      
      {/* HEADER UTAMA */}
      <Header title="Form Pengaduan Bansos" backTo="/dashboard" />

      {/* KONTEN UTAMA */}
      <main className="flex flex-col relative w-full pt-16 pb-28 bg-surface min-h-screen" style={{ paddingTop: '64px', paddingBottom: '112px', backgroundColor: '#ffffff' }}>
        <div className="flex flex-col w-full">
          <div className="px-4 pt-4 pb-8 flex flex-col gap-4 max-w-lg mx-auto w-full">
            
            {/* BANNER INFORMASI */}
            <section className="rounded-2xl border border-gray-200 bg-[#F8FAF8] p-4 flex items-start gap-3 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-[#1B4D3E]/10 text-[#1B4D3E] flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[22px]">verified_user</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[14px] text-gray-900 leading-snug">Keterbukaan & Keadilan Bansos</span>
                <p className="text-[13px] text-gray-600 leading-relaxed mt-0.5">
                  Setiap laporan sanggahan ditinjau oleh tim verifikator kelurahan bersama RT/RW secara objektif, aman, dan rahasia.
                </p>
              </div>
            </section>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                <span className="material-symbols-outlined text-red-600 text-[20px] shrink-0 mt-0.5">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SUCCESS BANNER DENGAN TIKET RESMI */}
            {createdTicket && (
              <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 shadow-sm flex flex-col gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[20px]">check</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-base leading-tight">Pengaduan Berhasil Terkirim!</h3>
                    <p className="text-xs text-emerald-800 mt-0.5">Laporan telah masuk ke database verifikasi Kelurahan Ngrowo.</p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-gray-500 uppercase">Nomor Tiket Anda:</span>
                    <p className="font-mono text-base font-extrabold text-emerald-900">{createdTicket}</p>
                  </div>
                  <Link
                    to={`/detail-laporan?tiket=${createdTicket}`}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-xs flex items-center gap-1 transition-all"
                  >
                    <span>Lacak Laporan</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}

            {/* FORM PENGADUAN */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* JENIS ADUAN */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex flex-col">
                  <label className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5">
                    <span>Kategori Sanggahan</span>
                    <span className="text-red-500 font-bold text-[13px]">(Wajib)</span>
                  </label>
                  <p className="text-[13px] text-gray-500">Pilih salah satu alasan sanggahan</p>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  {[
                    { title: 'Warga Mampu Terima Bansos', desc: 'Penerima memiliki ekonomi mampu namun terdata menerima bansos' },
                    { title: 'Warga Miskin Terlewat', desc: 'Keluarga prasejahtera yang berhak namun belum menerima bantuan' },
                    { title: 'Sanggah Data Mandiri', desc: 'Pembaruan data ekonomi keluarga sendiri atau perubahan desil' }
                  ].map((item) => (
                    <label 
                      key={item.title} 
                      onClick={() => setJenisAduan(item.title)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        jenisAduan === item.title ? 'border-[#1B4D3E] bg-[#1B4D3E]/5 ring-1 ring-[#1B4D3E]' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="jenis_aduan" 
                        checked={jenisAduan === item.title} 
                        onChange={() => setJenisAduan(item.title)} 
                        className="sr-only" 
                      />
                      <div className={`w-5 h-5 rounded-full border-2 ${jenisAduan === item.title ? 'border-[#1B4D3E] bg-[#1B4D3E]' : 'border-gray-300'} flex items-center justify-center shrink-0`}>
                        {jenisAduan === item.title && <span className="w-2 h-2 rounded-full bg-white"></span>}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-gray-900 text-[14px] sm:text-[15px] leading-tight">{item.title}</span>
                        <span className="text-gray-500 text-[11px] sm:text-[12px] mt-0.5">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* PROGRAM TERKAIT */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <label className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5" htmlFor="program">
                  <span>Program Terkait</span>
                  <span className="text-red-500 font-bold text-[13px]">(Wajib)</span>
                </label>
                <div className="relative w-full">
                  <select 
                    id="program" 
                    value={program}
                    onChange={(e) => setProgram(e.target.value)}
                    className="w-full h-12 pl-4 pr-10 bg-white border border-gray-200 rounded-xl text-gray-900 text-[15px] focus:border-[#1B4D3E] focus:outline-none appearance-none cursor-pointer" 
                    required
                  >
                    <option value="PKH">Program Keluarga Harapan (PKH)</option>
                    <option value="BPNT">Bantuan Pangan Non-Tunai (BPNT / Sembako)</option>
                    <option value="BLT Desa">BLT Dana Desa (Ngrowo)</option>
                    <option value="Bansos Beras CPP">Cadangan Pangan Beras CPP 10 Kg</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </section>

              {/* NIK TERLAPOR */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[15px] font-bold text-gray-900" htmlFor="nik">
                    NIK Terlapor <span className="text-gray-400 font-normal text-[13px]">(Opsional)</span>
                  </label>
                  <span className="text-[12px] text-gray-400 font-mono">{nikTerlapor.length}/16 Digit</span>
                </div>
                <input 
                  id="nik" 
                  type="tel" 
                  maxLength="16" 
                  value={nikTerlapor} 
                  onChange={(e) => setNikTerlapor(e.target.value)} 
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-[15px] focus:border-[#1B4D3E] focus:outline-none font-mono" 
                  placeholder="Masukkan 16 digit NIK warga yang disanggah..." 
                />
              </section>

              {/* DESKRIPSI KEJADIAN */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[15px] font-bold text-gray-900" htmlFor="description">
                    Deskripsi Kejadian / Alasan <span className="text-red-500 font-bold text-[13px]">(Wajib)</span>
                  </label>
                  <span className="text-xs text-gray-400 font-mono">{description.length}/500</span>
                </div>
                <textarea 
                  id="description" 
                  required 
                  maxLength="500" 
                  rows="4"
                  value={description} 
                  onChange={(event) => setDescription(event.target.value)} 
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-[15px] focus:border-[#1B4D3E] focus:outline-none resize-none" 
                  placeholder="Jelaskan kondisi warga secara jujur, objektif, dan faktual..." 
                />
                <p className="text-[12px] text-[#1B4D3E] flex items-center gap-1 font-medium mt-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Contoh: Memiliki aset kendaraan roda 4, rumah mewah, atau usaha toko besar.
                </p>
              </section>

              {/* UPLOAD BUKTI FOTO */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[15px] font-bold text-gray-900" htmlFor="bukti_foto">
                    Upload Foto Bukti <span className="text-gray-400 font-normal text-[13px]">(Opsional, maks. 2 MB)</span>
                  </label>
                  <span className="text-[12px] text-gray-500 shrink-0">JPG, PNG, WEBP</span>
                </div>
                <label htmlFor="bukti_foto" className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-5 text-center hover:bg-gray-100">
                  <span className="material-symbols-outlined text-[26px] text-[#1B4D3E]">add_a_photo</span>
                  <span className="text-sm font-semibold text-gray-800">{buktiFoto ? buktiFoto.name : 'Ambil Foto atau Pilih Gambar'}</span>
                  <span className="text-xs text-gray-500">Lampirkan foto kondisi atau dokumen pendukung</span>
                </label>
                <input
                  ref={buktiFotoRef}
                  id="bukti_foto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    if (!file) return;
                    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
                      setErrorMsg('Pilih foto JPG, PNG, atau WEBP dengan ukuran maksimal 2 MB.');
                      setBuktiFoto(null);
                      event.target.value = '';
                      return;
                    }
                    setErrorMsg('');
                    setBuktiFoto(file);
                  }}
                />
              </section>

              {/* LAPOR ANONIM */}
              <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 cursor-pointer select-none shadow-sm">
                <input 
                  type="checkbox" 
                  checked={isAnonim} 
                  onChange={(e) => setIsAnonim(e.target.checked)} 
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1B4D3E] focus:ring-[#1B4D3E] accent-[#1B4D3E] cursor-pointer" 
                /> 
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-[14px] sm:text-[15px]">Lapor Anonim (Rahasiakan Identitas)</span>
                  <span className="mt-0.5 text-gray-500 text-[12px] sm:text-[13px]">
                    Nama dan nomor kontak Anda akan disamarkan secara otomatis di sistem desa.
                  </span>
                </div>
              </label>

              {/* TOMBOL KIRIM */}
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-[#1b4d3e] hover:bg-[#153e32] font-semibold text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                    </svg>
                    <span>Mengirim Pengaduan...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    <span>Kirim Laporan Pengaduan</span>
                  </>
                )}
              </button>
            </form>

            {/* LINK TRACKING */}
            <Link to="/detail-laporan" className="block text-center text-sm font-semibold text-[#1b4d3e] hover:underline pt-2">
              Lacak Pengaduan Berdasarkan Nomor Tiket →
            </Link>

          </div>
        </div>
      </main>

      {/* FOOTER & NAVIGASI BAWAH */}
      <Footer />
    </div>
  );
}