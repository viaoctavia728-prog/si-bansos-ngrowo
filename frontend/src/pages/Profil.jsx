import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, bansosService, getAssetUrl } from '../services/api';
import { enablePushNotifications, isFcmConfigured } from '../services/firebase';

const PROFILE_FIELDS = [
  ['nama_lengkap', 'Nama lengkap'],
  ['no_kk', 'Nomor Kartu Keluarga'],
  ['no_hp', 'Nomor telepon'],
  ['rt', 'RT'],
  ['rw', 'RW'],
  ['alamat_detail', 'Alamat lengkap'],
];

export default function Profil() {
  const navigate = useNavigate();
  const photoInputRef = useRef(null);
  const [profile, setProfile] = useState(() => authService.getCurrentUser());
  const [form, setForm] = useState(() => profileToForm(authService.getCurrentUser()));
  const [bansos, setBansos] = useState([]);
  const [activeSection, setActiveSection] = useState(() => new URLSearchParams(window.location.search).get('section') || 'biodata');
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushLoading, setPushLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedUser = authService.getCurrentUser();
    if (!cachedUser) {
      navigate('/login', { replace: true });
      return;
    }
    if (cachedUser.role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }

    let active = true;
    Promise.allSettled([
      authService.getProfile(),
      cachedUser.nik ? bansosService.cekBansosByNik(cachedUser.nik) : Promise.resolve([]),
    ]).then(([profileResult, bansosResult]) => {
      if (!active) return;
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
        setForm(profileToForm(profileResult.value));
      } else {
        setMessage(profileResult.reason?.message || 'Data profil gagal dimuat.');
      }
      if (bansosResult.status === 'fulfilled') {
        setBansos(Array.isArray(bansosResult.value) ? bansosResult.value : []);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [navigate]);

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      const updated = await authService.updateProfile(form);
      setProfile(updated);
      setForm(profileToForm(updated));
      setMessage('Profil berhasil diperbarui.');
    } catch (error) {
      setMessage(error.message || 'Profil gagal diperbarui.');
    } finally {
      setSaving(false);
    }
  };

  const uploadProfilePhoto = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Foto harus berformat JPG, PNG, atau WEBP.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Ukuran foto maksimal 2 MB.');
      event.target.value = '';
      return;
    }
    try {
      setPhotoSaving(true);
      setMessage('');
      const updated = await authService.updateProfilePhoto(file);
      setProfile(updated);
      setMessage('Foto profil berhasil diperbarui.');
    } catch (error) {
      setMessage(error.message || 'Foto profil gagal diunggah.');
    } finally {
      setPhotoSaving(false);
      event.target.value = '';
    }
  };

  const removeProfilePhoto = async () => {
    try {
      setPhotoSaving(true);
      setMessage('');
      const updated = await authService.removeProfilePhoto();
      setProfile(updated);
      setMessage('Foto profil berhasil dihapus.');
    } catch (error) {
      setMessage(error.message || 'Foto profil gagal dihapus.');
    } finally {
      setPhotoSaving(false);
    }
  };

  const enableNotifications = async () => {
    try {
      setPushLoading(true);
      setPushMessage('');
      await enablePushNotifications();
      setPushMessage('Notifikasi aktif pada perangkat ini.');
    } catch (error) {
      setPushMessage(error.message || 'Notifikasi belum dapat diaktifkan.');
    } finally {
      setPushLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  const initials = (profile?.nama_lengkap || 'Warga')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f4f7f3] text-[#17211b]">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/dashboard" aria-label="Kembali ke dashboard" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="min-w-0">
              <p className="truncate text-[10px] font-bold uppercase text-emerald-800">Portal Warga Ngrowo</p>
              <h1 className="truncate text-sm font-bold">Profil &amp; Pengaturan Akun</h1>
            </div>
          </div>
          <Link to="/dashboard" aria-label="Dashboard" className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-900 hover:bg-emerald-100">
            <span className="material-symbols-outlined">home</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 pb-8 pt-4">
        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="h-20 bg-[radial-gradient(ellipse_at_top,#d9f5df,transparent_72%)]" />
          <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
            <div className="relative h-20 w-20">
              {profile?.foto_profil ? (
                <img src={getAssetUrl(profile.foto_profil)} alt={`Foto profil ${profile.nama_lengkap || 'warga'}`} className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-md" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-800 text-xl font-bold text-white shadow-md" aria-label={`Inisial ${initials}`}>
                  {initials}
                </div>
              )}
              <button type="button" disabled={photoSaving} onClick={() => photoInputRef.current?.click()} title="Ubah foto profil" aria-label="Ubah foto profil" className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-800 text-white shadow-sm hover:bg-emerald-900 disabled:opacity-60">
                <span className="material-symbols-outlined text-[15px]">{photoSaving ? 'progress_activity' : 'photo_camera'}</span>
              </button>
              <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadProfilePhoto} className="sr-only" aria-label="Pilih foto profil" />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoSaving} className="text-[10px] font-semibold text-emerald-800 hover:underline disabled:opacity-60">{photoSaving ? 'Mengunggah foto...' : profile?.foto_profil ? 'Ganti foto' : 'Tambah foto'}</button>
              {profile?.foto_profil && <button type="button" onClick={removeProfilePhoto} disabled={photoSaving} className="text-[10px] font-medium text-red-700 hover:underline disabled:opacity-60">Hapus foto</button>}
            </div>
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-900">
              <span className="material-symbols-outlined text-[13px]">verified</span>
              Warga Terdaftar · RT {profile?.rt || '-'} / RW {profile?.rw || '-'}
            </span>
            <h2 className="mt-2 text-lg font-bold">{profile?.nama_lengkap || 'Warga Ngrowo'}</h2>
            <div className="mt-1 flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-600">
              <span>NIK: <span className="font-mono font-semibold">{profile?.nik || '-'}</span></span>
              {profile?.nik && <button type="button" aria-label="Salin NIK" title="Salin NIK" onClick={() => navigator.clipboard?.writeText(profile.nik)} className="flex h-6 w-6 items-center justify-center rounded text-emerald-800 hover:bg-emerald-50"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>}
            </div>
            <p className="mt-2 max-w-sm text-xs text-gray-600">RT {profile?.rt || '-'} / RW {profile?.rw || '-'} · {profile?.alamat_detail || 'Alamat belum dilengkapi'}</p>
            <div className="mt-4 flex w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Akun aktif · Data tersimpan di SI-BANSOS NGROWO
            </div>
          </div>
        </section>

        {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>}

        <ProfileGroup title="Data Kependudukan & Bansos">
          <DisclosureRow icon="badge" title="Biodata Lengkap Warga" subtitle="NIK, nama, nomor KK, telepon, dan alamat" open={activeSection === 'biodata'} onClick={() => setActiveSection(activeSection === 'biodata' ? '' : 'biodata')}>
            {activeSection === 'biodata' && (
              <form onSubmit={saveProfile} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {PROFILE_FIELDS.map(([field, label]) => (
                  <label key={field} className={field === 'alamat_detail' ? 'sm:col-span-2' : ''}>
                    <span className="mb-1 block text-xs font-semibold text-gray-700">{label}</span>
                    <input required value={form[field] || ''} onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))} className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
                  </label>
                ))}
                <button type="submit" disabled={saving || loading} className="min-h-10 rounded-lg bg-emerald-800 px-4 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60 sm:col-span-2">
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            )}
          </DisclosureRow>

          <DisclosureRow icon="groups" title="Data Anggota Keluarga" subtitle={`Nomor KK: ${profile?.no_kk || 'belum dilengkapi'}`} open={activeSection === 'family'} onClick={() => setActiveSection(activeSection === 'family' ? '' : 'family')}>
            {activeSection === 'family' && <p className="text-xs leading-relaxed text-gray-600">Data anggota keluarga belum tersedia pada layanan ini. Nomor KK yang terdaftar dapat diperbarui melalui biodata profil.</p>}
          </DisclosureRow>

          <DisclosureRow icon="volunteer_activism" title="Riwayat Bantuan Diterima" subtitle={loading ? 'Memuat data dari server...' : `${bansos.length} program terdata`} open={activeSection === 'bansos'} onClick={() => setActiveSection(activeSection === 'bansos' ? '' : 'bansos')}>
            {activeSection === 'bansos' && (bansos.length ? (
              <ul className="space-y-2">
                {bansos.map((item, index) => <li key={item.id_bansos || `${item.jenis_bansos}-${index}`} className="rounded-lg bg-white p-3 text-xs"><p className="font-bold text-gray-900">{item.jenis_bansos || 'Program bantuan'}</p><p className="mt-1 text-gray-600">Periode {item.periode_tahun || '-'} · {item.status_penerima || 'Status tidak tersedia'}</p></li>)}
              </ul>
            ) : <p className="text-xs text-gray-600">Belum ada data bantuan yang tercatat untuk NIK ini.</p>)}
          </DisclosureRow>

          <DisclosureRow icon="description" title="Dokumen Pendukung" subtitle="Informasi dokumen dan verifikasi" open={activeSection === 'documents'} onClick={() => setActiveSection(activeSection === 'documents' ? '' : 'documents')}>
            {activeSection === 'documents' && <p className="text-xs leading-relaxed text-gray-600">Dokumen digital belum tersedia pada profil. Siapkan e-KTP dan Kartu Keluarga asli saat verifikasi di kantor kelurahan.</p>}
          </DisclosureRow>
        </ProfileGroup>

        <ProfileGroup title="Pengaturan & Keamanan Akun">
          <DisclosureRow icon="password" title="Ubah PIN / Sandi Warga" subtitle="Minta bantuan perubahan PIN ke petugas" open={activeSection === 'pin'} onClick={() => setActiveSection(activeSection === 'pin' ? '' : 'pin')}>
            {activeSection === 'pin' && <a href="https://wa.me/6285807078899?text=Halo%20Admin%20Ngrowo%2C%20saya%20memerlukan%20bantuan%20perubahan%20PIN." target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-800 px-3 text-xs font-semibold text-white"><span className="material-symbols-outlined text-[16px]">chat</span>Hubungi Admin melalui WhatsApp</a>}
          </DisclosureRow>
          <DisclosureRow icon="notifications_active" title="Notifikasi Layanan Bansos" subtitle={pushMessage || (isFcmConfigured ? 'Aktifkan pemberitahuan jadwal dan status laporan' : 'Konfigurasi Firebase belum diisi')} open={activeSection === 'notifications'} onClick={() => setActiveSection(activeSection === 'notifications' ? '' : 'notifications')}>
            {activeSection === 'notifications' && <button type="button" disabled={!isFcmConfigured || pushLoading} onClick={enableNotifications} className="min-h-9 rounded-lg bg-emerald-800 px-3 text-xs font-semibold text-white disabled:opacity-50">{pushLoading ? 'Mengaktifkan...' : 'Aktifkan Notifikasi'}</button>}
          </DisclosureRow>
        </ProfileGroup>

        <ProfileGroup title="Pusat Bantuan & Layanan Desa">
          <ActionRow icon="menu_book" title="Panduan Sanggahan & Bansos" subtitle="Cek data bantuan atau kirim laporan" to="/cek-bansos" />
          <a href="https://wa.me/6285807078899" target="_blank" rel="noopener noreferrer" className="flex min-h-[62px] items-center gap-3 border-b border-gray-100 px-4 py-2 hover:bg-emerald-50/50">
            <span className="material-symbols-outlined flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">support_agent</span>
            <span className="min-w-0 flex-1"><span className="block text-xs font-bold">Hubungi Pendamping Sosial</span><span className="mt-0.5 block truncate text-[10px] text-gray-500">WhatsApp layanan warga Ngrowo</span></span>
            <span className="material-symbols-outlined text-[17px] text-gray-400">call</span>
          </a>
          <ActionRow icon="account_balance" title="SI-BANSOS NGROWO" subtitle="Aplikasi resmi pelayanan warga" to="/dashboard" trailing="v2.4.0" />
        </ProfileGroup>

        <button type="button" onClick={logout} className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-700 hover:bg-red-100">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Keluar dari Akun
        </button>
        <p className="text-center text-[10px] font-semibold text-emerald-900">PEMERINTAH DESA NGROWO</p>
        <p className="-mt-3 text-center text-[9px] text-gray-500">Transparan · Akuntabel · Tepat Sasaran</p>
      </main>
    </div>
  );
}

