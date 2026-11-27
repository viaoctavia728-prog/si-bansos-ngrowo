import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { adminAuthService } from '../../services/admin/adminAuth';
import logoNgrowo from '../../images/logo ngrowo.png';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const adminUser = adminAuthService.getCurrentUser();
  const adminInitials = (adminUser?.nama_lengkap || 'Admin')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    adminAuthService.logout();
    // Tetap berada di alur portal petugas setelah logout admin.
    // Akses PIN portal sudah diberikan sebelum login admin.
    sessionStorage.setItem('staff_portal_access', 'granted');
    navigate('/admin/login', { replace: true });
  };

  const navLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'dashboard', aliases: ['/admin', '/admin/dashboard', '/admin/overview'] },
    { to: '/admin/warga', label: 'Kelola Warga', icon: 'groups', aliases: ['/admin/warga'] },
    { to: '/admin/penerima', label: 'Data Penerima', icon: 'folder_shared', aliases: ['/admin/penerima'] },
    { to: '/admin/pengaduan', label: 'Pengaduan', icon: 'assignment', aliases: ['/admin/pengaduan'] },
    { to: '/admin/jadwal', label: 'Jadwal & Broadcast', icon: 'calendar_month', aliases: ['/admin/jadwal', '/admin/notifikasi'] },
    { to: '/admin/audit-logs', label: 'Audit Log', icon: 'history_edu', aliases: ['/admin/audit-logs', '/admin/audit-log'] },
  ];

  const isLinkActive = (item) => {
    return item.aliases.some((alias) => {
      if (alias === '/admin' || alias === '/admin/dashboard') {
        return location.pathname === '/admin' || location.pathname === '/admin/' || location.pathname === '/admin/dashboard' || location.pathname === '/admin/overview';
      }
      return location.pathname.startsWith(alias);
    });
  };

  return (
    <div className="portal-surface admin-surface min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased">
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
            <span className="material-symbols-outlined text-[19px] text-[#166534]">verified</span>
            <div className="leading-tight">
              <span className="block text-[11px] font-bold text-emerald-950">Portal Resmi</span>
              <span className="block text-[10px] text-[#166534] font-medium">Pemerintah Desa</span>
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
                    ? 'bg-[#166534] text-white shadow-sm shadow-emerald-900/10'
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
        <header className="sticky top-0 z-30 flex h-16 sm:h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-8 backdrop-blur shadow-xs">
          {/* Mobile hamburger & logo */}
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
            <span className="text-xs font-bold text-slate-800">SI-BANSOS</span>
          </div>

          {/* Desktop Left Breadcrumb / Info */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Panel Administrasi</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-emerald-800">Pemerintah Desa Ngrowo</span>
          </div>

          {/* Notification control */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notification bell */}
            <Link
              to="/admin/notifikasi"
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:text-[#166534] transition-colors"
              title="Kirim Notifikasi Real-time"
              aria-label="Kirim Notifikasi"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"></span>
            </Link>
            <Link
              to="/admin/profil"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 text-left hover:bg-slate-50 transition-colors"
              title="Profil Admin"
              aria-label="Buka Profil Admin"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-xs font-extrabold text-white">{adminInitials}</span>
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
                        active ? 'bg-[#166534] text-white' : 'text-slate-600 hover:bg-slate-50'
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
          <Outlet />
        </main>
      </div>
    </div>
  );
}
