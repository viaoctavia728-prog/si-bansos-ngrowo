import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { adminAuthService } from '../../services/admin/adminAuth';
import logoNgrowo from '../../images/logo ngrowo.png';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => adminAuthService.getCurrentUser());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const handleProfileUpdated = (event) => {
      if (event?.detail) {
        setCurrentUser(event.detail);
      } else {
        setCurrentUser(adminAuthService.getCurrentUser());
      }
    };
    window.addEventListener('admin-profile-updated', handleProfileUpdated);
    return () => window.removeEventListener('admin-profile-updated', handleProfileUpdated);
  }, []);

  const handleLogout = () => {
    adminAuthService.logout();
    navigate('/admin/login', { replace: true });
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', aliases: ['/admin', '/admin/dashboard', '/admin/overview'] },
    { to: '/admin/warga', label: 'Kelola Warga', icon: 'groups', aliases: ['/admin/warga'] },
    { to: '/admin/penerima', label: 'Data Penerima', icon: 'folder_shared', aliases: ['/admin/penerima'] },
    { to: '/admin/pengaduan', label: 'Pengaduan', icon: 'assignment', aliases: ['/admin/pengaduan'] },
    { to: '/admin/jadwal', label: 'Jadwal Bansos', icon: 'calendar_month', aliases: ['/admin/jadwal'] },
    { to: '/admin/notifikasi', label: 'Broadcast Notifikasi', icon: 'notifications_active', aliases: ['/admin/notifikasi'] },
    { to: '/admin/audit-logs', label: 'Audit Log', icon: 'history_edu', aliases: ['/admin/audit-logs', '/admin/audit-log'] },
    { to: '/admin/profil', label: 'Profil Admin', icon: 'account_circle', aliases: ['/admin/profil'] },
  ];

  const isLinkActive = (item) => {
    return item.aliases.some((alias) => {
      if (alias === '/admin' || alias === '/admin/dashboard') {
        return location.pathname === '/admin' || location.pathname === '/admin/' || location.pathname === '/admin/dashboard' || location.pathname === '/admin/overview';
      }
      return location.pathname.startsWith(alias);
    });
  };

  const adminName = currentUser?.nama_lengkap || 'Pak Bambang';
  const adminRole = currentUser?.role === 'admin' ? 'Sekdes Ngrowo' : 'Perangkat Desa';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased">
      {/* SIDEBAR DESKTOP */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex shadow-sm">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-100">
          <img
            src={logoNgrowo}
            alt="Logo Ngrowo"
            className="h-10 w-10 object-contain rounded-lg p-1 bg-emerald-50 border border-emerald-100"
          />
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-[#166534] leading-tight">
              SI-BANSOS NGROWO
            </h1>
            <p className="text-[11px] font-medium text-slate-500">Desa Ngrowo, Bojonegoro</p>
          </div>
        </div>

        {/* Portal Resmi Badge */}
        <div className="px-5 pt-4 pb-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100/80 px-3 py-2 text-emerald-900">
            <span className="material-symbols-outlined text-[19px] text-emerald-700">verified</span>
            <div className="leading-tight">
              <span className="block text-[11px] font-bold text-emerald-950">Portal Resmi</span>
              <span className="block text-[10px] text-emerald-700 font-medium">Pemerintah Desa</span>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav aria-label="Navigasi admin" className="flex flex-col gap-1 px-3.5 py-4 flex-1 overflow-y-auto">
          {navLinks.map((item) => {
            const active = isLinkActive(item);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#1b7340] text-white shadow-sm shadow-emerald-900/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${active ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Bottom */}
        <div className="border-t border-slate-100 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-rose-500">logout</span>
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* TOPBAR / HEADER */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-8 backdrop-blur shadow-xs">
          {/* Mobile hamburger */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Buka menu"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
            <img src={logoNgrowo} alt="Logo" className="h-8 w-8 object-contain" />
          </div>

          {/* Search bar in header */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-0">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Cari NIK, Nama Warga, atau ID Bansos..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
              />
            </div>
          </div>

          {/* User profile & Notification right side */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notification bell */}
            <Link
              to="/admin/notifikasi"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-emerald-800 transition-colors"
              title="Kirim Notifikasi Real-time"
              aria-label="Kirim Notifikasi"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </Link>

            {/* Profile chip (Clickable to /admin/profil) */}
            <Link
              to="/admin/profil"
              className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-200 hover:opacity-85 transition-opacity group cursor-pointer"
              title="Buka Pengaturan Profil Admin"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white font-bold shadow-xs group-hover:ring-2 group-hover:ring-emerald-400 transition-all">
                <span className="material-symbols-outlined text-[20px]">account_circle</span>
              </div>
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{adminName}</p>
                <p className="text-[11px] text-slate-500 font-medium">{adminRole}</p>
              </div>
            </Link>
          </div>
        </header>

        {/* MOBILE DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs lg:hidden" onClick={() => setMobileMenuOpen(false)}>
            <div className="fixed inset-y-0 left-0 w-64 bg-white p-5 shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <img src={logoNgrowo} alt="Logo" className="h-8 w-8 object-contain" />
                  <span className="text-xs font-extrabold text-[#166534]">SI-BANSOS NGROWO</span>
                </div>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="text-slate-500">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <nav className="flex flex-col gap-1 py-4 flex-1 overflow-y-auto">
                {navLinks.map((item) => {
                  const active = isLinkActive(item);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                        active ? 'bg-[#1b7340] text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}

        {/* OUTLET FOR SUBPAGES */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet context={{ globalSearch }} />
        </main>
      </div>
    </div>
  );
}
