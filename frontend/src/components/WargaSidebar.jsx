import { NavLink, useLocation } from 'react-router-dom';
import logoNgrowo from '../images/logo ngrowo.png';
import { useWargaLayout } from './WargaLayoutContext';

export const wargaNavItems = [
  { path: '/dashboard', icon: 'home', label: 'Beranda' },
  { path: '/cek-bansos', icon: 'search', label: 'Cek Bansos' },
  { path: '/pengaduan', icon: 'edit_document', label: 'Pengaduan' },
  { path: '/info', icon: 'info', label: 'Info' },
];

function SidebarContent({ collapsed, onNavigate }) {
  return (
    <>
      <div className={`flex items-center gap-3 border-b border-slate-100 ${collapsed ? 'justify-center px-2 py-5' : 'px-5 py-6'}`}>
        <img
          src={logoNgrowo}
          alt="Logo Kelurahan Ngrowo"
          className="h-10 w-10 shrink-0 rounded-lg border border-emerald-100 bg-emerald-50 object-contain p-1"
        />
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="truncate text-sm font-extrabold leading-tight tracking-tight text-[#166534]">SI-BANSOS NGROWO</h1>
            <p className="truncate text-[11px] font-medium text-slate-500">Sistem Informasi Bantuan Sosial</p>
          </div>
        )}
      </div>

      <nav aria-label="Navigasi warga" className={`flex flex-1 flex-col gap-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3.5'}`}>
        {wargaNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl text-sm font-semibold transition-all ${
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3.5 py-2'
              } ${
                isActive
                  ? 'bg-[#166534] text-white shadow-sm shadow-emerald-900/10'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined shrink-0 text-[20px] ${isActive ? 'text-white' : 'text-slate-400'}`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}

export default function WargaSidebar() {
  const { collapsed, openMobile, setOpenMobile } = useWargaLayout();
  const location = useLocation();

  return (
    <>
      {/* Sidebar desktop (collapsible) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300 lg:flex ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Drawer slide-in untuk tablet/mobile lewat tombol hamburger di Header */}
      <div
        className={`fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          openMobile ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setOpenMobile(false)}
      >
        <aside
          key={location.pathname}
          className={`flex h-full w-72 max-w-[82%] flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
            openMobile ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <SidebarContent collapsed={false} onNavigate={() => setOpenMobile(false)} />
        </aside>
      </div>
    </>
  );
}
