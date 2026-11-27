import { useEffect, useState } from 'react';
import { adminApiClient } from '../../services/apiClient';
import { adminAuthService } from '../../services/admin/adminAuth';

const emptyForm = {
  nama_lengkap: '',
  username: '',
  no_hp: '',
  alamat_detail: '',
};

export default function AdminProfile() {
  const [profile, setProfile] = useState(() => adminAuthService.getCurrentUser());
  const [form, setForm] = useState(emptyForm);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    adminApiClient.get('/auth/me')
      .then(({ data }) => {
        setProfile(data);
        setForm({
          nama_lengkap: data.nama_lengkap || '',
          username: data.username || '',
          no_hp: data.no_hp || '',
          alamat_detail: data.alamat_detail || '',
        });
        localStorage.setItem('admin_user', JSON.stringify(data));
      })
      .catch((error) => setMessage(error.message || 'Profil admin gagal dimuat.'))
      .finally(() => setLoading(false));
  }, []);

  const initials = (profile?.nama_lengkap || 'Admin')
    .split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    if (password && password.length < 6) {
      setMessage('Password baru minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Konfirmasi password baru tidak cocok.');
      return;
    }
    try {
      setSaving(true);
      setMessage('');
      const { data } = await adminApiClient.patch('/auth/me', {
        ...form,
        ...(password ? { password } : {}),
      });
      setProfile(data);
      localStorage.setItem('admin_user', JSON.stringify(data));
      setPassword('');
      setConfirmPassword('');
      setMessage('Profil admin berhasil diperbarui.');
    } catch (error) {
      setMessage(error.message || 'Profil admin gagal diperbarui.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Pengaturan akun</p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Profil Admin</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola informasi akun petugas yang tampil di portal administrasi.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-gradient-to-r from-emerald-800 to-emerald-600" />
        <div className="-mt-10 flex items-center gap-4 px-6 pb-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-100 text-xl font-extrabold text-emerald-800 shadow-md">{initials}</div>
          <div className="pt-8">
            <h2 className="font-bold text-slate-900">{profile?.nama_lengkap || 'Administrator'}</h2>
            <p className="text-sm text-slate-500">Administrator · @{profile?.username || 'admin'}</p>
          </div>
        </div>
      </section>

      <form onSubmit={saveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">Nama lengkap<input name="nama_lengkap" value={form.nama_lengkap} onChange={updateField} disabled={loading || saving} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required /></label>
          <label className="text-sm font-semibold text-slate-700">Username<input name="username" value={form.username} onChange={updateField} disabled={loading || saving} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" required /></label>
          <label className="text-sm font-semibold text-slate-700">Nomor telepon<input name="no_hp" value={form.no_hp} onChange={updateField} disabled={loading || saving} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="text-sm font-semibold text-slate-700">Alamat<input name="alamat_detail" value={form.alamat_detail} onChange={updateField} disabled={loading || saving} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="text-sm font-semibold text-slate-700">Password baru<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={loading || saving} placeholder="Kosongkan jika tidak diubah" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
          <label className="text-sm font-semibold text-slate-700">Konfirmasi password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} disabled={loading || saving} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>
        </div>
        {message && <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p>}
        <button type="submit" disabled={loading || saving} className="mt-5 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-900 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan perubahan'}</button>
      </form>
    </div>
  );
}
