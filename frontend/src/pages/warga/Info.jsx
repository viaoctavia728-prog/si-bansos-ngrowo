import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WargaSidebar from '../../components/WargaSidebar';
import WargaMain from '../../components/WargaMain';
import { jadwalService } from '../../services/api';

const PROGRAM_REQUIREMENTS = [
  { title: 'Program Keluarga Harapan (PKH)', items: ['KTP dan Kartu Keluarga', 'Terdaftar sebagai keluarga penerima manfaat', 'Mengikuti verifikasi dan pemutakhiran data'] },
  { title: 'Bantuan Pangan Non-Tunai (BPNT / Sembako)', items: ['KTP dan Kartu Keluarga', 'Kartu Keluarga Sejahtera (KKS) jika tersedia', 'Mengikuti jadwal pengambilan yang ditetapkan'] },
  { title: 'BLT Dana Desa (Ngrowo)', items: ['KTP dan Kartu Keluarga', 'Terdaftar dalam data penerima yang diverifikasi desa', 'Hadir sesuai jadwal dan lokasi penyaluran'] },
  { title: 'Cadangan Pangan Beras CPP 10 Kg', items: ['KTP asli penerima', 'Kartu Keluarga asli', 'Undangan atau barcode resmi dari RT/RW'] },
  { title: 'Desil Tidak Sesuai', items: ['NIK dan data keluarga yang sesuai', 'Penjelasan perubahan kondisi ekonomi', 'Bukti pendukung bila tersedia'] },
];

const FAQ_ITEMS = [
  ['Siapa yang dapat menerima bantuan sosial?', 'Warga yang memenuhi kriteria program dan tercatat dalam data penerima yang telah diverifikasi.'],
  ['Bagaimana cara mengecek status bansos?', 'Masuk ke akun warga, buka menu Cek Bansos, lalu masukkan NIK sesuai data kependudukan.'],
  ['Apa yang harus dibawa saat mengambil bantuan?', 'Bawa KTP asli, Kartu Keluarga, kartu bantuan atau undangan resmi sesuai persyaratan program.'],
  ['Bagaimana jika nama saya belum terdaftar?', 'Pastikan data registrasi sesuai daftar warga. Jika tetap belum terdaftar, hubungi perangkat Desa Ngrowo melalui pengaduan.'],
  ['Bagaimana cara mengajukan pengaduan?', 'Masuk ke akun warga, buka menu Pengaduan, lengkapi kategori, program terkait, domisili, dan deskripsi laporan.'],
  ['Apa arti desil tidak sesuai?', 'Desil tidak sesuai berarti kondisi ekonomi keluarga yang tercatat diduga tidak lagi sesuai dengan kondisi sebenarnya.'],
  ['Apakah pengaduan dapat dibuat secara anonim?', 'Ya. Pilih opsi Lapor Anonim pada formulir pengaduan untuk menyamarkan identitas dari tampilan laporan.'],
  ['Berapa lama pengaduan diproses?', 'Pengaduan ditinjau petugas secara bertahap. Pantau statusnya menggunakan nomor tiket laporan.'],
  ['Bagaimana jika NIK atau nama tidak cocok saat registrasi?', 'Registrasi hanya dapat dilakukan oleh warga yang datanya terdapat dalam daftar warga yang disediakan desa.'],
  ['Di mana jadwal penyaluran dapat dilihat?', 'Jadwal penyaluran tersedia pada menu Jadwal dan akan diperbarui ketika ada informasi terbaru dari admin desa.'],
  ['Bagaimana cara menghubungi perangkat desa?', 'Gunakan kanal WhatsApp Bantuan Kelurahan yang tersedia pada halaman ini atau menu Pengaduan setelah login.'],
];

