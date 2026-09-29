import random
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.pengaduan import PengaduanBansos
from app.models.user import User
from app.schemas.pengaduan import PengaduanCreate, PengaduanResponse

router = APIRouter()


def generate_nomor_tiket():
    tanggal = datetime.now().strftime("%Y%m%d")
    acak = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ADU-{tanggal}-{acak}"


@router.post("", response_model=PengaduanResponse, status_code=201)
def buat_pengaduan(pengaduan_data: PengaduanCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id_user == pengaduan_data.id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")

    tiket = generate_nomor_tiket()

    new_pengaduan = PengaduanBansos(
        nomor_tiket=tiket,
        id_user=pengaduan_data.id_user,
        nik_terlapor=pengaduan_data.nik_terlapor,
        kategori_aduan=pengaduan_data.kategori_aduan,
        program_terkait=pengaduan_data.program_terkait,
        deskripsi_kejadian=pengaduan_data.deskripsi_kejadian,
        lokasi_spesifik=pengaduan_data.lokasi_spesifik,
        bukti_foto=pengaduan_data.bukti_foto,
        is_anonymous=pengaduan_data.is_anonymous,
        status_laporan="pending",
    )
    db.add(new_pengaduan)
    db.commit()
    db.refresh(new_pengaduan)
    return new_pengaduan


@router.get("/tracking/{nomor_tiket}", response_model=PengaduanResponse)
def tracking_pengaduan(nomor_tiket: str, db: Session = Depends(get_db)):
    pengaduan = db.query(PengaduanBansos).filter(PengaduanBansos.nomor_tiket == nomor_tiket).first()
    if not pengaduan:
        raise HTTPException(status_code=404, detail="Nomor Tiket tidak ditemukan!")
    return pengaduan


@router.get("/user/{id_user}", response_model=list[PengaduanResponse])
def get_pengaduan_by_user(id_user: int, db: Session = Depends(get_db)):
    pengaduan = db.query(PengaduanBansos).filter(PengaduanBansos.id_user == id_user).all()
    return pengaduan
