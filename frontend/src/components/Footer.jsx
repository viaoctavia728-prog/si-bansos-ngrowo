import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: 'home', label: 'Beranda' },
  { path: '/cek-bansos', icon: 'search', label: 'Cek Bansos' },
  { path: '/pengaduan', icon: 'edit_document', label: 'Pengaduan' },
  { path: '/info', icon: 'info', label: 'Info' },
];

export default function Footer() {
  return (
    <>
      {/* Footer utama (desktop) - layout terpusat */}
      <footer className="mt-10 block border-t border-slate-200 bg-white pb-20 lg:pb-0">
        <div className="warga-content px-4 py-4 text-center sm:px-0">
          <p className="text-xs text-slate-500">&copy; 2026 Pemerintah Kelurahan Ngrowo. Hak cipta dilindungi.</p>
          <p className="mt-1 text-[11px] text-slate-400">Transparan &middot; Akuntabel &middot; Tepat Sasaran</p>
        </div>
      </footer>

      {/* Navigasi bawah gaya Telegram (mobile & tablet) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 pb-safe shadow-[0_-2px_10px_rgba(15,23,42,0.06)] backdrop-blur lg:hidden">
        <div className="mx-auto flex h-16 max-w-xl items-stretch justify-around px-2">
          {navItems.map(({ path, icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition-all ${
                  isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`material-symbols-outlined text-[23px] transition-transform ${isActive ? 'scale-110' : 'group-active:scale-95'}`}
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    {icon}
                  </span>
                  <span>{label}</span>
                  {isActive && <span className="absolute top-0 h-0.5 w-7 rounded-full bg-primary" />}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
