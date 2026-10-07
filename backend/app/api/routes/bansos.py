from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.bansos import DataBansos
from app.schemas.bansos import DataBansosCreate, DataBansosResponse

router = APIRouter()
public_router = APIRouter()


@router.get("/penerima", response_model=list[DataBansosResponse])
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

    return query.all()


@public_router.get("/cek-bansos/{nik}", response_model=list[DataBansosResponse])
@router.get("/cek/{nik}", response_model=list[DataBansosResponse])
def cek_bansos_by_nik(nik: str, db: Session = Depends(get_db)):
    penerima = db.query(DataBansos).filter(DataBansos.nik_penerima == nik).all()
    if not penerima:
        return []
    return penerima


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