export default function Info() {
  const [schedule, setSchedule] = useState(null);
  const [scheduleError, setScheduleError] = useState('');

  useEffect(() => {
    let active = true;
    jadwalService.getJadwal().then((response) => {
      if (active) {
        const list = Array.isArray(response) ? response : Array.isArray(response?.data) ? response.data : response?.data ? [response.data] : [];
        setSchedule(list[0] || null);
      }
    }).catch((error) => {
      if (active) setScheduleError(error.message || 'Informasi jadwal belum dapat dimuat.');
    });
    return () => { active = false; };
  }, []);

  const formattedDate = schedule?.tanggal
    ? new Date(`${schedule.tanggal}T00:00:00`).toLocaleDateString('id-ID', { dateStyle: 'full' })
    : 'Jadwal belum tersedia';

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <WargaSidebar />
      <WargaMain>
      <Header
        title="Info Desa"
        eyebrow="Informasi Layanan Warga"
        backTo="/"
      />
      <main className="flex-1 pb-24 lg:pb-10">
        <div className="warga-content flex flex-col gap-4 pt-5 pb-8 sm:gap-5 sm:pt-7">
          <section className="gov-card border-emerald-200 bg-primary-soft/50 p-5 sm:p-6">
            <p className="text-[11px] font-bold uppercase text-[#166534]">Kelurahan Ngrowo</p>
            <h2 className="mt-1 text-xl font-bold">Informasi Pelayanan Bansos</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">Pantau jadwal penyaluran, periksa data penerima, dan sampaikan pengaduan melalui layanan warga.</p>
          </section>

          <section className="gov-card overflow-hidden">
            <div className="gov-section-title">
              <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-800">campaign</span>
              <div>
                <h3>Jadwal Penyaluran Terbaru</h3>
                <p className="mt-1 text-xs text-slate-500">{schedule?.tahap || 'Informasi dari server'}</p>
              </div>
            </div>
            <div className="p-4">
              {scheduleError ? <p role="status" className="text-sm text-amber-800">{scheduleError}</p> : (
                <>
                  <p className="text-sm font-semibold">{schedule?.program || 'Memuat jadwal...'}</p>
                  <p className="mt-1 text-xs text-slate-500">{formattedDate}{schedule?.waktu ? ` · ${schedule.waktu}` : ''}</p>
                  <p className="mt-1 text-xs text-slate-500">{schedule?.lokasi || ''}</p>
                </>
              )}
              <Link to="/jadwal" className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#166534] px-3 text-xs font-semibold text-white hover:bg-[#15803D]">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                Lihat semua jadwal
              </Link>
            </div>
          </section>

          <section className="gov-card p-4 sm:p-5">
            <h3 className="text-base font-bold text-slate-900">Syarat &amp; Ketentuan Program</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Pilih program untuk melihat persyaratan yang perlu disiapkan.</p>
            <div className="mt-3 divide-y divide-gray-100 rounded-lg border border-slate-100">
              {PROGRAM_REQUIREMENTS.map((program) => (
                <details key={program.title} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-[#0F172A]">
                    <span>{program.title}</span>
                    <span className="material-symbols-outlined text-slate-500 transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <ul className="space-y-1.5 px-3 pb-3 text-xs leading-relaxed text-slate-500">
                    {program.items.map((item) => <li key={item} className="flex gap-2"><span className="text-[#166534]">•</span><span>{item}</span></li>)}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          <section className="gov-card p-4 sm:p-5">
            <h3 className="text-base font-bold text-slate-900">FAQ Bansos</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Jawaban singkat untuk pertanyaan yang sering ditanyakan warga.</p>
            <div className="mt-3 divide-y divide-gray-100 rounded-lg border border-slate-100">
              {FAQ_ITEMS.map(([question, answer]) => (
                <details key={question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-3 text-sm font-semibold text-[#0F172A]">
                    <span>{question}</span>
                    <span className="material-symbols-outlined shrink-0 text-slate-500 transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <p className="px-3 pb-3 text-xs leading-relaxed text-slate-500">{answer}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="gov-card overflow-hidden">
            <h3 className="border-b border-slate-100 px-4 py-3 text-sm font-bold">Layanan cepat</h3>
            <Link to="/cek-bansos" className="flex min-h-14 items-center gap-3 border-b border-slate-100 px-4 hover:bg-emerald-50/50">
              <span className="material-symbols-outlined text-[#166534]">search</span><span className="flex-1 text-sm font-medium">Cek data penerima bansos</span><span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
            <Link to="/pengaduan" className="flex min-h-14 items-center gap-3 px-4 hover:bg-emerald-50/50">
              <span className="material-symbols-outlined text-[#166534]">edit_document</span><span className="flex-1 text-sm font-medium">Kirim pengaduan warga</span><span className="material-symbols-outlined text-slate-400">chevron_right</span>
            </Link>
          </section>

          <section className="gov-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-800">support_agent</span>
              <div><h3 className="text-sm font-bold">Bantuan Kelurahan</h3><p className="mt-1 text-xs text-slate-500">Pelayanan hari kerja · 08.00–15.00 WIB</p></div>
            </div>
            <a href="https://wa.me/6285807078899" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[#166534] hover:underline"><span className="material-symbols-outlined text-[17px]">chat</span>Hubungi melalui WhatsApp</a>
          </section>
        </div>
      </main>
      <Footer />
      </WargaMain>
    </div>
  );
}