import { NavLink, Link } from 'react-router-dom';
import logoNgrowo from '../images/logo ngrowo.png';
import { useWargaLayout } from './WargaLayoutContext';

const navItems = [
  { path: '/dashboard', icon: 'home', label: 'Beranda' },
  { path: '/cek-bansos', icon: 'search', label: 'Cek Bansos' },
  { path: '/pengaduan', icon: 'edit_document', label: 'Pengaduan' },
  { path: '/info', icon: 'info', label: 'Info' },
];

export default function Footer() {
  const { collapsed } = useWargaLayout();

  return (
    <>
      {/* Footer utama (desktop) - layout terpusat */}
      <footer className={`mt-10 hidden border-t border-slate-200 bg-white transition-[padding] duration-300 lg:block ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}`}>
        <div className="warga-content flex flex-col items-center py-10 text-center">
          {/* Identitas singkat */}
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <img src={logoNgrowo} alt="Logo Kelurahan Ngrowo" className="h-11 w-11 shrink-0 rounded-xl border border-emerald-100 bg-primary-soft object-contain p-1" />
              <div className="text-left">
                <p className="text-base font-extrabold tracking-tight text-primary">SI-BANSOS NGROWO</p>
                <p className="text-xs text-slate-500">Sistem Informasi Bantuan Sosial</p>
              </div>
            </div>
            <p className="mt-3 max-w-lg text-xs leading-relaxed text-slate-500">
              Portal resmi pelayanan bantuan sosial Kelurahan Ngrowo, Kabupaten Bojonegoro. Menyajikan informasi transparan, akurat, dan tepat sasaran bagi warga.
            </p>
          </div>

          {/* Navigasi layanan */}
          <nav className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-500">
            <Link to="/dashboard" className="hover:text-primary">Beranda</Link>
            <span className="text-slate-300">|</span>
            <Link to="/cek-bansos" className="hover:text-primary">Cek Status Bansos</Link>
            <span className="text-slate-300">|</span>
            <Link to="/pengaduan" className="hover:text-primary">Pengaduan Warga</Link>
            <span className="text-slate-300">|</span>
            <Link to="/jadwal" className="hover:text-primary">Jadwal Penyaluran</Link>
            <span className="text-slate-300">|</span>
            <Link to="/info" className="hover:text-primary">Informasi &amp; FAQ</Link>
          </nav>

          {/* Kontak interaktif */}
          <div className="mt-6 flex flex-col items-center gap-3 text-sm sm:flex-row sm:justify-center sm:gap-8">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Kantor+Kelurahan+Ngrowo+Bojonegoro"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-600 transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
              <span>Kantor Kelurahan Ngrowo, Bojonegoro</span>
            </a>
            <a
              href="https://wa.me/6285807078899"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-slate-600 transition-colors hover:text-primary"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">call</span>
              <span>0858-0707-8899</span>
            </a>
            <span className="flex items-center gap-2 text-slate-600">
              <span className="material-symbols-outlined text-[20px] text-primary">schedule</span>
              <span>Senin&ndash;Jumat, 08.00&ndash;15.00 WIB</span>
            </span>
          </div>
        </div>

        {/* Bar hak cipta */}
        <div className="border-t border-slate-100 bg-slate-50/60">
          <div className="warga-content py-4 text-center">
            <p className="text-xs text-slate-500">&copy; {new Date().getFullYear()} Pemerintah Kelurahan Ngrowo. Hak cipta dilindungi.</p>
            <p className="mt-1 text-[11px] text-slate-400">Transparan &middot; Akuntabel &middot; Tepat Sasaran</p>
          </div>
        </div>
      </footer>

      {/* Footer ringkas (mobile & tablet) - tampil di atas navigasi bawah */}
      <footer className="mt-8 border-t border-slate-200 bg-white px-4 pb-24 pt-6 text-center lg:hidden">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="flex items-center gap-2.5">
            <img src={logoNgrowo} alt="Logo Kelurahan Ngrowo" className="h-9 w-9 shrink-0 rounded-lg border border-emerald-100 bg-primary-soft object-contain p-1" />
            <div className="text-left">
              <p className="text-sm font-extrabold tracking-tight text-primary">SI-BANSOS NGROWO</p>
              <p className="text-[11px] text-slate-500">Sistem Informasi Bantuan Sosial</p>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500">
            Portal resmi pelayanan bantuan sosial Kelurahan Ngrowo, Kabupaten Bojonegoro.
          </p>
          <div className="mt-3 flex w-full flex-col items-center gap-2 text-xs">
            <a
              href="https://www.google.com/maps/search/?api=1&query=Kantor+Kelurahan+Ngrowo+Bojonegoro"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-600 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
              <span>Kantor Kelurahan Ngrowo, Bojonegoro</span>
            </a>
            <a
              href="https://wa.me/6285807078899"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-slate-600 hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">call</span>
              <span>0858-0707-8899</span>
            </a>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
              <span>Senin&ndash;Jumat, 08.00&ndash;15.00 WIB</span>
            </span>
          </div>
          <p className="mt-3 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
            &copy; {new Date().getFullYear()} Pemerintah Kelurahan Ngrowo
          </p>
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
