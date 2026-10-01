import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { jadwalService } from '../services/api';

const MAPS_LINK = 'https://maps.app.goo.gl/9Qpe14ofwcBaBLRu8';
const WEEK_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function Jadwal() {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayedMonth, setDisplayedMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [downloadState, setDownloadState] = useState('default');

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await jadwalService.getJadwal();
      const payload = response?.data ? response : { data: response };
      setSchedule(payload.data);
      if (payload.data?.tanggal) {
        const scheduleDate = new Date(`${payload.data.tanggal}T00:00:00`);
        setSelectedDate(payload.data.tanggal);
        setDisplayedMonth(scheduleDate);
      }
    } catch (err) {
      setError(err.message || 'Jadwal gagal dimuat dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, []);

  const scheduleDate = schedule?.tanggal ? new Date(`${schedule.tanggal}T00:00:00`) : null;
  const firstWeekday = (new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate();
  const calendarDays = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('id-ID', { dateStyle: 'full' })
    : 'Pilih tanggal pada kalender';

  const handleDownload = () => {
    if (!scheduleDate) return;
    const datePart = scheduleDate.toISOString().slice(0, 10).replaceAll('-', '');
    const calendar = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SI-BANSOS NGROWO//Jadwal//ID',
      'BEGIN:VEVENT', `UID:sibansos-${datePart}@ngrowo.local`, `DTSTART;TZID=Asia/Jakarta:${datePart}T080000`,
      `DTEND;TZID=Asia/Jakarta:${datePart}T120000`, `SUMMARY:${schedule?.judul || schedule?.program || 'Jadwal Bansos Ngrowo'}`,
      `LOCATION:${schedule?.lokasi || 'Ngrowo, Bojonegoro'}`, 'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const fileUrl = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `jadwal-bansos-ngrowo-${datePart}.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    setDownloadState('success');
    window.setTimeout(() => setDownloadState('default'), 2500);
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
                {schedule?.tahap || (loading ? 'Memuat jadwal...' : 'Jadwal penyaluran')}
              </div>
              <span className="text-[12px] font-medium text-gray-500">Penyaluran Reguler</span>
            </div>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error} <button type="button" onClick={loadSchedule} className="ml-2 font-bold underline">Coba lagi</button></div>}

            <section aria-label="Kalender penyaluran" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <button type="button" onClick={() => setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1))} aria-label="Bulan sebelumnya" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"><span className="material-symbols-outlined">chevron_left</span></button>
                <h2 className="text-sm font-bold text-gray-900">{displayedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h2>
                <button type="button" onClick={() => setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1))} aria-label="Bulan berikutnya" className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"><span className="material-symbols-outlined">chevron_right</span></button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {WEEK_DAYS.map((day) => <span key={day} className="py-1 text-[11px] font-semibold text-gray-500">{day}</span>)}
                {calendarDays.map((day, index) => {
                  if (!day) return <span key={`blank-${index}`} aria-hidden="true" />;
                  const dateValue = `${displayedMonth.getFullYear()}-${String(displayedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isEvent = dateValue === schedule?.tanggal;
                  return <button key={dateValue} type="button" onClick={() => setSelectedDate(dateValue)} aria-pressed={selectedDate === dateValue} className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${selectedDate === dateValue ? 'bg-emerald-800 font-bold text-white' : 'text-gray-800 hover:bg-emerald-50'}`}>
                    {day}{isEvent && <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${selectedDate === dateValue ? 'bg-white' : 'bg-amber-500'}`} />}
                  </button>;
                })}
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-900">{selectedDateLabel}</p>
                {selectedDate && selectedDate === schedule?.tanggal ? <p className="mt-1 text-emerald-800">{schedule?.judul || schedule?.program || 'Jadwal penyaluran bansos'} · {schedule?.waktu || '-'}</p> : <p className="mt-1">Tidak ada jadwal penyaluran pada tanggal ini.</p>}
              </div>
            </section>

            {/* KARTU INFORMASI PAKET BANSOS */}
            <section className="rounded-2xl p-5 bg-white flex flex-col gap-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#F0F5F2] text-[#1B4D3E]">
                    <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider block">Paket Bansos</span>
                    <h2 className="text-[15px] font-bold text-gray-900 leading-tight">{schedule?.program || (loading ? 'Memuat program...' : 'Program tidak tersedia')}</h2>
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
                    <span className="text-[14px] font-bold text-gray-900 mt-1">{scheduleDate ? scheduleDate.toLocaleDateString('id-ID', { dateStyle: 'full' }) : loading ? 'Memuat...' : 'Belum tersedia'}</span>
                  </div>
                </div>

                {/* Waktu */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium leading-none">Waktu Pengambilan</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-1">{schedule?.waktu || (loading ? 'Memuat...' : 'Belum tersedia')}</span>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium leading-none">Lokasi Titik Kumpul</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-1">{schedule?.lokasi || (loading ? 'Memuat...' : 'Kantor Lurah Ngrowo, Bojonegoro')}</span>
                    <span className="text-[12px] text-gray-500 mt-0.5">Kantor Lurah Ngrowo, Bojonegoro</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SESI & KUOTA PENGAMBILAN (PER RT) */}
            <section className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-gray-900">Sesi &amp; Kuota Pengambilan (Per RT)</h3>
                <span className="text-[12px] font-semibold text-[#1B4D3E]">Total: {schedule?.total_kpm ?? '-'} KPM</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {schedule?.sesi?.map((session, index) => (
                  <div key={session.rt} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                    <div className="flex items-center justify-between"><span className="text-[13px] font-bold text-gray-900">RT {session.rt}</span><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F0F5F2] text-[10px] font-bold text-[#1B4D3E]">{index + 1}</span></div>
                    <div className="mt-2.5 flex items-baseline gap-1"><span className="text-[22px] font-extrabold text-[#1B4D3E]">{session.jumlah_kpm}</span><span className="text-[12px] font-medium text-gray-500">KPM</span></div>
                    <div className="mt-2 flex items-center gap-1.5 border-t border-gray-100 pt-2 text-[11px] font-medium text-gray-500"><span className="material-symbols-outlined text-[14px]">schedule</span><span>{session.waktu}</span></div>
                  </div>
                ))}
                {!loading && !schedule?.sesi?.length && <p className="col-span-2 text-sm text-gray-500">Sesi penyaluran belum tersedia.</p>}
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
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 rounded-xl text-[14px] font-semibold text-white flex items-center justify-center gap-2 active:scale-[0.99] transition-all shadow-sm bg-[#1B4D3E]"
              >
                <span className="material-symbols-outlined text-[20px]">directions</span>
                <span>Petunjuk Arah Balai Desa</span>
              </a>

              <button 
                type="button" 
                onClick={handleDownload}
                disabled={!scheduleDate || loading}
                className="w-full h-12 rounded-xl text-[14px] font-semibold bg-white flex items-center justify-center gap-2 active:scale-[0.99] transition-all border border-gray-200 text-[#1B4D3E]"
              >
                {downloadState === 'loading' && (
                  <>
                    <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
                    <span>Mengunduh kalender...</span>
                  </>
                )}
                {downloadState === 'success' && (
                  <>
                    <span className="material-symbols-outlined text-[20px] text-primary">check_circle</span>
                    <span>Kalender berhasil diunduh</span>
                  </>
                )}
                {downloadState === 'default' && (
                  <>
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    <span>Unduh Kalender Jadwal (.ics)</span>
                  </>
                )}
              </button>
            </div>

            {/* PETA LOKASI PENYALURAN */}
            <section className="rounded-2xl p-4 bg-white flex flex-col gap-3 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-gray-900">Peta Lokasi Penyaluran</span>
                <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold hover:underline flex items-center gap-1 text-[#1B4D3E]">
                  <span>Buka Google Maps</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
              <iframe
                title="Peta Kantor Lurah Ngrowo, Bojonegoro"
                src={`https://www.google.com/maps?q=${encodeURIComponent('Kantor Lurah Ngrowo Bojonegoro')}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-56 w-full rounded-xl border border-gray-200"
              />
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