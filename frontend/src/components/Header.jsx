import { Link } from 'react-router-dom';

export default function Header({ title, eyebrow = 'Layanan Mandiri Desa', backTo, action }) {
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
        {action || <span className="material-symbols-outlined text-[#1b4d3e]">account_circle</span>}
      </div>
    </header>
  );
}