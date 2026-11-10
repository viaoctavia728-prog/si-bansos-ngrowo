import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import WargaSidebar from '../../components/WargaSidebar';
import WargaMain from '../../components/WargaMain';
import { useWargaLayout } from '../../components/WargaLayoutContext';
import ImageCropper from '../../components/ImageCropper';
import { authService } from '../../services/auth';
import { getAssetUrl } from '../../services/apiClient';
import { enablePushNotifications, isFcmConfigured } from '../../services/firebase';

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
  const { toggle, setOpenMobile } = useWargaLayout();
  const photoInputRef = useRef(null);
  const [profile, setProfile] = useState(() => authService.getCurrentUser());
  const [form, setForm] = useState(() => profileToForm(authService.getCurrentUser()));
  const [activeSection, setActiveSection] = useState(() => new URLSearchParams(window.location.search).get('section') || 'biodata');
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [cropFile, setCropFile] = useState(null);
  const [message, setMessage] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [pushLoading, setPushLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [biodataOpen, setBiodataOpen] = useState(false);
  const [panduanOpen, setPanduanOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);

  useEffect(() => {
    if (!biodataOpen && !panduanOpen && !photoOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setBiodataOpen(false);
        setPanduanOpen(false);
        setPhotoOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [biodataOpen, panduanOpen, photoOpen]);

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
    authService.getProfile().then((value) => {
      if (!active) return;
      setProfile(value);
      setForm(profileToForm(value));
    }).catch((error) => {
      if (!active) return;
      setMessage(error.message || 'Data profil gagal dimuat.');
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
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Ukuran foto maksimal 5 MB.');
      event.target.value = '';
      return;
    }
    setMessage('');
    setCropFile(file);
    event.target.value = '';
  };

  const handleCropConfirm = async (croppedFile) => {
    setCropFile(null);
    try {
      setPhotoSaving(true);
      setMessage('');
      const updated = await authService.updateProfilePhoto(croppedFile);
      setProfile(updated);
      setMessage('Foto profil berhasil diperbarui.');
    } catch (error) {
      setMessage(error.message || 'Foto profil gagal diunggah.');
    } finally {
      setPhotoSaving(false);
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

  const saveNotificationPreference = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      const updated = await authService.updateProfile({ notifikasi_otomatis: form.notifikasi_otomatis });
      setProfile(updated);
      setForm(profileToForm(updated));
      setMessage('Preferensi notifikasi berhasil diperbarui.');
    } catch (error) {
      setMessage(error.message || 'Preferensi notifikasi gagal diperbarui.');
    } finally {
      setSaving(false);
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
    <div className="flex min-h-screen flex-col bg-[#F8FAFC] text-slate-900">
      <WargaSidebar />
      <WargaMain>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
        <div className="warga-shell flex h-16 items-center justify-between sm:h-20">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.matchMedia('(min-width: 1024px)').matches) toggle();
                else setOpenMobile(true);
              }}
              aria-label="Buka menu navigasi"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
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

      <main className="warga-content flex flex-1 flex-col gap-4 pb-24 pt-5 sm:gap-5 sm:pt-7 lg:pb-10">
        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
          <div className="h-20 bg-[radial-gradient(ellipse_at_top,#d9f5df,transparent_72%)]" />
          <div className="-mt-12 flex flex-col items-center px-5 pb-5 text-center">
            <div className="relative h-20 w-20">
              <button type="button" onClick={() => setPhotoOpen(true)} aria-label="Lihat foto profil" title="Lihat foto profil" className="block h-full w-full rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2">
                {profile?.foto_profil ? (
                  <img src={getAssetUrl(profile.foto_profil)} alt={`Foto profil ${profile.nama_lengkap || 'warga'}`} className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-md" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-emerald-800 text-xl font-bold text-white shadow-md" aria-label={`Inisial ${initials}`}>
                    {initials}
                  </div>
                )}
              </button>
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
            <div className="mt-1 flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-500">
              <span>NIK: <span className="font-mono font-semibold">{profile?.nik || '-'}</span></span>
              {profile?.nik && <button type="button" aria-label="Salin NIK" title="Salin NIK" onClick={() => navigator.clipboard?.writeText(profile.nik)} className="flex h-6 w-6 items-center justify-center rounded text-emerald-800 hover:bg-emerald-50"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>}
            </div>
            <p className="mt-2 max-w-sm text-xs text-slate-500">RT {profile?.rt || '-'} / RW {profile?.rw || '-'} · {profile?.alamat_detail || 'Alamat belum dilengkapi'}</p>
            <div className="mt-4 flex w-full max-w-sm items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Akun aktif · Data tersimpan di SI-BANSOS NGROWO
            </div>
          </div>
        </section>

        {message && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">{message}</p>}

        <ProfileGroup title="Data Kependudukan & Bansos">
          <ActionRow icon="badge" title="Biodata Lengkap Warga" subtitle="NIK, nama, nomor KK, telepon, dan alamat" onClick={() => setBiodataOpen(true)} />
        </ProfileGroup>

        <ProfileGroup title="Pengaturan & Keamanan Akun">
          <DisclosureRow icon="password" title="Ubah PIN / Sandi Warga" subtitle="Minta bantuan perubahan PIN ke petugas" open={activeSection === 'pin'} onClick={() => setActiveSection(activeSection === 'pin' ? '' : 'pin')}>
            {activeSection === 'pin' && <a href="https://wa.me/6285807078899?text=Halo%20Admin%20Ngrowo%2C%20saya%20memerlukan%20bantuan%20perubahan%20PIN." target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-emerald-800 px-3 text-xs font-semibold text-white"><span className="material-symbols-outlined text-[16px]">chat</span>Hubungi Admin melalui WhatsApp</a>}
          </DisclosureRow>
        </ProfileGroup>

        <ProfileGroup title="Pusat Bantuan & Layanan Desa">
          <ActionRow icon="menu_book" title="Panduan Sanggahan Pengaduan Bansos" subtitle="Langkah-langkah mengirim pengaduan" onClick={() => setPanduanOpen(true)} />
          <a href="https://wa.me/6285807078899" target="_blank" rel="noopener noreferrer" className="flex min-h-[62px] items-center gap-3 border-b border-slate-100 px-4 py-2 hover:bg-emerald-50/50">
            <span className="material-symbols-outlined flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">support_agent</span>
            <span className="min-w-0 flex-1"><span className="block text-xs font-bold">Hubungi Pendamping Sosial</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">WhatsApp layanan warga Ngrowo</span></span>
            <span className="material-symbols-outlined text-[17px] text-slate-400">call</span>
          </a>
        </ProfileGroup>

        <button type="button" onClick={logout} className="mt-1 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 text-sm font-bold text-red-700 hover:bg-red-100">
          <span className="material-symbols-outlined text-[18px]">logout</span>
          Keluar dari Akun
        </button>
        <p className="text-center text-[10px] font-semibold text-primary">PEMERINTAH KELURAHAN NGROWO</p>
        <p className="-mt-3 text-center text-[9px] text-slate-500">Transparan · Akuntabel · Tepat Sasaran</p>
      </main>
      <Footer />
      </WargaMain>

      {cropFile && (
        <ImageCropper
          file={cropFile}
          onCancel={() => setCropFile(null)}
          onConfirm={handleCropConfirm}
        />
      )}

      {biodataOpen && <BiodataModal profile={profile} onClose={() => setBiodataOpen(false)} />}
      {panduanOpen && <PanduanModal onClose={() => setPanduanOpen(false)} />}
      {photoOpen && <PhotoModal profile={profile} onClose={() => setPhotoOpen(false)} />}
    </div>
  );
}

function profileToForm(profile) {
  return {
    ...Object.fromEntries(PROFILE_FIELDS.map(([field]) => [field, profile?.[field] || ''])),
    notifikasi_otomatis: profile?.notifikasi_otomatis !== false,
  };
}

function ProfileGroup({ title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <h2 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-xs font-bold text-[#0F172A]"><span className="material-symbols-outlined text-[17px] text-emerald-800">folder_open</span>{title}</h2>
      {children}
    </section>
  );
}

function DisclosureRow({ icon, title, subtitle, open, onClick, children }) {
  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button type="button" aria-expanded={open} onClick={onClick} className="flex min-h-[62px] w-full items-center gap-3 px-4 py-2 text-left hover:bg-emerald-50/50">
        <span className="material-symbols-outlined flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">{icon}</span>
        <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#0F172A]">{title}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{subtitle}</span></span>
        <span className="material-symbols-outlined text-[18px] text-slate-400">{open ? 'expand_less' : 'chevron_right'}</span>
      </button>
      {open && children && <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-4">{children}</div>}
    </div>
  );
}

function ActionRow({ icon, title, subtitle, to, onClick, trailing }) {
  const className = "flex min-h-[62px] w-full items-center gap-3 border-b border-slate-100 px-4 py-2 text-left last:border-b-0 hover:bg-emerald-50/50";
  const inner = (
    <>
      <span className="material-symbols-outlined flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">{icon}</span>
      <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#0F172A]">{title}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{subtitle}</span></span>
      {trailing ? <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500">{trailing}</span> : <span className="material-symbols-outlined text-[18px] text-slate-400">chevron_right</span>}
    </>
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return (
    <Link to={to} className={className}>
      {inner}
    </Link>
  );
}

function Modal({ title, icon, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <span className="material-symbols-outlined text-[20px] text-emerald-800">{icon}</span>
          <h2 className="min-w-0 flex-1 truncate text-sm font-bold text-[#0F172A]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="border-t border-slate-100 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

const PANDUAN_LANGKAH = [
  { nomor: '1', judul: 'Pilih Kategori Sanggahan', detail: 'Tentukan alasan sanggahan: Warga Mampu Terima Bansos, Warga Miskin Terlewat, atau Sanggah Data Mandiri.' },
  { nomor: '2', judul: 'Pilih Program Terkait', detail: 'Pilih program bantuan yang disanggah (PKH, BPNT, BLT Desa, CPP, atau Desil Tidak Sesuai).' },
  { nomor: '3', judul: 'Isi Lokasi Domisili', detail: 'Lengkapi RT dan RW warga yang dilaporkan sesuai domisili riil.' },
  { nomor: '4', judul: 'Masukkan NIK Terlapor', detail: 'Isi 16 digit NIK warga yang disanggah (opsional bila tidak diketahui).' },
  { nomor: '5', judul: 'Tulis Deskripsi Kejadian', detail: 'Jelaskan kondisi warga secara jujur, objektif, dan faktual (maks. 500 karakter).' },
  { nomor: '6', judul: 'Lampirkan Bukti Foto', detail: 'Unggah foto pendukung berformat JPG, PNG, atau WEBP dengan ukuran maksimal 2 MB (opsional).' },
  { nomor: '7', judul: 'Kirim & Simpan Nomor Tiket', detail: 'Kirim pengaduan lalu simpan nomor tiket untuk melacak status verifikasi oleh kelurahan.' },
];

function PanduanModal({ onClose }) {
  return (
    <Modal title="Panduan Sanggahan Pengaduan Bansos" icon="menu_book" onClose={onClose}>
      <p className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
        Setiap laporan ditinjau tim verifikator kelurahan bersama RT/RW secara objektif, aman, dan rahasia. Pengaduan diverifikasi dalam 3–7 hari kerja.
      </p>
      <ol className="space-y-3">
        {PANDUAN_LANGKAH.map((langkah) => (
          <li key={langkah.nomor} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-[11px] font-bold text-white">{langkah.nomor}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#0F172A]">{langkah.judul}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">{langkah.detail}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2">
        <p className="text-[11px] font-semibold text-slate-800">Tips: sampaikan pengaduan secara jujur & faktual, gunakan bahasa sopan, dan lampirkan bukti pendukung bila ada.</p>
      </div>
    </Modal>
  );
}

function BiodataModal({ profile, onClose }) {
  const rows = [
    ['Nama lengkap', profile?.nama_lengkap],
    ['NIK', profile?.nik],
    ['Nomor Kartu Keluarga', profile?.no_kk],
    ['Nomor telepon', profile?.no_hp],
    ['RT', profile?.rt],
    ['RW', profile?.rw],
    ['Alamat lengkap', profile?.alamat_detail],
  ];
  return (
    <Modal title="Biodata Lengkap Warga" icon="badge" onClose={onClose} footer={
      <button type="button" onClick={onClose} className="w-full rounded-xl bg-emerald-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-900">Tutup</button>
    }>
      <div className="flex flex-col items-center pb-4 text-center">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-900">
          <span className="material-symbols-outlined text-[13px]">verified</span>
          Warga Terdaftar · RT {profile?.rt || '-'} / RW {profile?.rw || '-'}
        </span>
      </div>
      <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-3 px-3 py-2.5">
            <span className="text-[11px] font-semibold text-slate-500">{label}</span>
            <span className={`min-w-0 text-right text-xs font-semibold text-[#0F172A] ${label === 'NIK' || label === 'Nomor Kartu Keluarga' ? 'font-mono' : ''}`}>{value || '-'}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function PhotoModal({ profile, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Foto profil" onClick={onClose}>
      <div className="flex flex-col items-center gap-3" onClick={(event) => event.stopPropagation()}>
        {profile?.foto_profil ? (
          <img src={getAssetUrl(profile.foto_profil)} alt={`Foto profil ${profile.nama_lengkap || 'warga'}`} className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl" />
        ) : (
          <div className="flex h-56 w-56 items-center justify-center rounded-full bg-emerald-800 text-6xl font-bold text-white shadow-2xl">
            {(profile?.nama_lengkap || 'Warga').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()}
          </div>
        )}
        <span className="text-sm font-semibold text-white">{profile?.nama_lengkap || 'Warga Ngrowo'}</span>
        <button type="button" onClick={onClose} aria-label="Tutup foto" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
}