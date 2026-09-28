import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/dashboard', icon: 'home', label: 'Beranda' },
  { path: '/cek-bansos', icon: 'search', label: 'Cek Bansos' },
  { path: '/pengaduan', icon: 'edit_document', label: 'Pengaduan' },
  { path: '/jadwal', icon: 'info', label: 'Info' },
];

export default function Footer() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-sm">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
        {navItems.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-1 transition-colors relative ${
                isActive ? 'text-[#1B4D3E] font-bold' : 'text-[#5c685b] hover:text-gray-900 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className="material-symbols-outlined text-[22px]"
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span className="text-[11px]">{label}</span>
                {isActive && (
                  <span className="w-4 h-0.5 rounded-full absolute bottom-0 bg-[#1B4D3E]"></span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}