import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { notificationService } from '../services/api';

export default function NotificationDrawer({ open, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [pendingIds, setPendingIds] = useState([]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoading(true);
    setError('');

    notificationService.getNotifications()
      .then((list) => {
        if (active) setNotifications(Array.isArray(list) ? list : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Notifikasi belum dapat dimuat.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open]);

  const handleMarkAsRead = async (idNotification) => {
    setPendingIds((current) => [...current, idNotification]);
    setError('');
    try {
      await notificationService.markAsRead(idNotification);
      setNotifications((current) => current.map((item) => (
        item.id_notification === idNotification
          ? { ...item, is_read: true, read_at: new Date().toISOString() }
          : item
      )));
    } catch (requestError) {
      setError(requestError.message || 'Status baca gagal disimpan.');
    } finally {
      setPendingIds((current) => current.filter((id) => id !== idNotification));
    }
  };

  const handleDismiss = async (idNotification) => {
    setPendingIds((current) => [...current, idNotification]);
    setError('');
    try {
      await notificationService.dismissNotification(idNotification);
      setNotifications((current) => current.filter((item) => item.id_notification !== idNotification));
    } catch (requestError) {
      setError(requestError.message || 'Notifikasi gagal dihapus.');
    } finally {
      setPendingIds((current) => current.filter((id) => id !== idNotification));
    }
  };

  if (!open) return null;

  const unreadCount = notifications.filter((item) => !item.is_read && !item.read_at).length;
  const visibleNotifications = filter === 'unread'
    ? notifications.filter((item) => !item.is_read && !item.read_at)
    : notifications;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Tutup panel notifikasi"
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-slate-950/25"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-drawer-title"
        className="notification-drawer-enter fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-emerald-100 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between bg-primary px-5 py-5 text-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100">Informasi Desa Ngrowo</p>
            <h2 id="notification-drawer-title" className="mt-1 text-lg font-extrabold text-white">Pemberitahuan</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup notifikasi"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter notifikasi"
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-emerald-600 focus:outline-none"
          >
            <option value="all">Semua</option>
            <option value="unread">Belum dibaca ({unreadCount})</option>
          </select>
          <span className="shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            {notifications.length} info
          </span>
        </div>

        {error && (
          <div role="alert" className="mx-4 mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Memuat notifikasi...
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">notifications_off</span>
              <p className="mt-2 text-sm font-bold text-primary">Tidak ada notifikasi</p>
            </div>
          ) : visibleNotifications.map((item) => {
            const isRead = !!item.read_at || !!item.is_read;
            const isPending = pendingIds.includes(item.id_notification);
            return (
              <article
                key={item.id_notification}
                className={`rounded-xl border p-4 ${
                  isRead ? 'border-emerald-100 bg-white' : 'border-emerald-200 bg-primary-soft/70'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                      {isRead ? 'Pemberitahuan Desa' : 'Belum dibaca'}
                    </p>
                    <h3 className="mt-1 text-sm font-bold text-slate-900">{item.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDismiss(item.id_notification)}
                    disabled={isPending}
                    aria-label={`Hapus notifikasi: ${item.title}`}
                    title="Hapus notifikasi"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-[19px] ${isPending ? 'animate-spin' : ''}`}>
                      {isPending ? 'progress_activity' : 'delete'}
                    </span>
                  </button>
                </div>
                <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600">{item.body}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : 'Baru saja'}
                  </span>
                  {!isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(item.id_notification)}
                      disabled={isPending}
                      className="text-[11px] font-bold text-emerald-800 hover:underline disabled:opacity-50"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

      </aside>
    </>,
    document.body,
  );
}
