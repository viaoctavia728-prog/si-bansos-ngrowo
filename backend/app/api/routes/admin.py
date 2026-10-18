from datetime import datetime
from typing import Any, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.pengaduan import PengaduanBansos
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.pengaduan import PengaduanResponse, PengaduanUpdateStatus

router = APIRouter()


# ==========================================
# MANAJEMEN JADWAL PENYALURAN BANSOS
# ==========================================
BULAN_ID = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

in_memory_jadwal: List[dict] = []


def generate_default_dynamic_jadwal():
    now = datetime.now()
    curr_month_name = BULAN_ID[now.month]
    curr_year = now.year
    next_month_idx = now.month + 1 if now.month < 12 else 1
    next_month_year = curr_year if now.month < 12 else curr_year + 1
    next_month_name = BULAN_ID[next_month_idx]

    return [
        {
            "id": 1,
            "program": "Bansos Beras CPP 10 Kg",
            "tanggal": f"15 {curr_month_name} {curr_year}",
            "iso_date": f"{curr_year}-{now.month:02d}-15",
            "jam": "08:30 - 14:00 WIB",
            "lokasi": "Pendopo Balai Desa Ngrowo",
            "status": "Akan Datang",
            "persyaratan": ["KTP Asli Penerima", "Kartu Keluarga Asli", "Undangan Ber-Barcode dari RT"],
            "dusun": "Dusun Krajan (RT 01, 02) & Ngrowo Timur (RT 01)",
        },
        {
            "id": 2,
            "program": f"BLT Dana Desa ({curr_month_name} {curr_year})",
            "tanggal": f"24 {curr_month_name} {curr_year}",
            "iso_date": f"{curr_year}-{now.month:02d}-24",
            "jam": "09:00 - 12:00 WIB",
            "lokasi": "Ruang Pelayanan Kantor Kelurahan Ngrowo",
            "status": "Dijadwalkan",
            "persyaratan": ["KTP Asli", "Fotokopi KK 1 Lembar"],
            "dusun": "Semua Dusun Kelurahan Ngrowo",
        },
        {
            "id": 3,
            "program": "Penyaluran BPNT Sembako",
            "tanggal": f"05 {next_month_name} {next_month_year}",
            "iso_date": f"{next_month_year}-{next_month_idx:02d}-05",
            "jam": "08:00 - 15:00 WIB",
            "lokasi": "E-Warong Amanah Makmur Ngrowo",
            "status": "Persiapan",
            "persyaratan": ["KKS (Kartu Keluarga Sejahtera)", "KTP Elektronik"],
            "dusun": "Seluruh Wilayah RT/RW",
        },
    ]


class JadwalBansosCreate(BaseModel):
    id: Optional[int] = None
    program: str
    tanggal: str
    jam: str
    lokasi: str
    status: Optional[str] = "Dijadwalkan"
    persyaratan: Optional[Union[List[str], str]] = []
    dusun: Optional[str] = None
    iso_date: Optional[str] = None


@router.get("/jadwal")
def get_jadwal_bansos():
    base = generate_default_dynamic_jadwal()
    if in_memory_jadwal:
        return in_memory_jadwal + base
    return base


