import { Link } from 'react-router-dom';
import logoNgrowo from '../images/logo ngrowo.png';
import { authService } from '../services/auth';
import { getAssetUrl } from '../services/apiClient';
import { useWargaLayout } from './WargaLayoutContext';

export default function Header({ title, eyebrow = 'Layanan Mandiri Desa', backTo, action }) {
  const { collapsed, toggle, setOpenMobile } = useWargaLayout();
  const user = authService.getCurrentUser();
  const initials = user?.nama_lengkap?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'W';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      {/* Bar navigasi utama */}
      <div className="content-width flex h-16 items-center justify-between gap-3 sm:h-[72px]">
        <div className="flex min-w-0 items-center gap-3">
          {/* Toggle sidebar: hamburger di mobile, collapse di desktop */}
          <button
            type="button"
            onClick={() => {
              if (window.matchMedia('(min-width: 1024px)').matches) toggle();
              else setOpenMobile(true);
            }}
            aria-label="Buka menu navigasi"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {backTo && (
            <Link
              to={backTo}
              aria-label="Kembali"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          )}

          {backTo ? (
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
              <h1 className="truncate text-base font-bold text-slate-900 sm:text-lg">{title}</h1>
            </div>
          ) : (
            <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
              <img src={logoNgrowo} alt="Logo Kelurahan Ngrowo" className="h-11 w-11 shrink-0 rounded-xl border border-emerald-100 bg-primary-soft object-contain p-1" />
              <div className="min-w-0">
                <span className="block truncate text-sm font-extrabold leading-tight text-primary sm:text-base">SI-BANSOS NGROWO</span>
                <span className="block truncate text-[11px] font-medium text-slate-500">Sistem Informasi Bantuan Sosial</span>
              </div>
            </Link>
          )}
        </div>

        {/* Navigasi desktop dipindahkan ke sidebar kiri (WargaSidebar) */}
        {!backTo && <div className="hidden flex-1 lg:block" />}

        <div className="flex items-center gap-2">
          {action}
          <Link
            to="/notifikasi"
            aria-label="Buka pengumuman & notifikasi"
            title="Pengumuman & Notifikasi"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-primary"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </Link>
          <Link
            to="/profil"
            aria-label="Buka profil warga"
            title="Buka profil warga"
            className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-1 transition hover:border-emerald-300 sm:pr-3"
          >
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary text-[11px] font-bold text-white">
              {user?.foto_profil ? <img src={getAssetUrl(user.foto_profil)} alt="" className="h-full w-full object-cover" /> : initials}
            </span>
            <span className="hidden max-w-[120px] truncate text-xs font-semibold text-slate-700 sm:inline">
              {user?.nama_lengkap?.split(' ')[0] || 'Warga'}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
