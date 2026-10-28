import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoNgrowo from '../../images/logo ngrowo.png';
import { adminAuthService } from '../../services/admin/adminAuth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await adminAuthService.login(username.trim(), password);
      navigate('/admin', { replace: true });
    } catch (error) {
      setErrorMessage(error.status === 401
        ? 'Username atau password salah. Pastikan akun yang digunakan memang akun admin.'
        : error.message || 'Login admin gagal. Gunakan akun petugas yang terdaftar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-blue-100/60 sm:p-8">
        <div className="text-center">
          <img
            src={logoNgrowo}
            alt="Logo Kelurahan Ngrowo"
            className="mx-auto h-16 w-16 rounded-2xl border border-[#EAF5EB] bg-[#F8F9FF] object-contain p-2"
          />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-[#2E7D32]">Area terbatas</p>
          <h1 className="mt-2 text-2xl font-extrabold text-[#212529]">Portal Petugas</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Halaman khusus petugas untuk mengelola layanan SI-BANSOS Ngrowo.
          </p>
        </div>

        {errorMessage && (
          <p role="alert" className="mt-6 rounded-xl border border-[#DC3545]/20 bg-[#DC3545]/5 p-3 text-sm text-[#DC3545]">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Username petugas
            <input
              type="text"
              autoComplete="username"
              maxLength={50}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Masukkan username petugas"
              required
              className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-[#2E7D32] focus:ring-2 focus:ring-[#2E7D32]/10"
            />
          </label>

        

          <label className="block text-sm font-semibold text-slate-700">
            Password
            <span className="relative mt-1.5 block">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan password petugas"
                required
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 pr-16 text-sm outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute inset-y-0 right-3 text-xs font-semibold text-emerald-800"
              >
                {showPassword ? 'Sembunyikan' : 'Lihat'}
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? 'Memverifikasi...' : 'Masuk ke Portal Petugas'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <Link to="/login" className="text-sm font-semibold text-emerald-800 hover:text-emerald-900">
            Kembali ke Portal Warga
          </Link>
        </div>
      </section>
    </main>
  );
}