@router.post("/jadwal")
def create_jadwal_bansos(
    data: JadwalBansosCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    new_id = len(in_memory_jadwal) + 10
    item = data.dict() if hasattr(data, "dict") else data.model_dump()
    item["id"] = new_id
    if isinstance(item.get("persyaratan"), str):
        item["persyaratan"] = [p.strip() for p in item["persyaratan"].split(",") if p.strip()]
    in_memory_jadwal.insert(0, item)

    admin_id = current_admin.get("id_user") if isinstance(current_admin, dict) else 1
    db.add(
        AuditLog(
            id_user=admin_id,
            aktivitas=f"Admin menambahkan jadwal bansos baru: {data.program} pada {data.tanggal}",
        )
    )
    db.commit()
    return item


# ==========================================
# KELOLA & VERIFIKASI WARGA
# ==========================================
@router.get("/warga", response_model=List[UserResponse])
def get_warga_terdaftar(
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    return (
        db.query(User)
        .filter(User.role.in_(["user", "warga"]))
        .order_by(User.created_at.desc())
        .all()
    )


@router.get("/pending-warga", response_model=List[UserResponse])
def get_pending_warga(
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    return (
        db.query(User)
        .filter(
            User.role.in_(["user", "warga"]),
            (User.is_ngrowo_resident == False) | (User.is_verified == False),
        )
        .order_by(User.created_at.desc())
        .all()
    )


@router.put("/approve-warga/{id_user}")
@router.post("/approve-warga/{id_user}")
@router.put("/verifikasi-warga/{id_user}")
@router.post("/verifikasi-warga/{id_user}")
@router.put("/verifikasi/{id_user}")
@router.post("/verifikasi/{id_user}")
def approve_warga(
    id_user: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id_user == id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan!")

    user.is_ngrowo_resident = True
    user.is_verified = True
    db.commit()
    db.refresh(user)

    admin_id = current_admin.get("id_user") if isinstance(current_admin, dict) else 1
    db.add(
        AuditLog(
            id_user=admin_id,
            aktivitas=f"Admin menyetujui verifikasi warga: {user.nama_lengkap} (NIK: {user.nik})",
        )
    )
    db.commit()
    return {"status": "success", "message": f"Warga {user.nama_lengkap} berhasil diverifikasi sebagai penduduk Ngrowo."}


@router.put("/reject-warga/{id_user}")
@router.post("/reject-warga/{id_user}")
@router.delete("/reject-warga/{id_user}")
@router.put("/tolak-warga/{id_user}")
@router.post("/tolak-warga/{id_user}")
def reject_warga(
    id_user: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    user = db.query(User).filter(User.id_user == id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan!")

    nama = user.nama_lengkap
    nik = user.nik
    admin_id = current_admin.get("id_user") if isinstance(current_admin, dict) else 1
    db.add(
        AuditLog(
            id_user=admin_id,
            aktivitas=f"Admin menolak registrasi warga non-Ngrowo: {nama} (NIK: {nik})",
        )
    )
    db.delete(user)
    db.commit()
    return {"status": "success", "message": f"Pendaftaran warga {nama} ditolak dan dihapus dari sistem."}


# ==========================================
# PENGADUAN & AUDIT LOGS
# ==========================================
@router.get("/pengaduan", response_model=List[PengaduanResponse])
def get_semua_pengaduan(
    rt: str | None = Query(default=None),
    rw: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    query = db.query(PengaduanBansos).join(User, PengaduanBansos.id_user == User.id_user)
    if rt:
        query = query.filter(User.rt == rt)
    if rw:
        query = query.filter(User.rw == rw)
    return query.order_by(PengaduanBansos.created_at.desc()).all()


@router.get("/audit-logs")
def get_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()


@router.put("/pengaduan/{id_laporan}", response_model=PengaduanResponse)
def update_status_pengaduan(
    id_laporan: int,
    data_update: PengaduanUpdateStatus,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    pengaduan = db.query(PengaduanBansos).filter(PengaduanBansos.id_laporan == id_laporan).first()
    if not pengaduan:
        raise HTTPException(status_code=404, detail="Data pengaduan tidak ditemukan!")

    pengaduan.status_laporan = data_update.status_laporan
    if data_update.catatan_admin is not None:
        pengaduan.catatan_admin = data_update.catatan_admin
    db.add(
        AuditLog(
            id_user=current_admin.get("id_user") if isinstance(current_admin, dict) else 1,
            aktivitas=f"Memperbarui pengaduan {pengaduan.nomor_tiket}: status {pengaduan.status_laporan}",
        )
    )

    db.commit()
    db.refresh(pengaduan)
    return pengaduan
