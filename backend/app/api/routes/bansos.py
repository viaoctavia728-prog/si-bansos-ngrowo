from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_current_user
from app.db.session import get_db
from app.models.bansos import DataBansos
from app.models.eligible_resident import EligibleResident
from app.models.user import User
from app.schemas.bansos import DataBansosCreate, DataBansosPublicResponse, DataBansosResponse

router = APIRouter()
public_router = APIRouter()


@router.get("/desil-saya")
def get_desil_saya(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user.get("id_user")
    resident = (
        db.query(EligibleResident)
        .join(User, User.nik == EligibleResident.nik)
        .filter(User.id_user == user_id)
        .first()
    )
    if not resident:
        raise HTTPException(status_code=404, detail="Data desil warga belum ditemukan.")
    return {"desil": resident.desil, "nik": resident.nik}


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


@router.get("/penerima", response_model=list[DataBansosPublicResponse])
def get_penerima_bansos(
    rt: Optional[str] = None,
    rw: Optional[str] = None,
    jenis_bansos: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(DataBansos)

    if rt:
        query = query.filter(DataBansos.rt == rt)
    if rw:
        query = query.filter(DataBansos.rw == rw)
    if jenis_bansos:
        query = query.filter(DataBansos.jenis_bansos.like(f"%{jenis_bansos}%"))
    if search:
        query = query.filter(
            (DataBansos.nama_penerima.like(f"%{search}%"))
            | (DataBansos.nik_penerima.like(f"%{search}%"))
        )

    return [mask_bansos_response(penerima) for penerima in query.all()]


@public_router.get("/cek-bansos/{nik}", response_model=list[DataBansosPublicResponse])
@router.get("/cek/{nik}", response_model=list[DataBansosPublicResponse])
def cek_bansos_by_nik(nik: str, db: Session = Depends(get_db)):
    penerima = db.query(DataBansos).filter(DataBansos.nik_penerima == nik).all()
    if not penerima:
        return []
    return [mask_bansos_response(item) for item in penerima]


@router.post("", response_model=DataBansosResponse, status_code=201)
def tambah_penerima_bansos(
    data: DataBansosCreate,
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    penerima_baru = DataBansos(**data.model_dump())
    db.add(penerima_baru)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Data penerima bansos bertentangan dengan data yang sudah ada.") from exc
    db.refresh(penerima_baru)
    return penerima_baru


@router.put("/penerima/{id_bansos}", response_model=DataBansosResponse)
def ubah_penerima_bansos(
    id_bansos: int,
    data: DataBansosCreate,
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    penerima = db.query(DataBansos).filter(DataBansos.id_bansos == id_bansos).first()
    if not penerima:
        raise HTTPException(status_code=404, detail="Data penerima bansos tidak ditemukan.")
    for field, value in data.model_dump().items():
        setattr(penerima, field, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Data penerima bertentangan dengan data yang sudah ada.") from exc
    db.refresh(penerima)
    return penerima


@router.delete("/penerima/{id_bansos}")
def hapus_penerima_bansos(
    id_bansos: int,
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    penerima = db.query(DataBansos).filter(DataBansos.id_bansos == id_bansos).first()
    if not penerima:
        raise HTTPException(status_code=404, detail="Data penerima bansos tidak ditemukan.")
    db.delete(penerima)
    db.commit()
    return {"status": "success", "message": "Data penerima bansos berhasil dihapus."}
