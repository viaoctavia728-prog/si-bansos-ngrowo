from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db_connection, engine, get_db
import models, schemas

app = FastAPI(title="SI-BANSOS Desa Ngrowo API")

# Buat tabel otomatis di database jika belum ada
models.Base.metadata.create_all(bind=engine)

# Konfigurasi CORS agar Frontend bisa mengakses Backend ini
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Selamat datang di Backend SI-BANSOS Desa Ngrowo!"}

@app.get("/tes-db")
def tes_koneksi_db():
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
        connection.close()
        return {
            "status": "Sukses",
            "message": "Berhasil terhubung ke database db_sibansos_ngrowo!",
            "tabel_terdeteksi": tables
        }
    except Exception as e:
        return {
            "status": "Gagal",
            "error": str(e)
        }

# ==================== FITUR REGISTRASI (POIN 1) ====================
@app.post("/register", response_model=schemas.RegisterResponse, status_code=status.HTTP_201_CREATED)
def register_warga(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    user_exist = db.query(models.User).filter(models.User.nik == payload.nik).first()
    if user_exist:
        raise HTTPException(status_code=400, detail="NIK ini sudah terdaftar!")

    user_baru = models.User(
        nik=payload.nik,
        nama=payload.nama,
        password=payload.password,
        rt=payload.rt,
        rw=payload.rw,
        role="warga"
    )
    db.add(user_baru)
    db.commit()
    db.refresh(user_baru)

    return {
        "status": "Sukses",
        "message": "Pendaftaran akun warga berhasil!",
        "data": {"id": user_baru.id, "nik": user_baru.nik, "nama": user_baru.nama}
    }

# ==================== FITUR LOGIN (POIN 2) ====================
@app.post("/login")
def login_warga(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.nik == payload.nik).first()
    
    if not user or user.password != payload.password:
        raise HTTPException(status_code=400, detail="NIK atau password salah!")
        
    return {
        "status": "Sukses",
        "message": "Login berhasil!",
        "data": {
            "id": user.id,
            "nik": user.nik,
            "nama": user.nama,
            "role": user.role
        }
    }

# ==================== FITUR PENGAJUAN BANSOS (POIN 3) ====================
@app.post("/pengajuan", status_code=status.HTTP_201_CREATED)
def ajukan_bansos(payload: schemas.PengajuanCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")

    pengajuan_baru = models.PengajuanBansos(
        user_id=payload.user_id,
        jenis_bansos=payload.jenis_bansos,
        alasan=payload.alasan,
        status="Pending"
    )
    db.add(pengajuan_baru)
    db.commit()
    db.refresh(pengajuan_baru)

    return {
        "status": "Sukses",
        "message": "Pengajuan Bansos berhasil dikirim!",
        "data": {
            "id_pengajuan": pengajuan_baru.id,
            "user_id": pengajuan_baru.user_id,
            "jenis_bansos": pengajuan_baru.jenis_bansos,
            "status": pengajuan_baru.status
        }
    }

# ==================== FITUR ADMIN (POIN 4) ====================

# 1. Admin melihat semua daftar pengajuan warga
@app.get("/admin/pengajuan")
def lihat_semua_pengajuan(db: Session = Depends(get_db)):
    semua_pengajuan = db.query(models.PengajuanBansos).all()
    return {
        "status": "Sukses",
        "total_pengajuan": len(semua_pengajuan),
        "data": semua_pengajuan
    }

# 2. Admin mengubah status pengajuan (Misal: "Approved" atau "Rejected")
@app.put("/admin/pengajuan/{id_pengajuan}")
def update_status_pengajuan(id_pengajuan: int, status_baru: str, db: Session = Depends(get_db)):
    pengajuan = db.query(models.PengajuanBansos).filter(models.PengajuanBansos.id == id_pengajuan).first()
    if not pengajuan:
        raise HTTPException(status_code=404, detail="Data pengajuan tidak ditemukan!")
    
    pengajuan.status = status_baru
    db.commit()
    db.refresh(pengajuan)

    return {
        "status": "Sukses",
        "message": f"Status pengajuan ID {id_pengajuan} berhasil diubah menjadi '{status_baru}'!",
        "data": pengajuan
    }