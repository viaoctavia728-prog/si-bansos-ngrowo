import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
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
  const location = useLocation();
  const prefill = location.state || {};

  const [form, setForm] = useState({
    title: prefill.prefillTitle || '',
    body: prefill.prefillBody || '',
    targetType: 'all',
    targetToken: '',
  });

  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);

  useEffect(() => {
    loadRecentLogs();
  }, []);

  const loadRecentLogs = async () => {
    try {
      const logs = await adminService.getAuditLogs();
      const notifLogs = Array.isArray(logs)
        ? logs.filter((l) => (l.aktivitas || '').toLowerCase().includes('notifikasi'))
        : [];
      setRecentLogs(notifLogs.slice(0, 5));
    } catch {
      // ignore
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      setFeedback(null);

      let result;
      if (form.targetType === 'token' && form.targetToken) {
        result = await adminService.sendNotificationToToken({
          title: form.title,
          body: form.body,
        target_token: form.targetToken,
      });
      } else {
        result = await adminService.sendNotification({
          title: form.title,
          body: form.body,
        });
      }

      setFeedback({
        type: 'success',
        message: `Notifikasi berhasil disiarkan! Pesan otomatis tersimpan di database dan langsung muncul secara real-time di dashboard seluruh warga tanpa hambatan izin browser.`,
      });

      await loadRecentLogs();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal mengirim notifikasi. Periksa konfigurasi FCM atau server backend.',
      });
    } finally {
      setSending(false);
    }
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
        <span className="text-emerald-700 font-bold">Broadcast Notifikasi Warga</span>
      </nav>

      {/* 2. TITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Broadcast Notifikasi Real-time Warga
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kirimkan informasi jadwal penyaluran bansos, pengumuman penting, dan pembaruan status langsung ke perangkat warga Desa Ngrowo.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
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

      {/* 3. MAIN FORM & PREVIEW (2 COLUMNS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
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
            {/* Target Audience */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Target Penerima Notifikasi</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetType: 'all' })}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    form.targetType === 'all'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-emerald-700">cell_tower</span>
                  <div>
                    <p className="text-xs font-bold">Semua Warga (In-App Real-time)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Muncul otomatis di dashboard seluruh warga</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, targetType: 'token' })}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    form.targetType === 'token'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px] text-emerald-700">person_pin</span>
                  <div>
                    <p className="text-xs font-bold">Perangkat Tertentu</p>
                    <p className="text-[10px] text-slate-500 font-normal">Kirim via target FCM device token</p>
                  </div>
                </button>
              </div>
            </div>

            {form.targetType === 'token' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target FCM Device Token</label>
                <input
                  required
                  type="text"
                  value={form.targetToken}
                  onChange={(e) => setForm({ ...form, targetToken: e.target.value })}
                  placeholder="Masukkan token FCM perangkat..."
                  className="h-10 w-full rounded-xl border border-slate-300 px-3 font-mono text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>
            )}

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
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">verified</span>
                Didukung Firebase Cloud Messaging (FCM) & In-App Real-time
              </span>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1b7340] hover:bg-emerald-800 px-6 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors shadow-xs disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${sending ? 'animate-spin' : ''}`}>
                  {sending ? 'progress_activity' : 'send'}
                </span>
                {sending ? 'Mengirim...' : 'Kirim Notifikasi ke Warga'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Smartphone Preview Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Simulasi Tampilan di HP Warga</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Live Preview
              </span>
            </div>

            {/* Smartphone Mockup Card */}
            <div className="mx-auto max-w-[280px] bg-slate-900 rounded-3xl p-3 border-4 border-slate-800 shadow-xl">
              {/* Notch */}
              <div className="h-4 w-24 bg-slate-800 rounded-full mx-auto mb-4"></div>

              {/* Push notification banner */}
              <div className="bg-white/95 backdrop-blur rounded-2xl p-3 shadow-lg border border-slate-100/50 animate-in fade-in">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                    <span className="material-symbols-outlined text-[13px]">shield</span>
                    SI-BANSOS NGROWO
                  </div>
                  <span>baru saja</span>
                </div>
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {form.title || 'Judul Notifikasi Pengumuman Bansos'}
                </p>
                <p className="text-[11px] text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                  {form.body || 'Isi pesan pemberitahuan jadwal pembagian bansos yang dikirim oleh admin kelurahan.'}
                </p>
              </div>

              {/* Bottom home indicator */}
              <div className="h-1 w-20 bg-slate-700 rounded-full mx-auto mt-24"></div>
            </div>
          </div>

          {/* Recent Broadcast Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-extrabold text-slate-900 mb-1">Riwayat Siaran Terakhir</h3>
            <p className="text-[11px] text-slate-500 mb-3">Terekam otomatis di Audit Log sistem</p>

            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada riwayat pengiriman notifikasi.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {recentLogs.map((log) => (
                  <div key={log.id_log} className="py-2.5">
                    <p className="font-semibold text-slate-800 text-[11px] leading-tight">{log.aktivitas}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('id-ID') : '-'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
