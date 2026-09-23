import { NavLink } from 'react-router-dom';

const links = [
  ['dashboard', 'home', 'Beranda'],
  ['cek-bansos', 'search', 'Cek Bansos'],
  ['pengaduan', 'edit_document', 'Pengaduan'],
  ['jadwal', 'calendar_month', 'Info'],
];

export default function Footer() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white">
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4 px-2 pb-safe">
        {links.map(([path, icon, label]) => (
          <NavLink key={path} end={path === 'dashboard'} to={`/${path}`} className={({ isActive }) => `flex h-full min-h-[48px] flex-col items-center justify-center text-[11px] transition-colors ${isActive ? 'font-bold text-[#1b4d3e]' : 'text-gray-500 hover:text-[#1b4d3e]'}`}>
            {({ isActive }) => (
              <>
                <span className="material-symbols-outlined text-[22px]">{icon}</span>
                <span className="mt-0.5 leading-tight">{label}</span>
                <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#1b4d3e]' : 'bg-transparent'}`}></span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}