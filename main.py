from fastapi import FastAPI, Depends, HTTPException, status, Query, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Optional
import base64
import binascii
import json
import os
import urllib.error
import urllib.request
import models
import schemas
from database import engine, get_db
import random
import string
from datetime import datetime
from pathlib import Path
from uuid import uuid4

# Buat semua tabel database secara otomatis
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SI-BANSOS NGROWO API",
    description="Backend API Sistem Informasi Transparansi & Pengaduan Bansos Desa Ngrowo",
    version="2.0.0"
)

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Mengizinkan semua origin (termasuk localhost:5173 Vite)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def generate_nomor_tiket():
    tanggal = datetime.now().strftime("%Y%m%d")
    acak = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ADU-{tanggal}-{acak}"


@app.get("/")
def root():
    return {"message": "Selamat Datang di API SI-BANSOS Desa Ngrowo!", "status": "online"}


# ==================== ROUTER DENGAN PREFIX & NON-PREFIX ====================
api_router = APIRouter()

# --- AUTENTIKASI ---
@api_router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserRegister, db: Session = Depends(get_db)):
    user_exist = db.query(models.User).filter(models.User.nik == user_data.nik).first()
    if user_exist:
        raise HTTPException(status_code=400, detail="NIK sudah terdaftar!")

    # Cek apakah warga Ngrowo berdasarkan master data wilayah
    is_ngrowo = False
    if user_data.rt and user_data.rw:
        wilayah = db.query(models.WilayahNgrowo).filter(
            models.WilayahNgrowo.rt == user_data.rt,
            models.WilayahNgrowo.rw == user_data.rw
        ).first()
        is_ngrowo = wilayah is not None

    new_user = models.User(
        nik=user_data.nik,
        nama_lengkap=user_data.nama_lengkap,
        no_kk=user_data.no_kk,
        no_hp=user_data.no_hp,
        username=user_data.username or user_data.nik,
        password_hash=user_data.password,
        rt=user_data.rt or "001",
        rw=user_data.rw or "001",
        role="user",
        is_ngrowo_resident=is_ngrowo,
        is_verified=is_ngrowo,  # Warga Ngrowo otomatis terverifikasi
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@api_router.post("/login")
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # Coba login dengan NIK (warga) atau username (admin)
    user = None

    # Login admin: pakai username + password
    if login_data.username:
        user = db.query(models.User).filter(
            models.User.username == login_data.username,
            models.User.password_hash == login_data.password,
            models.User.role == "admin"
        ).first()
        if user:
            return {
                "message": "Login Admin Berhasil!",
                "token": f"token-admin-{user.username}-{user.id_user}",
                "access_token": f"token-admin-{user.username}-{user.id_user}",
                "data": {
                    "id_user": user.id_user,
                    "nik": user.nik,
                    "nama_lengkap": user.nama_lengkap,
                    "no_kk": user.no_kk,
                    "no_hp": user.no_hp,
                    "role": user.role,
                    "rt": user.rt,
                    "rw": user.rw,
                    "username": user.username,
                }
            }

    # Login warga: pakai NIK + password
    if login_data.nik:
        user = db.query(models.User).filter(
            models.User.nik == login_data.nik,
            models.User.password_hash == login_data.password
        ).first()

    if not user:
        raise HTTPException(status_code=401, detail="NIK atau Password salah!")

    return {
        "message": "Login Berhasil!",
        "token": f"token-{user.nik}-{user.id_user}",
        "access_token": f"token-{user.nik}-{user.id_user}",
        "data": {
            "id_user": user.id_user,
            "nik": user.nik,
            "nama_lengkap": user.nama_lengkap,
            "no_kk": user.no_kk,
            "no_hp": user.no_hp,
            "role": user.role,
            "rt": user.rt,
            "rw": user.rw,
            "username": user.username,
            "is_ngrowo_resident": user.is_ngrowo_resident,
            "is_verified": user.is_verified,
        }
    }


@api_router.get("/user/{nik}", response_model=schemas.UserResponse)
def get_user_by_nik(nik: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.nik == nik).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data user tidak ditemukan!")
    return user


# --- TRANSPARANSI DATA BANSOS ---
@api_router.get("/bansos/penerima", response_model=List[schemas.DataBansosResponse])
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


@api_router.get("/bansos/cek/{nik}", response_model=List[schemas.DataBansosResponse])
def cek_bansos_nik(nik: str, db: Session = Depends(get_db)):
    hasil = db.query(models.DataBansos).filter(models.DataBansos.nik_penerima == nik).all()
    return hasil


@api_router.post("/admin/bansos", response_model=schemas.DataBansosResponse, status_code=status.HTTP_201_CREATED)
def tambah_penerima_bansos(data: schemas.DataBansosCreate, db: Session = Depends(get_db)):
    penerima_baru = models.DataBansos(**data.dict())
    db.add(penerima_baru)
    db.commit()
    db.refresh(penerima_baru)
    return penerima_baru


# --- PENGADUAN BANSOS ---
@api_router.post("/pengaduan/upload-bukti")
def upload_bukti_foto(data: schemas.BuktiFotoUpload):
    allowed_types = {"image/jpeg": ".jpg", "image/png": ".png"}
    extension = allowed_types.get(data.content_type)
    if not extension:
        raise HTTPException(status_code=400, detail="Foto harus berformat JPG atau PNG.")

    if len(data.content_base64) > 2_800_000:
        raise HTTPException(status_code=400, detail="Ukuran foto maksimal 2 MB.")

    try:
        image_bytes = base64.b64decode(data.content_base64, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(status_code=400, detail="Data foto tidak valid.")

    if len(image_bytes) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran foto maksimal 2 MB.")
    if data.content_type == "image/jpeg" and not image_bytes.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=400, detail="Isi file bukan foto JPG yang valid.")
    if data.content_type == "image/png" and not image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=400, detail="Isi file bukan foto PNG yang valid.")

    filename = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(image_bytes)
    return {"bukti_foto": f"/uploads/{filename}"}


