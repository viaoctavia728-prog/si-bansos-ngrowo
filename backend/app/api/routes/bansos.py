from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.audit_log import AuditLog
from app.models.bansos import DataBansos
from app.models.eligible_resident import EligibleResident
from app.models.user import User
from app.schemas.bansos import (
    DataBansosCreate,
    DataBansosDirectoryResponse,
    DataBansosPublicResponse,
    DataBansosResponse,
    DataBansosUpdate,
)

router = APIRouter()
public_router = APIRouter()


def mask_identity_number(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    if len(value) == 16 and value.isdigit():
        return f"{value[:6]}******{value[-4:]}"
    return "*" * len(value)


def mask_bansos_response(penerima: DataBansos) -> DataBansosPublicResponse:
    response = DataBansosPublicResponse.model_validate(penerima)
    return response.model_copy(
        update={
            "nik_penerima": mask_identity_number(response.nik_penerima),
            "no_kk": mask_identity_number(response.no_kk),
        }
    )


@router.get("/penerima", response_model=list[DataBansosDirectoryResponse])
def get_penerima_bansos(
    rt: Optional[str] = None,
    rw: Optional[str] = None,
    jenis_bansos: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(DataBansos).filter(DataBansos.is_active.is_(True))

    if rt:
        query = query.filter(DataBansos.rt == rt)
    if rw:
        query = query.filter(DataBansos.rw == rw)
    if jenis_bansos:
        query = query.filter(DataBansos.jenis_bansos.like(f"%{jenis_bansos}%"))
    return query.order_by(DataBansos.periode_tahun.desc(), DataBansos.id_bansos.desc()).all()


@public_router.get("/cek-bansos/{nik}", response_model=list[DataBansosResponse])
@router.get("/cek/{nik}", response_model=list[DataBansosResponse])
def cek_bansos_by_nik(
    nik: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id_user == current_user.get("id_user")).first()
    if not user or user.nik != nik:
        raise HTTPException(status_code=403, detail="Anda hanya dapat melihat data bansos milik akun sendiri.")
    eligible_resident = db.query(EligibleResident).filter(
        EligibleResident.nik == user.nik,
        EligibleResident.is_active.is_(True),
    ).first()
    penerima = (
        db.query(DataBansos)
        .filter(DataBansos.nik_penerima == nik, DataBansos.is_active.is_(True))
        .order_by(DataBansos.periode_tahun.desc(), DataBansos.id_bansos.desc())
        .all()
    )
    return [
        DataBansosResponse.model_validate(item).model_copy(
            update={"desil": eligible_resident.desil if eligible_resident else None}
        )
        for item in penerima
    ]


@router.get("/admin/penerima", response_model=list[DataBansosResponse])
def get_admin_penerima_bansos(
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    rows = (
        db.query(DataBansos, EligibleResident.desil)
        .outerjoin(
            EligibleResident,
            (EligibleResident.nik == DataBansos.nik_penerima) & EligibleResident.is_active.is_(True),
        )
        .order_by(DataBansos.periode_tahun.desc(), DataBansos.id_bansos.desc())
        .all()
    )
    return [
        DataBansosResponse.model_validate(item).model_copy(update={"desil": desil})
        for item, desil in rows
    ]


@router.post("", response_model=DataBansosResponse, status_code=201)
def tambah_penerima_bansos(
    data: DataBansosCreate,
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    eligible_resident = db.query(EligibleResident).filter(
        EligibleResident.nik == data.nik_penerima,
        EligibleResident.is_active.is_(True),
    ).first()
    if not eligible_resident:
        raise HTTPException(status_code=404, detail="NIK belum ada di daftar warga aktif.")
    duplicate = db.query(DataBansos).filter(
        DataBansos.nik_penerima == data.nik_penerima,
        DataBansos.jenis_bansos == data.jenis_bansos,
        DataBansos.periode_tahun == data.periode_tahun,
        DataBansos.is_active.is_(True),
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Warga sudah terdaftar pada program dan periode tersebut.")

    user = db.query(User).filter(User.nik == data.nik_penerima).first()
    values = data.model_dump(exclude={"desil"})
    values["nama_penerima"] = eligible_resident.nama_lengkap
    values["no_kk"] = user.no_kk if user else data.no_kk
    values["desil"] = eligible_resident.desil
    penerima_baru = DataBansos(**values)
    db.add(penerima_baru)
    admin_id = _current_admin.get("id_user")
    db.add(AuditLog(id_user=admin_id, aktivitas=f"Admin menambahkan penerima bansos {data.jenis_bansos} untuk {data.nik_penerima}"))
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Data penerima bansos bertentangan dengan data yang sudah ada.") from exc
    db.refresh(penerima_baru)
    return penerima_baru


@router.put("/admin/penerima/{id_bansos}", response_model=DataBansosResponse)
def update_penerima_bansos(
    id_bansos: int,
    data: DataBansosUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    penerima = db.query(DataBansos).filter(DataBansos.id_bansos == id_bansos).first()
    if not penerima:
        raise HTTPException(status_code=404, detail="Data penerima bansos tidak ditemukan.")
    changes = data.model_dump(exclude_unset=True)
    if not penerima.is_active and changes.get("is_active") is True:
        resident = db.query(EligibleResident).filter(
            EligibleResident.nik == penerima.nik_penerima,
            EligibleResident.is_active.is_(True),
        ).first()
        if not resident:
            raise HTTPException(status_code=409, detail="Data warga eligible harus aktif sebelum penerima dipulihkan.")
    if changes.get("is_active") is None:
        changes.pop("is_active")
    for field, value in changes.items():
        setattr(penerima, field, value)
    resident = db.query(EligibleResident).filter(
        EligibleResident.nik == penerima.nik_penerima,
        EligibleResident.is_active.is_(True),
    ).first()
    if resident:
        penerima.desil = resident.desil
    db.add(
        AuditLog(
            id_user=current_admin.get("id_user"),
            aktivitas=f"Admin memperbarui penerima bansos {penerima.jenis_bansos} untuk {penerima.nik_penerima}",
        )
    )
    db.commit()
    db.refresh(penerima)
    return penerima


@router.delete("/admin/penerima/{id_bansos}")
def archive_penerima_bansos(
    id_bansos: int,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    penerima = db.query(DataBansos).filter(DataBansos.id_bansos == id_bansos).first()
    if not penerima:
        raise HTTPException(status_code=404, detail="Data penerima bansos tidak ditemukan.")
    if not penerima.is_active:
        return {"status": "success", "message": "Data penerima sudah diarsipkan."}
    penerima.is_active = False
    db.add(
        AuditLog(
            id_user=current_admin.get("id_user"),
            aktivitas=f"Admin mengarsipkan penerima bansos {penerima.jenis_bansos} untuk {penerima.nik_penerima}",
        )
    )
    db.commit()
    return {"status": "success", "message": "Data penerima berhasil diarsipkan."}
