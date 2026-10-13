import csv
import io
import re
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.core.normalization import normalize_name
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.eligible_resident import EligibleResident
from app.models.pengaduan import PengaduanBansos
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.pengaduan import PengaduanResponse, PengaduanUpdateStatus

router = APIRouter()
MAX_RESIDENT_CSV_BYTES = 5 * 1024 * 1024
MAX_RESIDENT_CSV_ROWS = 10000


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


@router.post("/eligible-residents/import")
async def import_eligible_residents(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    contents = await file.read(MAX_RESIDENT_CSV_BYTES + 1)
    if len(contents) > MAX_RESIDENT_CSV_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran CSV maksimal 5 MB.")
    try:
        csv_text = contents.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="CSV harus menggunakan encoding UTF-8.") from exc

    try:
        reader = csv.DictReader(io.StringIO(csv_text))
        headers = {str(header).strip().casefold(): header for header in (reader.fieldnames or [])}
        if "nik" not in headers or "nama_lengkap" not in headers:
            raise HTTPException(status_code=400, detail="Header CSV wajib berisi nik,nama_lengkap.")

        rows = []
        seen_niks = set()
        errors = []
        for line_number, row in enumerate(reader, start=2):
            if None in row or all(not (value or "").strip() for value in row.values()):
                if None in row:
                    errors.append(f"Baris {line_number}: jumlah kolom tidak sesuai.")
                continue
            nik = (row.get(headers["nik"]) or "").strip()
            nama = " ".join((row.get(headers["nama_lengkap"]) or "").split())
            if not re.fullmatch(r"\d{16}", nik):
                errors.append(f"Baris {line_number}: NIK harus terdiri dari 16 digit angka.")
            if not 2 <= len(nama) <= 100:
                errors.append(f"Baris {line_number}: nama harus berisi 2 sampai 100 karakter.")
            if nik in seen_niks:
                errors.append(f"Baris {line_number}: NIK duplikat di dalam file.")
            seen_niks.add(nik)
            if re.fullmatch(r"\d{16}", nik) and 2 <= len(nama) <= 100:
                rows.append((nik, nama, normalize_name(nama)))
            if len(rows) > MAX_RESIDENT_CSV_ROWS:
                raise HTTPException(status_code=413, detail="CSV maksimal berisi 10.000 warga.")
        if errors:
            raise HTTPException(status_code=422, detail=errors[:20])
    except csv.Error as exc:
        raise HTTPException(status_code=400, detail="Format CSV tidak valid.") from exc

    if not rows:
        raise HTTPException(status_code=400, detail="CSV tidak berisi data warga.")

    added = 0
    updated = 0
    already_registered = 0
    try:
        for nik, nama, nama_normalized in rows:
            resident = (
                db.query(EligibleResident)
                .filter(EligibleResident.nik == nik)
                .with_for_update()
                .first()
            )
            existing_user = db.query(User).filter(User.nik == nik).first()
            if resident:
                if resident.registered_user_id is not None or existing_user:
                    if resident.registered_user_id is None:
                        resident.registered_user_id = existing_user.id_user
                    already_registered += 1
                    continue
                resident.nama_lengkap = nama
                resident.nama_normalized = nama_normalized
                updated += 1
                continue

            db.add(
                EligibleResident(
                    nik=nik,
                    nama_lengkap=nama,
                    nama_normalized=nama_normalized,
                    registered_user_id=existing_user.id_user if existing_user else None,
                )
            )
            if existing_user:
                already_registered += 1
            else:
                added += 1

        db.add(
            AuditLog(
                id_user=current_admin.get("id_user"),
                aktivitas=f"Impor daftar warga: {added} ditambahkan, {updated} diperbarui, {already_registered} sudah terdaftar",
            )
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Impor berbenturan dengan perubahan data lain. Coba ulangi.") from exc
    except Exception:
        db.rollback()
        raise

    return {"added": added, "updated": updated, "already_registered": already_registered}


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
            id_user=current_admin.get("id_user"),
            aktivitas=f"Memperbarui pengaduan {pengaduan.nomor_tiket}: status {pengaduan.status_laporan}",
        )
    )

    db.commit()
    db.refresh(pengaduan)
    return pengaduan
