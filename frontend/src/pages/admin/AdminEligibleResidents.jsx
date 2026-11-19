import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '../../services/admin/adminApi';

const EMPTY_FORM = { nik: '', nama_lengkap: '', desil: 4 };

export default function AdminEligibleResidents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadResidents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getEligibleResidents();
      setResidents(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(loadError.message || 'Daftar warga eligible gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResidents();
  }, []);

  const visibleResidents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return residents.filter((resident) => {
      if (!showInactive && !resident.is_active) return false;
      return !query || `${resident.nama_lengkap} ${resident.nik}`.toLowerCase().includes(query);
    });
  }, [residents, search, showInactive]);

  const openCreate = () => {
    setEditingResident(null);
    setForm(EMPTY_FORM);
    setError('');
    setIsFormOpen(true);
  };

  const openEdit = (resident) => {
    setEditingResident(resident);
    setForm({
      nik: resident.nik,
      nama_lengkap: resident.nama_lengkap,
      desil: resident.desil,
      is_active: resident.is_active,
    });
    setError('');
    setIsFormOpen(true);
  };

  const saveResident = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFeedback(null);
    try {
      if (editingResident) {
        await adminService.updateEligibleResident(editingResident.id, {
          nama_lengkap: form.nama_lengkap,
          desil: Number(form.desil),
          is_active: form.is_active,
        });
      } else {
        await adminService.createEligibleResident({
          nik: form.nik,
          nama_lengkap: form.nama_lengkap,
          desil: Number(form.desil),
        });
      }
      setIsFormOpen(false);
      setEditingResident(null);
      setFeedback({ type: 'success', message: `Data ${form.nama_lengkap} berhasil disimpan.` });
      await loadResidents();
    } catch (saveError) {
      setError(saveError.message || 'Data warga gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  const deactivateResident = async (resident) => {
    if (!window.confirm(`Nonaktifkan data ${resident.nama_lengkap}? Riwayat dan akun tidak akan dihapus.`)) return;
    try {
      setFeedback(null);
      await adminService.deactivateEligibleResident(resident.id);
      setFeedback({ type: 'success', message: `Data ${resident.nama_lengkap} dinonaktifkan tanpa menghapus riwayat.` });
      await loadResidents();
    } catch (actionError) {
      setError(actionError.message || 'Data warga gagal dinonaktifkan.');
    }
  };

  return (
    <section className="space-y-5 motion-reveal" aria-labelledby="eligible-residents-title">
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/70 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">Daftar induk warga</p>
          <h3 id="eligible-residents-title" className="mt-1 text-lg font-extrabold text-slate-900">Warga yang boleh mendaftar</h3>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">
            Tambahkan data warga di sini. Warga tetap membuat akun sendiri; desil dikelola dari satu data induk.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="gov-btn-primary self-start sm:self-auto">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Tambah warga
        </button>
      </div>

      {feedback && (
        <div role="status" className={`motion-pop-in flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
          <span className="material-symbols-outlined">{feedback.type === 'success' ? 'check_circle' : 'error'}</span>
          {feedback.message}
        </div>
      )}
      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{error}</span>
          <button type="button" onClick={loadResidents} className="font-bold underline">Coba lagi</button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3 motion-stagger">
        <div className="gov-card motion-card p-4"><p className="text-xs font-semibold text-slate-500">Data aktif</p><p className="mt-1 text-2xl font-extrabold text-slate-900">{residents.filter((item) => item.is_active).length}</p></div>
        <div className="gov-card motion-card p-4"><p className="text-xs font-semibold text-slate-500">Sudah memiliki akun</p><p className="mt-1 text-2xl font-extrabold text-emerald-800">{residents.filter((item) => item.registered_user_id && item.account_active).length}</p></div>
        <div className="gov-card motion-card p-4"><p className="text-xs font-semibold text-slate-500">Belum mendaftar</p><p className="mt-1 text-2xl font-extrabold text-blue-800">{residents.filter((item) => item.is_active && !item.registered_user_id).length}</p></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-sm">
            <span className="sr-only">Cari nama atau NIK warga</span>
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-400">search</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau NIK..." className="gov-input h-10 pl-10 text-xs" />
          </label>
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600">
              <input type="checkbox" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} className="h-4 w-4 accent-emerald-700" />
              Tampilkan nonaktif
            </label>
            <button type="button" onClick={loadResidents} disabled={loading} className="gov-btn-outline min-h-10 px-3 text-xs">
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>refresh</span>
              Segarkan
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500"><span className="material-symbols-outlined animate-spin text-3xl text-emerald-700">progress_activity</span><p className="mt-2">Memuat daftar warga...</p></div>
        ) : error && residents.length === 0 ? (
          <div className="p-12 text-center text-sm text-rose-700">Daftar warga belum dapat dimuat. Gunakan tombol coba lagi di atas.</div>
        ) : visibleResidents.length === 0 ? (
          <div className="p-12 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">groups</span>
            <p className="mt-2 text-sm font-bold text-slate-700">Belum ada data yang cocok</p>
            <p className="mt-1 text-xs text-slate-500">Tambahkan warga atau ubah kata pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-3">Nama / NIK</th><th className="px-4 py-3">Desil</th><th className="px-4 py-3">Status akun</th><th className="px-4 py-3 text-right">Aksi</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleResidents.map((resident, index) => (
                  <tr key={resident.id} className="motion-row hover:bg-emerald-50/30" style={{ '--stagger-index': Math.min(index, 8) }}>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900">{resident.nama_lengkap}</p>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">{resident.nik}</p>
                    </td>
                    <td className="px-4 py-3.5"><span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 font-bold text-amber-900">Desil {resident.desil}</span></td>
                    <td className="px-4 py-3.5">
                      {resident.registered_user_id ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${!resident.account_active ? 'bg-slate-100 text-slate-600' : resident.account_verified ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                          <span className="material-symbols-outlined text-sm">{!resident.account_active ? 'person_off' : resident.account_verified ? 'verified_user' : 'pending'}</span>
                          {!resident.account_active ? 'Akun nonaktif' : resident.account_verified ? 'Terverifikasi' : 'Menunggu verifikasi'}
                        </span>
                      ) : <span className="text-slate-500">Belum mendaftar</span>}
                      {!resident.is_active && <span className="ml-2 rounded-full bg-rose-50 px-2 py-1 font-semibold text-rose-700">Data nonaktif</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEdit(resident)} className="gov-btn-outline min-h-9 px-3 text-xs" aria-label={`Edit ${resident.nama_lengkap}`}>
                          <span className="material-symbols-outlined text-base">edit</span><span className="hidden sm:inline">Edit</span>
                        </button>
                        {resident.is_active && (
                          <button type="button" onClick={() => deactivateResident(resident)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 transition hover:bg-rose-50" aria-label={`Nonaktifkan ${resident.nama_lengkap}`}>
                            <span className="material-symbols-outlined text-base">archive</span><span className="hidden sm:inline">Nonaktifkan</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">Menampilkan {visibleResidents.length} dari {residents.length} data warga</div>
      </div>

      {isFormOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setIsFormOpen(false); setError(''); } }}>
          <section role="dialog" aria-modal="true" aria-labelledby="resident-form-title" className="modal-panel motion-modal max-w-lg">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-800">Data kependudukan</p><h3 id="resident-form-title" className="mt-1 text-lg font-extrabold">{editingResident ? 'Perbarui data warga' : 'Tambah warga eligible'}</h3></div>
              <button type="button" onClick={() => { setIsFormOpen(false); setError(''); }} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200" aria-label="Tutup formulir"><span className="material-symbols-outlined">close</span></button>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-slate-500">Warga eligible dapat mendaftar sendiri menggunakan NIK dan nama yang sesuai. Akun tidak dibuat oleh admin.</p>
            {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
            <form onSubmit={saveResident} className="space-y-4">
              <label className="block text-xs font-semibold text-slate-700">NIK
                <input required minLength="16" maxLength="16" pattern="\d{16}" inputMode="numeric" readOnly={Boolean(editingResident)} value={form.nik} onChange={(event) => setForm((value) => ({ ...value, nik: event.target.value }))} className="gov-input mt-1 font-mono read-only:bg-slate-100" placeholder="16 digit NIK" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">Nama lengkap
                <input required minLength="2" maxLength="100" value={form.nama_lengkap} onChange={(event) => setForm((value) => ({ ...value, nama_lengkap: event.target.value }))} className="gov-input mt-1" placeholder="Nama sesuai dokumen kependudukan" />
              </label>
              <label className="block text-xs font-semibold text-slate-700">Desil kesejahteraan
                <select required min="1" max="10" value={form.desil} onChange={(event) => setForm((value) => ({ ...value, desil: Number(event.target.value) }))} className="gov-input mt-1">
                  {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>Desil {value}</option>)}
                </select>
              </label>
              {editingResident && (
                <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((value) => ({ ...value, is_active: event.target.checked }))} className="h-4 w-4 accent-emerald-700" />
                  Data warga aktif dan dapat digunakan untuk registrasi
                </label>
              )}
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => { setIsFormOpen(false); setError(''); }} className="gov-btn-outline">Batal</button>
                <button type="submit" disabled={saving} className="gov-btn-primary">
                  <span className={`material-symbols-outlined text-base ${saving ? 'animate-spin' : ''}`}>{saving ? 'progress_activity' : 'save'}</span>
                  {saving ? 'Menyimpan...' : 'Simpan data'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
