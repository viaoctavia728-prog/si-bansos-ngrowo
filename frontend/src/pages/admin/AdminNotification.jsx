import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/admin/adminApi';

const QUICK_TEMPLATES = [
  {
    label: 'Jadwal Beras CPP',
    title: 'Pengumuman Penyaluran Beras CPP 10 Kg',
    body: 'Penyaluran beras bantuan pangan CPP 10 Kg akan dilaksanakan di Pendopo Balai Desa Ngrowo. Harap membawa KTP & KK Asli serta undangan barcode.',
  },
  {
    label: 'Penyaluran BLT-DD',
    title: 'Jadwal Pembagian BLT Dana Desa',
    body: 'Bantuan Langsung Tunai (BLT-DD) akan disalurkan di Ruang Pelayanan Kantor Kelurahan Ngrowo. Warga KPM dimohon hadir tepat waktu.',
  },
  {
    label: 'Penyaluran BPNT Sembako',
    title: 'Informasi Penyaluran Sembako BPNT',
    body: 'Penyaluran BPNT Sembako telah siap di E-Warong Amanah Makmur. Harap membawa Kartu Keluarga Sejahtera (KKS) dan KTP.',
  },
  {
    label: 'Verifikasi Pengaduan',
    title: 'Pemberitahuan Hasil Verifikasi Bansos',
    body: 'Tim verifikasi lapangan Desa Ngrowo telah memperbarui status aduan kelayakan bansos. Silakan pantau nomor tiket aduan Anda.',
  },
];

export default function AdminNotification() {
  const [form, setForm] = useState({
    title: '',
    body: '',
  });

  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const data = await adminService.getNotifications();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat daftar pengumuman.' });
    }
  };

  const handleApplyTemplate = (tmpl) => {
    setForm((prev) => ({
      ...prev,
      title: tmpl.title,
      body: tmpl.body,
    }));
    setFeedback(null);
  };

  const handleArchiveAnnouncement = async () => {
    if (!archiveTarget) return;
    try {
      setArchiving(true);
      await adminService.archiveNotification(archiveTarget.id_notification);
      setAnnouncements((prev) => prev.map((item) => (
        item.id_notification === archiveTarget.id_notification ? { ...item, is_archived: true } : item
      )));
      setFeedback({ type: 'success', message: 'Pengumuman diarsipkan dan tidak lagi tampil di warga. Riwayatnya tetap tersimpan.' });
      setArchiveTarget(null);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengarsipkan pengumuman.' });
    } finally {
      setArchiving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      setFeedback(null);
      await adminService.sendNotification({ title: form.title, body: form.body });

      setFeedback({
        type: 'success',
        message: 'Pengumuman berhasil dikirim ke semua warga.',
      });
      setForm({ title: '', body: '' });

      await loadAnnouncements();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal mengirim notifikasi. Periksa konfigurasi FCM atau server backend.',
      });
    } finally {
      setSending(false);
    }
  };

  const visibleAnnouncements = announcements.filter((item) => Boolean(item.is_archived) === showArchived);
  const archivedCount = announcements.filter((item) => item.is_archived).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Broadcast Pengumuman
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kirim pengumuman singkat ke semua warga Desa Ngrowo.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-[#166534] border border-emerald-200'
              : feedback.type === 'warning'
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {feedback.type === 'success' ? 'check_circle' : feedback.type === 'warning' ? 'warning' : 'error'}
          </span>
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          {/* Quick Templates */}
          <div>
            <span className="text-xs font-bold text-slate-600 block mb-2">Template Informasi Cepat</span>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-900 text-xs font-bold text-slate-700 transition-colors"
                >
                  + {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Judul Notifikasi</label>
                <span className="text-[10px] text-slate-400 font-mono">{form.title.length}/120</span>
              </div>
              <input
                required
                maxLength={120}
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contoh: Jadwal Penyaluran Beras CPP 10 Kg Desa Ngrowo"
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-xs sm:text-sm font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Isi Pesan Notifikasi</label>
                <span className="text-[10px] text-slate-400 font-mono">{form.body.length}/500</span>
              </div>
              <textarea
                required
                maxLength={500}
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="Tuliskan rincian jadwal, tanggal, jam, persyaratan, atau informasi penting lainnya..."
                className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="gov-btn-primary"
              >
                <span className={`material-symbols-outlined text-[18px] ${sending ? 'animate-spin' : ''}`}>
                  {sending ? 'progress_activity' : 'send'}
                </span>
                {sending ? 'Mengirim...' : 'Kirim Notifikasi ke Warga'}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-1">Riwayat Pengumuman Warga</h3>
              <p className="text-[11px] text-slate-500">
                {showArchived
                  ? 'Pengumuman yang diarsipkan tidak lagi tampil kepada warga.'
                  : 'Pengumuman aktif yang sedang tampil kepada warga.'}
              </p>
            </div>
            <div className="inline-flex self-start rounded-xl bg-slate-100 p-1" role="group" aria-label="Filter pengumuman">
              <button
                type="button"
                onClick={() => setShowArchived(false)}
                aria-pressed={!showArchived}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  !showArchived ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aktif ({announcements.length - archivedCount})
              </button>
              <button
                type="button"
                onClick={() => setShowArchived(true)}
                aria-pressed={showArchived}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  showArchived ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Arsip ({archivedCount})
              </button>
            </div>
          </div>
          {visibleAnnouncements.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              {showArchived ? 'Belum ada pengumuman yang diarsipkan.' : 'Belum ada pengumuman aktif.'}
            </p>
          ) : (
            <div className="space-y-2">
              {visibleAnnouncements.map((announcement) => (
                <div key={announcement.id_notification} className={`rounded-xl border p-3 ${announcement.is_archived ? 'border-slate-200 bg-slate-100/70' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold text-slate-800">{announcement.title}</p>
                        {announcement.is_archived && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">Diarsipkan</span>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{announcement.body}</p>
                      <p className="mt-1 text-[10px] text-slate-400">{announcement.created_at ? new Date(announcement.created_at).toLocaleString('id-ID') : 'Waktu tidak tersedia'}</p>
                    </div>
                    {!announcement.is_archived && (
                      <button type="button" onClick={() => setArchiveTarget(announcement)} className="gov-btn-outline min-h-9 shrink-0 gap-1.5 px-2.5 py-1 text-[11px] text-amber-800 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900" title="Arsipkan pengumuman">
                        <span className="material-symbols-outlined text-[16px]">archive</span>
                        Arsipkan
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {archiveTarget && (
        <div className="modal-backdrop" role="presentation" onClick={() => !archiving && setArchiveTarget(null)}>
          <section className="modal-panel mx-auto max-w-lg" role="dialog" aria-modal="true" aria-labelledby="archive-notification-title" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">archive</span>
              <div>
                <h3 id="archive-notification-title" className="text-base font-bold text-slate-900">Arsipkan pengumuman?</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  “{archiveTarget.title}” tidak akan muncul lagi di halaman warga. Riwayat dan isi pengumuman tetap tersimpan.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" disabled={archiving} onClick={() => setArchiveTarget(null)} className="gov-btn-outline">Batal</button>
              <button type="button" disabled={archiving} onClick={handleArchiveAnnouncement} className="gov-btn-primary bg-amber-700 hover:bg-amber-800">
                <span className={`material-symbols-outlined text-[18px] ${archiving ? 'animate-spin' : ''}`}>{archiving ? 'progress_activity' : 'archive'}</span>
                {archiving ? 'Mengarsipkan...' : 'Ya, arsipkan'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
