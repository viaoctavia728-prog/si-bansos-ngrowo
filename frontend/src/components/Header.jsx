import { Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { getAssetUrl } from '../services/apiClient';

export default function Header({ title, eyebrow = 'Layanan Mandiri Desa', backTo, action }) {
  const user = authService.getCurrentUser();
  const initials = user?.nama_lengkap?.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'W';

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="content-width flex h-16 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {backTo && <Link to={backTo} aria-label="Kembali" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100"><span className="material-symbols-outlined">arrow_back</span></Link>}
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-wider text-[#1b4d3e]">{eyebrow}</p>
            <h1 className="truncate text-[18px] font-bold text-gray-900">{title}</h1>
          </div>
        </div>
        {action || (
          <Link to="/profil" aria-label="Buka profil warga" title="Buka profil warga" className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-200 bg-emerald-800 text-xs font-bold text-white">
            {user?.foto_profil ? <img src={getAssetUrl(user.foto_profil)} alt="" className="h-full w-full object-cover" /> : initials}
          </Link>
        )}
      </div>
    </header>
  );
}