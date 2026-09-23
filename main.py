from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import engine, get_db
import random
import string
from datetime import datetime

# Buat semua tabel MySQL secara otomatis
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SI-BANSOS NGROWO API",
    description="Backend API Sistem Informasi Transparansi & Pengaduan Bansos Desa Ngrowo",
    version="2.0.0"
)

def generate_nomor_tiket():
    tanggal = datetime.now().strftime("%Y%m%d")
    acak = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ADU-{tanggal}-{acak}"


@app.get("/")
def root():
    return {"message": "Selamat Datang di API SI-BANSOS Desa Ngrowo!"}


# ==================== AUTENTIKASI ====================

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    user_exist = db.query(models.User).filter(models.User.nik == user_data.nik).first()
    if user_exist:
        raise HTTPException(status_code=400, detail="NIK sudah terdaftar!")

    new_user = models.User(
        nik=user_data.nik,
        nama_lengkap=user_data.nama_lengkap,
        no_kk=user_data.no_kk,
        no_hp=user_data.no_hp,
        username=user_data.username,
        password_hash=user_data.password,
        rt=user_data.rt,
        rw=user_data.rw,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@app.post("/login")
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.nik == login_data.nik,
        models.User.password_hash == login_data.password
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="NIK atau Password salah!")

    return {
        "message": "Login Berhasil!",
        "data": {
            "id_user": user.id_user,
            "nik": user.nik,
            "nama_lengkap": user.nama_lengkap,
            "role": user.role,
            "rt": user.rt,
            "rw": user.rw
        }
    }


# ==================== TRANSPARANSI DATA BANSOS (PUBLIK) ====================

@app.get("/bansos/penerima", response_model=List[schemas.DataBansosResponse])
def get_penerima_bansos(
    rt: Optional[str] = None,
    rw: Optional[str] = None,
    jenis_bansos: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.DataBansos)

    if rt:
        query = query.filter(models.DataBansos.rt == rt)
    if rw:
        query = query.filter(models.DataBansos.rw == rw)
    if jenis_bansos:
        query = query.filter(models.DataBansos.jenis_bansos.like(f"%{jenis_bansos}%"))
    if search:
        query = query.filter(
            (models.DataBansos.nama_penerima.like(f"%{search}%")) |
            (models.DataBansos.nik_penerima.like(f"%{search}%"))
        )

    return query.all()


@app.post("/admin/bansos", response_model=schemas.DataBansosResponse, status_code=status.HTTP_201_CREATED)
def tambah_penerima_bansos(data: schemas.DataBansosCreate, db: Session = Depends(get_db)):
    penerima_baru = models.DataBansos(**data.dict())
    db.add(penerima_baru)
    db.commit()
    db.refresh(penerima_baru)
    return penerima_baru


# ==================== PENGADUAN BANSOS (WARGA) ====================

@app.post("/pengaduan", response_model=schemas.PengaduanResponse, status_code=status.HTTP_201_CREATED)
def buat_pengaduan(pengaduan_data: schemas.PengaduanCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id_user == pengaduan_data.id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")

    tiket = generate_nomor_tiket()

    new_pengaduan = models.PengaduanBansos(
        nomor_tiket=tiket,
        id_user=pengaduan_data.id_user,
        nik_terlapor=pengaduan_data.nik_terlapor,
        kategori_aduan=pengaduan_data.kategori_aduan,
        program_terkait=pengaduan_data.program_terkait,
        deskripsi_kejadian=pengaduan_data.deskripsi_kejadian,
        lokasi_spesifik=pengaduan_data.lokasi_spesifik,
        bukti_foto=pengaduan_data.bukti_foto,
        is_anonymous=pengaduan_data.is_anonymous,
        status_laporan="pending"
    )
    db.add(new_pengaduan)
    db.commit()
    db.refresh(new_pengaduan)
    return new_pengaduan


@app.get("/pengaduan/tracking/{nomor_tiket}", response_model=schemas.PengaduanResponse)
def tracking_pengaduan(nomor_tiket: str, db: Session = Depends(get_db)):
    pengaduan = db.query(models.PengaduanBansos).filter(
        models.PengaduanBansos.nomor_tiket == nomor_tiket
    ).first()

    if not pengaduan:
        raise HTTPException(status_code=404, detail="Nomor Tiket tidak ditemukan!")

    return pengaduan


# ==================== ADMIN PENGADUAN ====================

@app.get("/admin/pengaduan", response_model=List[schemas.PengaduanResponse])
def get_semua_pengaduan(db: Session = Depends(get_db)):
    return db.query(models.PengaduanBansos).all()


@app.put("/admin/pengaduan/{id_laporan}", response_model=schemas.PengaduanResponse)
def update_status_pengaduan(
    id_laporan: int,
    data_update: schemas.PengaduanUpdateStatus,
    db: Session = Depends(get_db)
):
    pengaduan = db.query(models.PengaduanBansos).filter(
        models.PengaduanBansos.id_laporan == id_laporan
    ).first()

    if not pengaduan:
        raise HTTPException(status_code=404, detail="Data pengaduan tidak ditemukan!")

    pengaduan.status_laporan = data_update.status_laporan
    if data_update.catatan_admin:
        pengaduan.catatan_admin = data_update.catatan_admin

    db.commit()
    db.refresh(pengaduan)
    return pengaduan