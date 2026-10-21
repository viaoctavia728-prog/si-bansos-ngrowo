import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { jadwalService, notificationService } from '../../services/api';

const MAPS_LINK = 'https://maps.app.goo.gl/9Qpe14ofwcBaBLRu8';
const WEEK_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS = {
  januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
  juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
};

function getIsoDate(item) {
  if (item?.iso_date && /^\d{4}-\d{2}-\d{2}$/.test(item.iso_date)) return item.iso_date;
  const match = String(item?.tanggal || '').toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);
  const month = match && MONTHS[match[2]];
  return match && month ? `${match[3]}-${month}-${String(match[1]).padStart(2, '0')}` : '';
}

function getAnnouncementDetails(notification) {
  const text = `${notification?.title || ''} ${notification?.body || ''}`;
  const dateMatch = text.toLowerCase().match(/(?:tanggal\s+)?(\d{1,2})\s+(januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\s+(\d{4})/);
  const isoDate = dateMatch
    ? `${dateMatch[3]}-${MONTHS[dateMatch[2]]}-${String(dateMatch[1]).padStart(2, '0')}`
    : '';
  const timeMatch = text.match(/(?:pukul|jam)\s+([0-9]{1,2}[.:][0-9]{2}(?:\s*-\s*[0-9]{1,2}[.:][0-9]{2})?(?:\s*WIB)?)/i);
  const locationMatch = text.match(/(?:bertempat|lokasi)\s+(?:di\s+)?([^.!?]+)/i);
  return {
    program: notification?.title || '',
    tanggal: isoDate,
    jam: timeMatch ? timeMatch[1].replace('.', ':') : '',
    lokasi: locationMatch ? locationMatch[1].trim() : '',
  };
}

export default function Jadwal() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayedMonth, setDisplayedMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await jadwalService.getJadwal();
      const list = Array.isArray(response) ? response : response?.data ? (Array.isArray(response.data) ? response.data : [response.data]) : [];
      setSchedules(list);
      const firstDate = getIsoDate(list[0]);
      if (firstDate) {
        const scheduleDate = new Date(`${firstDate}T00:00:00`);
        setSelectedDate(firstDate);
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
    let active = true;
    const loadAnnouncement = async () => {
      try {
        const notifications = await notificationService.getNotifications();
        if (active && Array.isArray(notifications)) {
          setLatestAnnouncement(notifications[0] || null);
          const announcementDate = getAnnouncementDetails(notifications[0]).tanggal;
          if (announcementDate) {
            setSelectedDate(announcementDate);
            setDisplayedMonth(new Date(`${announcementDate}T00:00:00`));
          }
        }
      } catch {
        if (active) setLatestAnnouncement(null);
      }
    };
    loadAnnouncement();
    const interval = window.setInterval(loadAnnouncement, 8000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const announcementDetails = getAnnouncementDetails(latestAnnouncement);
  const allSchedules = announcementDetails.tanggal
    ? [...schedules, { ...announcementDetails, iso_date: announcementDetails.tanggal }]
    : schedules;
  const selectedSchedule = allSchedules.find((item) => getIsoDate(item) === selectedDate) || allSchedules[0] || {};
  const scheduleDate = getIsoDate(selectedSchedule) ? new Date(`${getIsoDate(selectedSchedule)}T00:00:00`) : null;
  const firstWeekday = (new Date(displayedMonth.getFullYear(), displayedMonth.getMonth(), 1).getDay() + 6) % 7;
  const daysInMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 0).getDate();
  const calendarDays = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];
  const selectedDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('id-ID', { dateStyle: 'full' })
    : 'Pilih tanggal pada kalender';

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
                {selectedSchedule?.tahap || (loading ? 'Memuat jadwal...' : 'Jadwal penyaluran')}
              </div>
              <span className="text-[12px] font-medium text-gray-500">Penyaluran Reguler</span>
            </div>

            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error} <button type="button" onClick={loadSchedule} className="ml-2 font-bold underline">Coba lagi</button></div>}

            {latestAnnouncement && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm" aria-label="Pengumuman admin">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <span className="material-symbols-outlined text-[22px]">campaign</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">Info admin</span>
                      {latestAnnouncement.created_at && (
                        <span className="text-[10px] text-amber-800">
                          {new Date(latestAnnouncement.created_at).toLocaleDateString('id-ID')}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-1 text-sm font-bold text-gray-900">{latestAnnouncement.title}</h2>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-gray-700">{latestAnnouncement.body}</p>
                  </div>
                </div>
              </section>
            )}

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
                  const isEvent = allSchedules.some((item) => getIsoDate(item) === dateValue);
                  const isSelected = selectedDate === dateValue;
                  return <button key={dateValue} type="button" onClick={() => setSelectedDate(dateValue)} aria-pressed={isSelected} aria-label={isEvent ? `Tanggal jadwal penyaluran: ${day}` : `Tanggal ${day}`} className={`relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm ${isSelected ? 'bg-emerald-800 font-bold text-white' : isEvent ? 'border-2 border-emerald-600 bg-emerald-100 font-bold text-emerald-900 hover:bg-emerald-200' : 'text-gray-800 hover:bg-emerald-50'}`}>
                    {day}{isEvent && !isSelected && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-emerald-700" />}
                  </button>;
                })}
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-900">{selectedDateLabel}</p>
                {selectedSchedule && selectedDate && getIsoDate(selectedSchedule) === selectedDate ? <p className="mt-1 text-emerald-800">{selectedSchedule.judul || selectedSchedule.program || 'Jadwal penyaluran bansos'} · {selectedSchedule.waktu || selectedSchedule.jam || '-'}</p> : <p className="mt-1">Tidak ada jadwal penyaluran pada tanggal ini.</p>}
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
                    <h2 className="text-[15px] font-bold text-gray-900 leading-tight">{selectedSchedule.program || (loading ? 'Memuat program...' : 'Program tidak tersedia')}</h2>
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
                    <span className="text-[14px] font-bold text-gray-900 mt-1">{selectedSchedule.waktu || selectedSchedule.jam || (loading ? 'Memuat...' : 'Belum tersedia')}</span>
                  </div>
                </div>

                {/* Lokasi */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center shrink-0 mt-0.5 border border-gray-200">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium leading-none">Lokasi Titik Kumpul</span>
                    <span className="text-[14px] font-bold text-gray-900 mt-1">{selectedSchedule.lokasi || (loading ? 'Memuat...' : 'Kantor Lurah Ngrowo, Bojonegoro')}</span>
                    <span className="text-[12px] text-gray-500 mt-0.5">{latestAnnouncement ? 'Informasi terbaru dari admin desa' : 'Kantor Lurah Ngrowo, Bojonegoro'}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SESI & KUOTA PENGAMBILAN (PER RT) */}
            <section className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-gray-900">Sesi &amp; Kuota Pengambilan (Per RT)</h3>
                <span className="text-[12px] font-semibold text-[#1B4D3E]">Total: {selectedSchedule.total_kpm ?? '-'} KPM</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {selectedSchedule.sesi?.map((session, index) => (
                  <div key={session.rt} className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
                    <div className="flex items-center justify-between"><span className="text-[13px] font-bold text-gray-900">RT {session.rt}</span><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F0F5F2] text-[10px] font-bold text-[#1B4D3E]">{index + 1}</span></div>
                    <div className="mt-2.5 flex items-baseline gap-1"><span className="text-[22px] font-extrabold text-[#1B4D3E]">{session.jumlah_kpm}</span><span className="text-[12px] font-medium text-gray-500">KPM</span></div>
                    <div className="mt-2 flex items-center gap-1.5 border-t border-gray-100 pt-2 text-[11px] font-medium text-gray-500"><span className="material-symbols-outlined text-[14px]">schedule</span><span>{session.waktu}</span></div>
                  </div>
                ))}
                {!loading && !selectedSchedule.sesi?.length && <p className="col-span-2 text-sm text-gray-500">Sesi penyaluran belum tersedia.</p>}
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

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}