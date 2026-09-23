import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Pengaduan() {
  const [description, setDescription] = useState('');
  const [sent, setSent] = useState(false);
  const [nik, setNik] = useState('');
  const [complaintType, setComplaintType] = useState('mampu');
  const [isAnonim, setIsAnonim] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [evidenceData, setEvidenceData] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleEvidenceChange = (event) => {
    const file = event.target.files?.[0];
    setAnalysis(null);
    setAnalysisError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAnalysisError('File bukti harus berupa gambar JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAnalysisError('Ukuran foto maksimal 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setEvidenceData(reader.result);
      setEvidenceName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeEvidence = () => {
    setEvidenceData('');
    setEvidenceName('');
    setAnalysis(null);
    setAnalysisError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (evidenceData) {
      setIsAnalyzing(true);
      setAnalysisError('');
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}/analyze-evidence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_data: evidenceData, description }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || 'Analisis bukti gagal.');
        setAnalysis(result);
      } catch (error) {
        setAnalysisError(error.message);
        setIsAnalyzing(false);
        return;
      }
      setIsAnalyzing(false);
    }
    setSent(true);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4500);
  };

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen bg-white" style={{ color: 'rgb(17, 24, 39)' }}>
      
      {/* HEADER UTAMA */}
      <Header title="Form Pengaduan" backTo="/dashboard" />

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
                  Setiap laporan sanggahan ditinjau musyawarah desa bersama RT/RW secara objektif, aman, dan dapat dipertanggungjawabkan.
                </p>
              </div>
            </section>

            {/* FORM PENGADUAN */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* JENIS ADUAN */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
                <div className="flex flex-col">
                  <label className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5">
                    <span>Jenis Aduan</span>
                    <span className="text-red-500 font-bold text-[13px]">(Wajib)</span>
                  </label>
                  <p className="text-[13px] text-gray-500">Pilih salah satu kondisi yang paling sesuai</p>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  {[
                    { id: 'mampu', title: 'Warga Mampu Terima Bansos', desc: 'Memiliki aset/ekonomi mampu namun tercatat sebagai penerima' },
                    { id: 'miskin_terlewat', title: 'Warga Miskin Terlewat', desc: 'Keluarga prasejahtera yang berhak namun belum menerima' },
                    { id: 'sanggah_saya', title: 'Sanggah Status Saya', desc: 'Perubahan desil/keberatan data ekonomi mandiri' }
                  ].map((item, idx) => (
                    <label key={item.id} className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${complaintType === item.id ? 'border-[#1B4D3E] bg-[#1B4D3E]/5' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                      <input
                        type="radio"
                        name="jenis_aduan"
                        checked={complaintType === item.id}
                        onChange={() => setComplaintType(item.id)}
                        value={item.id}
                        className="sr-only peer"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${complaintType === item.id ? 'border-[#1B4D3E] bg-[#1B4D3E]' : 'border-gray-300 bg-white'}`}>
                        {complaintType === item.id && <span className="w-2 h-2 rounded-full bg-white"></span>}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-gray-900 text-[15px] leading-tight">{item.title}</span>
                        <span className="text-gray-500 text-[12px] mt-0.5">{item.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {/* UPLOAD BUKTI */}
              <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <label className="text-[15px] font-bold text-gray-900" htmlFor="evidence">
                    Upload Foto Bukti <span className="text-[12px] font-normal text-red-500">(Maks 2MB)</span>
                  </label>
                  <span className="text-[12px] text-gray-500">JPG, PNG, WEBP</span>
                </div>
                {evidenceData ? (
                  <div className="flex items-center gap-3 rounded-xl border border-[#1B4D3E]/20 bg-[#F2F7F5] p-3">
                    <img src={evidenceData} alt="Pratinjau bukti rumah" className="h-16 w-16 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-gray-900">{evidenceName}</p>
                      <p className="text-[12px] text-gray-500">Foto siap dianalisis AI</p>
                    </div>
                    <button type="button" onClick={removeEvidence} className="text-[12px] font-semibold text-red-600 hover:underline">Hapus</button>
                  </div>
                ) : (
                  <label htmlFor="evidence" className="flex min-h-[112px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center hover:border-[#1B4D3E]">
                    <span className="material-symbols-outlined mb-1 rounded-full bg-[#E8F2EE] p-2 text-[22px] text-[#1B4D3E]">photo_camera</span>
                    <span className="text-[13px] font-bold text-gray-900">Ambil Foto atau Pilih Gambar</span>
                    <span className="mt-0.5 text-[11px] text-gray-500">Foto rumah tampak depan, bukti aset kendaraan, atau dokumen pendukung</span>
                  </label>
                )}
                <input id="evidence" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleEvidenceChange} className="sr-only" />
                {analysisError && <p className="text-[12px] font-medium text-red-600">{analysisError}</p>}
                {analysis && (
                  <div className="rounded-xl border border-[#1B4D3E]/20 bg-[#F2F7F5] p-3 text-[12px] text-gray-700">
                    <p className="font-bold text-[#1B4D3E]">Estimasi awal AI: Desil {analysis.estimated_desil ?? 'belum dapat ditentukan'}</p>
                    <p className="mt-1">Tingkat keyakinan: {analysis.confidence == null ? '-' : `${Math.round(analysis.confidence * 100)}%`}</p>
                    <p className="mt-1 text-[11px] text-gray-500">{analysis.disclaimer}</p>
                  </div>
                )}
              </section>

              {/* PROGRAM TERKAIT */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <label className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5" htmlFor="program">
                  <span>Program Terkait</span>
                  <span className="text-red-500 font-bold text-[13px]">(Wajib)</span>
                </label>
                <div className="relative w-full">
                  <select id="program" className="w-full h-12 pl-4 pr-10 bg-white border border-gray-200 rounded-xl text-gray-900 text-[15px] focus:border-[#1B4D3E] focus:outline-none appearance-none cursor-pointer" required defaultValue="">
                    <option value="" disabled>Pilih Program Bansos</option>
                    <option value="pkh">Program Keluarga Harapan (PKH)</option>
                    <option value="bpnt">Bantuan Pangan Non-Tunai (BPNT / Sembako)</option>
                    <option value="blt">BLT Dana Desa (Ngrowo)</option>
                    <option value="prov">Bansos Provinsi Jawa Timur</option>
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
                  <span className="text-[12px] text-gray-400 font-medium">{nik.length}/16 Digit</span>
                </div>
                <input 
                  id="nik" 
                  type="tel" 
                  maxLength="16" 
                  value={nik} 
                  onChange={(e) => setNik(e.target.value.replace(/\D/g, '').slice(0, 16))} 
                  inputMode="numeric"
                  pattern="[0-9]{16}"
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl text-gray-900 text-[15px] focus:border-[#1B4D3E] focus:outline-none" 
                  placeholder="Masukkan 16 digit NIK..." 
                />
              </section>

              {/* DESKRIPSI KEJADIAN */}
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[15px] font-bold text-gray-900" htmlFor="description">
                    Deskripsi Kejadian <span className="text-red-500 font-bold text-[13px]">(Wajib)</span>
                  </label>
                  <span className="text-xs text-gray-400 font-medium">{description.length}/500</span>
                </div>
                <textarea 
                  id="description" 
                  required 
                  maxLength="500" 
                  rows="4"
                  value={description} 
                  onChange={(event) => setDescription(event.target.value)} 
                  className="w-full p-3 bg-white border border-gray-200 rounded-xl text-[15px] focus:border-[#1B4D3E] focus:outline-none resize-none" 
                  placeholder="Jelaskan kondisi warga secara jujur dan objektif..." 
                />
                <p className="text-[12px] text-[#1B4D3E] flex items-center gap-1 font-medium mt-1">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  Contoh: Memiliki mobil pribadi, rumah permanen bertingkat, atau usaha toko besar.
                </p>
              </section>

              {/* LAPOR ANONIM */}
              <label className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 cursor-pointer select-none shadow-sm">
                <input 
                  type="checkbox" 
                  checked={isAnonim} 
                  onChange={(e) => setIsAnonim(e.target.checked)} 
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-[#1B4D3E] focus:ring-[#1B4D3E]" 
                /> 
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900 text-[15px]">Lapor Anonim</span>
                  <span className="mt-0.5 text-gray-500 text-[13px]">Identitas Anda disembunyikan sepenuhnya dari admin desa maupun publik.</span>
                </div>
              </label>

              {/* TOMBOL KIRIM */}
              <button 
                type="submit" 
                disabled={isAnalyzing}
                className="w-full h-12 rounded-xl bg-[#1b4d3e] hover:bg-[#153e32] font-semibold text-white flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                <span>{isAnalyzing ? 'Menganalisis Bukti...' : sent ? 'Laporan Terkirim' : 'Kirim Laporan'}</span>
              </button>
            </form>

            {/* LINK TRACKING */}
            <Link to="/detail-laporan" className="block text-center text-sm font-semibold text-[#1b4d3e] hover:underline pt-2">
              Lihat tracking laporan →
            </Link>

          </div>
        </div>
      </main>

      {/* TOAST SUKSES */}
      {showToast && (
        <div className="fixed inset-x-4 bottom-20 z-50 bg-gray-900 text-white p-4 rounded-xl shadow-xl flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1b4d3e] flex items-center justify-center text-white shrink-0">
              <span className="material-symbols-outlined text-[20px]">check</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold">Sanggahan Terkirim</span>
              <span className="text-[12px] text-gray-300">Nomor Tiket: #ADU-NGROWO-8821</span>
            </div>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-white text-sm font-semibold px-2 py-1">Tutup</button>
        </div>
      )}

      {/* FOOTER & NAVIGASI BAWAH */}
      <Footer />
    </div>
  );
}