@api_router.post("/pengaduan", response_model=schemas.PengaduanResponse, status_code=status.HTTP_201_CREATED)
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
        status_laporan="pending",
        estimated_desil=pengaduan_data.estimated_desil,
    )
    db.add(new_pengaduan)
    db.commit()
    db.refresh(new_pengaduan)
    return new_pengaduan


@api_router.get("/pengaduan/tracking/{nomor_tiket}", response_model=schemas.PengaduanResponse)
def tracking_pengaduan(nomor_tiket: str, db: Session = Depends(get_db)):
    pengaduan = db.query(models.PengaduanBansos).filter(
        models.PengaduanBansos.nomor_tiket == nomor_tiket
    ).first()

    if not pengaduan:
        raise HTTPException(status_code=404, detail="Nomor Tiket tidak ditemukan!")

    return pengaduan


@api_router.get("/pengaduan/user/{id_user}", response_model=List[schemas.PengaduanResponse])
def get_pengaduan_by_user(id_user: int, db: Session = Depends(get_db)):
    return db.query(models.PengaduanBansos).filter(models.PengaduanBansos.id_user == id_user).order_by(models.PengaduanBansos.created_at.desc()).all()


# --- ANALISIS BUKTI FOTO DENGAN LLM (Estimasi Desil) ---
@api_router.post("/analyze-evidence")
def analyze_evidence(data: schemas.EvidenceAnalysisRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY belum dikonfigurasi di backend.")

    if not data.image_data.startswith("data:image/") or "," not in data.image_data:
        raise HTTPException(status_code=400, detail="Bukti harus berupa data URL gambar yang valid.")

    media_type, encoded_image = data.image_data.split(",", 1)
    prompt = (
        "Analisis foto rumah ini sebagai bantuan awal untuk petugas desa. "
        "Berikan estimasi kondisi rumah yang mungkin berkorelasi dengan desil kesejahteraan, "
        "bukan keputusan kelayakan bansos. Jangan menebak identitas, suku, agama, kesehatan, "
        "atau atribut sensitif. Balas JSON valid dengan keys: estimated_desil (1-10 atau null), "
        "confidence (0-1), observations (array string), limitations (array string). "
        "Gunakan null jika foto tidak cukup jelas. Deskripsi warga: " + data.description
    )
    payload = {
        "model": os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini"),
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": data.image_data}},
            ],
        }],
    }

    http_request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(http_request, timeout=45) as response:
            result = json.loads(response.read().decode("utf-8"))
        analysis = json.loads(result["choices"][0]["message"]["content"])
    except (urllib.error.URLError, urllib.error.HTTPError, KeyError, IndexError, json.JSONDecodeError) as error:
        raise HTTPException(status_code=502, detail=f"Analisis bukti gagal: {error}") from error

    return {
        "status": "preliminary",
        "estimated_desil": analysis.get("estimated_desil"),
        "confidence": analysis.get("confidence"),
        "observations": analysis.get("observations", []),
        "limitations": analysis.get("limitations", []),
        "disclaimer": "Estimasi AI ini bukan penetapan desil resmi dan wajib diverifikasi petugas desa.",
    }


# --- JADWAL BANSOS ---
@api_router.get("/jadwal")
def get_jadwal_bansos():
    return [
        {
            "id": 1,
            "program": "Bansos Beras CPP 10 Kg",
            "tanggal": "15 Oktober 2026",
            "jam": "08:30 - 14:00 WIB",
            "lokasi": "Pendopo Balai Desa Ngrowo",
            "status": "Akan Datang",
            "persyaratan": ["KTP Asli Penerima", "Kartu Keluarga Asli", "Undangan Ber-Barcode dari RT"],
            "dusun": "Dusun Krajan (RT 01, 02) & Ngrowo Timur (RT 01)"
        },
        {
            "id": 2,
            "program": "BLT Dana Desa (Triwulan IV)",
            "tanggal": "28 Oktober 2026",
            "jam": "09:00 - 12:00 WIB",
            "lokasi": "Ruang Pelayanan Kantor Kelurahan Ngrowo",
            "status": "Dijadwalkan",
            "persyaratan": ["KTP Asli", "Fotokopi KK 1 Lembar"],
            "dusun": "Semua Dusun Kelurahan Ngrowo"
        },
        {
            "id": 3,
            "program": "Penyaluran BPNT Sembako",
            "tanggal": "05 November 2026",
            "jam": "08:00 - 15:00 WIB",
            "lokasi": "E-Warong Amanah Makmur Ngrowo",
            "status": "Persiapan",
            "persyaratan": ["KKS (Kartu Keluarga Sejahtera)", "KTP Elektronik"],
            "dusun": "Seluruh Wilayah RT/RW"
        }
    ]