function profileToForm(profile) {
  return Object.fromEntries(PROFILE_FIELDS.map(([field]) => [field, profile?.[field] || '']));
}

function ProfileGroup({ title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <h2 className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-xs font-bold text-gray-900"><span className="material-symbols-outlined text-[17px] text-emerald-800">folder_open</span>{title}</h2>
      {children}
    </section>
  );
}

function DisclosureRow({ icon, title, subtitle, open, onClick, children }) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button type="button" aria-expanded={open} onClick={onClick} className="flex min-h-[62px] w-full items-center gap-3 px-4 py-2 text-left hover:bg-emerald-50/50">
        <span className="material-symbols-outlined flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">{icon}</span>
        <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-gray-900">{title}</span><span className="mt-0.5 block truncate text-[10px] text-gray-500">{subtitle}</span></span>
        <span className="material-symbols-outlined text-[18px] text-gray-400">{open ? 'expand_less' : 'chevron_right'}</span>
      </button>
      {open && children && <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-4">{children}</div>}
    </div>
  );
}

function ActionRow({ icon, title, subtitle, to, trailing }) {
  return (
    <Link to={to} className="flex min-h-[62px] items-center gap-3 border-b border-gray-100 px-4 py-2 last:border-b-0 hover:bg-emerald-50/50">
      <span className="material-symbols-outlined flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-gray-900">{title}</span><span className="mt-0.5 block truncate text-[10px] text-gray-500">{subtitle}</span></span>
      {trailing ? <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">{trailing}</span> : <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>}
    </Link>
  );
}