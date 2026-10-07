from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin
from app.db.session import get_db
from app.models.pengaduan import PengaduanBansos
from app.models.user import User
from app.schemas.auth import UserResponse
from app.schemas.pengaduan import PengaduanResponse, PengaduanUpdateStatus

router = APIRouter()


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


@router.get("/pengaduan", response_model=List[PengaduanResponse])
def get_semua_pengaduan(
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    return db.query(PengaduanBansos).all()


@router.put("/pengaduan/{id_laporan}", response_model=PengaduanResponse)
def update_status_pengaduan(
    id_laporan: int,
    data_update: PengaduanUpdateStatus,
    db: Session = Depends(get_db),
    _current_admin=Depends(get_current_admin),
):
    pengaduan = db.query(PengaduanBansos).filter(PengaduanBansos.id_laporan == id_laporan).first()
    if not pengaduan:
        raise HTTPException(status_code=404, detail="Data pengaduan tidak ditemukan!")

    pengaduan.status_laporan = data_update.status_laporan
    if data_update.catatan_admin:
        pengaduan.catatan_admin = data_update.catatan_admin

    db.commit()
    db.refresh(pengaduan)
    return pengaduan