# --- ADMIN: KELOLA WARGA ---
@api_router.get("/admin/warga")
def get_semua_warga(db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.role == "user").order_by(models.User.created_at.desc()).all()
    return [
        {
            "id_user": u.id_user,
            "nik": u.nik,
            "nama_lengkap": u.nama_lengkap,
            "no_kk": u.no_kk,
            "no_hp": u.no_hp,
            "username": u.username,
            "rt": u.rt,
            "rw": u.rw,
            "role": u.role,
            "is_ngrowo_resident": u.is_ngrowo_resident,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@api_router.get("/admin/pending-warga")
def get_pending_warga(db: Session = Depends(get_db)):
    """Daftar warga yang bukan penduduk Ngrowo dan belum diverifikasi admin."""
    users = db.query(models.User).filter(
        models.User.role == "user",
        models.User.is_ngrowo_resident == False,
        models.User.is_verified == False,
    ).order_by(models.User.created_at.desc()).all()
    return [
        {
            "id_user": u.id_user,
            "nik": u.nik,
            "nama_lengkap": u.nama_lengkap,
            "no_kk": u.no_kk,
            "no_hp": u.no_hp,
            "username": u.username,
            "rt": u.rt,
            "rw": u.rw,
            "role": u.role,
            "is_ngrowo_resident": u.is_ngrowo_resident,
            "is_verified": u.is_verified,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@api_router.put("/admin/approve-warga/{id_user}")
def approve_warga(id_user: int, db: Session = Depends(get_db)):
    """Admin menyetujui warga yang baru mendaftar (misal setelah registrasi di kantor desa)."""
    user = db.query(models.User).filter(models.User.id_user == id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan!")

    user.is_ngrowo_resident = True
    user.is_verified = True
    db.commit()
    db.refresh(user)

    # Catat di audit log
    audit = models.AuditLog(
        id_user=id_user,
        aktivitas=f"Admin menyetujui registrasi warga: {user.nama_lengkap} (NIK: {user.nik})"
    )
    db.add(audit)
    db.commit()

    return {"message": f"Warga {user.nama_lengkap} berhasil diverifikasi sebagai penduduk Ngrowo."}


@api_router.put("/admin/reject-warga/{id_user}")
def reject_warga(id_user: int, db: Session = Depends(get_db)):
    """Admin menolak pendaftaran warga non-Ngrowo."""
    user = db.query(models.User).filter(models.User.id_user == id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="Data warga tidak ditemukan!")

    nama = user.nama_lengkap
    nik = user.nik

    # Catat di audit log sebelum hapus
    audit = models.AuditLog(
        id_user=id_user,
        aktivitas=f"Admin menolak registrasi warga non-Ngrowo: {nama} (NIK: {nik})"
    )
    db.add(audit)
    db.delete(user)
    db.commit()

    return {"message": f"Pendaftaran warga {nama} ditolak dan dihapus dari sistem."}


# --- ADMIN PENGADUAN ---
@api_router.get("/admin/pengaduan", response_model=List[schemas.PengaduanResponse])
def get_semua_pengaduan(db: Session = Depends(get_db)):
    return db.query(models.PengaduanBansos).all()


@api_router.put("/admin/pengaduan/{id_laporan}", response_model=schemas.PengaduanResponse)
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


# --- ADMIN: AUDIT LOG ---
@api_router.get("/admin/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(100).all()
    return [
        {
            "id_log": log.id_log,
            "id_user": log.id_user,
            "aktivitas": log.aktivitas,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
        }
        for log in logs
    ]


# --- ADMIN: WILAYAH NGROWO ---
@api_router.get("/admin/wilayah", response_model=List[schemas.WilayahResponse])
def get_wilayah_ngrowo(db: Session = Depends(get_db)):
    return db.query(models.WilayahNgrowo).all()


# --- TES KONEKSI DATABASE ---
@api_router.get("/tes-db")
def tes_koneksi_db(db: Session = Depends(get_db)):
    try:
        from sqlalchemy import text
        result = db.execute(text("SHOW TABLES;"))
        tables = [row[0] for row in result]
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


# Tambahkan prefix /auth di bawah include_router kamu
app.include_router(api_router)
app.include_router(api_router, prefix="/api")
app.include_router(api_router, prefix="/auth")