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
      <div className="mx-auto grid h-16 max-w-lg grid-cols-4">
        {links.map(([path, icon, label]) => (
          <NavLink key={path} to={`/${path}`} className={({ isActive }) => `flex flex-col items-center justify-center gap-1 text-[11px] ${isActive ? 'font-bold text-[#1b4d3e]' : 'text-gray-500'}`}>
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}