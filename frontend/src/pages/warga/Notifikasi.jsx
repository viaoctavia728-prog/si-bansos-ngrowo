import { useEffect, useState } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import WargaSidebar from '../../components/WargaSidebar';
import WargaMain from '../../components/WargaMain';
import { notificationService } from '../../services/api';

export default function Notifikasi() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingIds, setPendingIds] = useState([]);

  const fetchNotifications = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const list = await notificationService.getNotifications();
      setNotifications(Array.isArray(list) ? list : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Notifikasi belum dapat disinkronkan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
    const interval = window.setInterval(() => fetchNotifications(), 8000);
    return () => window.clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (idNotification) => {
    setPendingIds((prev) => [...prev, idNotification]);
    setError('');
    try {
      await notificationService.markAsRead(idNotification);
      const readAt = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.id_notification === idNotification ? { ...n, is_read: true, read_at: readAt } : n))
      );
    } catch (err) {
      setError(err.message || 'Status baca gagal disimpan. Silakan coba lagi.');
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== idNotification));
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read && !n.read_at).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <WargaSidebar />
      <WargaMain>
        <Header title="Pengumuman & Notifikasi" eyebrow="Informasi Desa Ngrowo" backTo="/dashboard" />

        <main className="warga-content flex flex-1 flex-col gap-4 pb-24 pt-5 sm:gap-5 sm:pt-7 lg:pb-10">
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-primary-soft/60 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="material-symbols-outlined text-[20px]">campaign</span>
              Total {notifications.length} info
            </div>
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white">{unreadCount} belum dibaca</span>
          </div>

          {error && (
            <div role="alert" className="flex flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => fetchNotifications(true)} className="gov-btn-outline min-h-9 self-start px-3 py-1 text-xs sm:self-auto">
                <span className="material-symbols-outlined text-[16px]">sync</span>
                Coba sinkronkan
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-xl bg-white p-6 text-sm font-medium text-slate-500">
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
              Memuat pengumuman...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
                <span className="material-symbols-outlined text-[28px]">notifications_off</span>
              </div>
              <h4 className="text-sm font-bold text-slate-800">Belum Ada Pengumuman</h4>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Pengumuman bansos, jadwal pembagian, dan informasi desa akan langsung muncul di sini secara otomatis.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isRead = !!item.read_at || !!item.is_read;
              return (
                <div
                  key={item.id_notification}
                  className={`animate-slide-up rounded-xl border p-4 transition-colors ${
                    !isRead ? 'border-emerald-200 bg-emerald-50/70 shadow-2xs' : 'border-slate-200 bg-white hover:bg-slate-50/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!isRead && <span className="flex h-2 w-2 rounded-full bg-emerald-600" />}
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Pemberitahuan Desa</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                        : 'Baru saja'}
                    </span>
                  </div>
                  <h4 className="mt-1 text-sm font-bold text-[#0F172A]">{item.title}</h4>
                  <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-500">{item.body}</p>
                  {!isRead && (
                    <div className="mt-2.5 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id_notification)}
                        disabled={pendingIds.includes(item.id_notification)}
                        className="gov-btn-soft min-h-9 px-3 py-1 text-[11px] disabled:cursor-wait disabled:opacity-60"
                      >
                        <span className={`material-symbols-outlined text-[15px] ${pendingIds.includes(item.id_notification) ? 'animate-spin' : ''}`}>
                          {pendingIds.includes(item.id_notification) ? 'progress_activity' : 'done'}
                        </span>
                        {pendingIds.includes(item.id_notification) ? 'Menyinkronkan...' : 'Tandai sudah dibaca'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </main>
        <Footer />
      </WargaMain>
    </div>
  );
}
