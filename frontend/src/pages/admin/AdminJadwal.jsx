import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/admin/adminApi';

const WEEK_DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function AdminJadwal() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Dynamic calendar states based on real-time new Date()
  const today = useMemo(() => new Date(), []);
  const [displayedMonth, setDisplayedMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  // Modal State for adding new schedule
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    program: '',
    tanggal: '',
    jam: '08:30 - 12:00 WIB',
    lokasi: 'Pendopo Balai Desa Ngrowo',
    dusun: 'Semua Dusun Kelurahan Ngrowo',
    persyaratan: 'KTP Asli Penerima, Kartu Keluarga (KK), Undangan RT',
    status: 'Dijadwalkan',
  });

  const loadSchedules = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getJadwal();
      const list = Array.isArray(data) ? data : (data?.data ? (Array.isArray(data.data) ? data.data : [data.data]) : []);
      setSchedules(list);
    } catch (err) {
      setError(err.message || 'Gagal memuat jadwal penyaluran bansos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // Calendar calculations (strictly dynamic)
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const monthName = displayedMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarCells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  // Check which days in current month have events
  const scheduledDaysMap = useMemo(() => {
    const map = {};
    schedules.forEach((item) => {
      if (item.iso_date) {
        const d = new Date(item.iso_date);
        if (d.getFullYear() === year && d.getMonth() === month) {
          map[d.getDate()] = item;
        }
      } else if (item.tanggal) {
        const parts = item.tanggal.split(' ');
        const dayNum = parseInt(parts[0], 10);
        if (!isNaN(dayNum) && dayNum >= 1 && dayNum <= 31) {
          map[dayNum] = item;
        }
      }
    });
    return map;
  }, [schedules, year, month]);

  // Filtered schedules based on day selection
  const displayedSchedules = useMemo(() => {
    if (!selectedDay) return schedules;
    return schedules.filter((item) => {
      if (item.iso_date) {
        const d = new Date(item.iso_date);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
      }
      if (item.tanggal) {
        const parts = item.tanggal.split(' ');
        const dayNum = parseInt(parts[0], 10);
        return dayNum === selectedDay;
      }
      return false;
    });
  }, [schedules, selectedDay, year, month]);

  const handlePrevMonth = () => {
    setDisplayedMonth(new Date(year, month - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setDisplayedMonth(new Date(year, month + 1, 1));
    setSelectedDay(null);
  };

  const handleCurrentMonth = () => {
    setDisplayedMonth(new Date());
    setSelectedDay(null);
  };

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setFeedback(null);
      const reqPayload = {
        ...newSchedule,
        persyaratan: typeof newSchedule.persyaratan === 'string'
          ? newSchedule.persyaratan.split(',').map((p) => p.trim()).filter(Boolean)
          : newSchedule.persyaratan,
      };
      await adminService.createJadwal(reqPayload);
      setFeedback({ type: 'success', message: `Jadwal '${newSchedule.program}' berhasil dibuat dan disimpan!` });
      setIsAddModalOpen(false);
      setNewSchedule({
        program: '',
        tanggal: '',
        jam: '08:30 - 12:00 WIB',
        lokasi: 'Pendopo Balai Desa Ngrowo',
        dusun: 'Semua Dusun Kelurahan Ngrowo',
        persyaratan: 'KTP Asli Penerima, Kartu Keluarga (KK), Undangan RT',
        status: 'Dijadwalkan',
      });
      await loadSchedules();
    } catch (err) {
      const msg = err.status === 404 || err.message?.toLowerCase().includes('not found')
        ? `Endpoint penambahan jadwal tidak ditemukan di server (404 Not Found). Pastikan backend aktif.`
        : (err.message || 'Gagal menyimpan jadwal baru.');
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBroadcastSchedule = (item) => {
    navigate('/admin/notifikasi', {
      state: {
        prefillTitle: `Jadwal Penyaluran: ${item.program}`,
        prefillBody: `Penyaluran ${item.program} dijadwalkan pada ${item.tanggal} pukul ${item.jam} bertempat di ${item.lokasi}. Harap membawa persyaratan dokumen asli.`,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Link to="/admin/dashboard" className="flex items-center gap-1 hover:text-slate-800 transition-colors">
          <span className="material-symbols-outlined text-[16px]">home</span>
        </Link>
        <span>/</span>
        <span className="text-slate-600">Admin Desa</span>
        <span>/</span>
        <span className="text-emerald-700 font-bold">Manajemen Jadwal Penyaluran</span>
      </nav>

      {/* 2. HEADER & ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Jadwal Penyaluran Bansos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Kelola agenda pembagian bantuan sosial secara dinamis berbasis tanggal berjalan dan informasikan langsung kepada warga Desa Ngrowo.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <Link
            to="/admin/notifikasi"
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            Siarkan ke Warga
          </Link>
          <button
            type="button"
            onClick={() => {
              setNewSchedule((prev) => ({
                ...prev,
                tanggal: prev.tanggal || `${today.getDate()} ${monthName}`,
              }));
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1b7340] hover:bg-emerald-800 px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Tambah Jadwal
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between gap-3 shadow-xs transition-all ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">
              {feedback.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1"
            title="Tutup pesan"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl text-sm font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* 3. CALENDAR + SCHEDULE LIST (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dynamic Calendar Widget (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-emerald-700">calendar_month</span>
                <h3 className="text-sm font-extrabold text-slate-900 capitalize">{monthName}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCurrentMonth}
                  className="px-2 py-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors mr-1"
                  title="Kembali ke bulan ini"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                  aria-label="Bulan sebelumnya"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                  aria-label="Bulan berikutnya"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {WEEK_DAYS.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {calendarCells.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="h-10 rounded-xl" />;
                }

                const isToday =
                  day === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear();
                const isSelected = selectedDay === day;
                const hasEvent = Boolean(scheduledDaysMap[day]);

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                    className={`relative h-10 rounded-xl flex flex-col items-center justify-center font-bold transition-all ${
                      isSelected
                        ? 'bg-[#1b7340] text-white shadow-xs'
                        : isToday
                        ? 'border-2 border-emerald-600 text-emerald-800 bg-emerald-50/50'
                        : hasEvent
                        ? 'bg-emerald-50/70 text-emerald-900 hover:bg-emerald-100'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvent && (
                      <span
                        className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                          isSelected ? 'bg-white' : 'bg-emerald-600'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendar Footnote */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
              <span>Ada Penyaluran Bansos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border border-emerald-600 bg-emerald-50"></span>
              <span>Hari Ini ({today.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})</span>
            </div>
          </div>
        </div>

        {/* Schedule List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {selectedDay
                      ? `Jadwal Tanggal ${selectedDay} ${monthName}`
                      : 'Daftar Agenda Penyaluran Aktif'}
                  </h3>
                  {selectedDay && (
                    <button
                      type="button"
                      onClick={() => setSelectedDay(null)}
                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg transition-colors"
                    >
                      Lihat Semua
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {selectedDay
                    ? `Menampilkan jadwal bansos khusus pada ${selectedDay} ${monthName}`
                    : 'Seluruh agenda pembagian bansos di Kelurahan Ngrowo'}
                </p>
              </div>
              <button
                type="button"
                onClick={loadSchedules}
                disabled={loading}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                Refresh
              </button>
            </div>

            {/* List */}
            {loading ? (
              <div className="py-16 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl animate-spin text-emerald-600">
                  progress_activity
                </span>
                <p className="mt-2 text-xs font-semibold text-slate-600">Memuat agenda bansos...</p>
              </div>
            ) : displayedSchedules.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl text-slate-300">event_busy</span>
                <p className="mt-2 text-xs font-bold text-slate-700">
                  {selectedDay
                    ? `Tidak ada penyaluran bansos pada ${selectedDay} ${monthName}`
                    : 'Belum ada jadwal yang terdaftar'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {selectedDay ? (
                    <button
                      type="button"
                      onClick={() => setSelectedDay(null)}
                      className="text-emerald-700 font-bold underline"
                    >
                      Klik di sini untuk melihat semua jadwal
                    </button>
                  ) : (
                    "Klik 'Tambah Jadwal' untuk membuat agenda baru."
                  )}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-2 space-y-2">
                {displayedSchedules.map((item, index) => (
                  <div key={item.id || index} className="pt-3 pb-3 flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{item.program}</h4>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {item.status || 'Dijadwalkan'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-[15px]">event</span>
                          {item.tanggal} · {item.jam}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBroadcastSchedule(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors shrink-0 shadow-2xs"
                        title="Kirim notifikasi real-time jadwal ini ke warga"
                      >
                        <span className="material-symbols-outlined text-[15px]">send</span>
                        Broadcast
                      </button>
                    </div>

                    <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">location_on</span>
                        <strong>Lokasi:</strong> {item.lokasi}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">apartment</span>
                        <strong>Wilayah:</strong> {item.dusun || 'Seluruh Dusun Ngrowo'}
                      </p>
                      {item.persyaratan && (
                        <p className="flex items-start gap-1.5 pt-0.5">
                          <span className="material-symbols-outlined text-[15px] text-slate-400 shrink-0">assignment</span>
                          <span>
                            <strong>Syarat:</strong>{' '}
                            {Array.isArray(item.persyaratan) ? item.persyaratan.join(', ') : item.persyaratan}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. MODAL ADD NEW SCHEDULE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-base font-extrabold text-slate-900">Buat Jadwal Penyaluran Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Program Bantuan</label>
                <input
                  required
                  type="text"
                  value={newSchedule.program}
                  onChange={(e) => setNewSchedule({ ...newSchedule, program: e.target.value })}
                  placeholder="Contoh: BLT Dana Desa Tahap IV / Beras CPP 10 Kg"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pelaksanaan</label>
                  <input
                    required
                    type="text"
                    value={newSchedule.tanggal}
                    onChange={(e) => setNewSchedule({ ...newSchedule, tanggal: e.target.value })}
                    placeholder={`Contoh: 28 ${monthName}`}
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Waktu / Jam</label>
                  <input
                    required
                    type="text"
                    value={newSchedule.jam}
                    onChange={(e) => setNewSchedule({ ...newSchedule, jam: e.target.value })}
                    placeholder="Contoh: 08:30 - 14:00 WIB"
                    className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lokasi Pengambilan</label>
                <input
                  required
                  type="text"
                  value={newSchedule.lokasi}
                  onChange={(e) => setNewSchedule({ ...newSchedule, lokasi: e.target.value })}
                  placeholder="Contoh: Pendopo Balai Desa Ngrowo"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sasaran Wilayah / Dusun</label>
                <input
                  required
                  type="text"
                  value={newSchedule.dusun}
                  onChange={(e) => setNewSchedule({ ...newSchedule, dusun: e.target.value })}
                  placeholder="Contoh: Dusun Krajan (RT 01, 02) & Ngrowo Timur"
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Persyaratan Dokumen (pisahkan dengan koma)</label>
                <textarea
                  rows={2}
                  value={newSchedule.persyaratan}
                  onChange={(e) => setNewSchedule({ ...newSchedule, persyaratan: e.target.value })}
                  placeholder="KTP Asli Penerima, Kartu Keluarga (KK), Undangan RT"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1b7340] hover:bg-emerald-800 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-[17px] ${isSaving ? 'animate-spin' : ''}`}>
                    {isSaving ? 'progress_activity' : 'save'}
                  </span>
                  {isSaving ? 'Menyimpan...' : 'Simpan Jadwal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
