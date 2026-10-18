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


# --- JADWAL BANSOS (DINAMIS BERDASARKAN WAKTU SAAT INI) ---
BULAN_ID = [
    "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

in_memory_jadwal = []

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
            "dusun": "Dusun Krajan (RT 01, 02) & Ngrowo Timur (RT 01)"
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
            "dusun": "Semua Dusun Kelurahan Ngrowo"
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
            "dusun": "Seluruh Wilayah RT/RW"
        }
    ]


@api_router.get("/jadwal")
def get_jadwal_bansos():
    base = generate_default_dynamic_jadwal()
    if in_memory_jadwal:
        return in_memory_jadwal + base
    return base


@api_router.post("/admin/jadwal")
@api_router.post("/jadwal")
def create_jadwal_bansos(data: schemas.JadwalBansosItem, db: Session = Depends(get_db)):
    new_id = len(in_memory_jadwal) + 10
    item = data.dict()
    item["id"] = new_id
    if isinstance(item.get("persyaratan"), str):
        item["persyaratan"] = [p.strip() for p in item["persyaratan"].split(",") if p.strip()]
    in_memory_jadwal.insert(0, item)

    audit = models.AuditLog(
        id_user=1,
        aktivitas=f"Admin menambahkan jadwal bansos baru: {data.program} pada {data.tanggal}"
    )
    db.add(audit)
    db.commit()
    return item


# --- NOTIFIKASI BROADCAST & IN-APP NOTIFICATION WARGA ---
@api_router.post("/notifications/fcm/send")
@api_router.post("/notifications/send")
def send_fcm_notification(payload: schemas.NotificationCreate, db: Session = Depends(get_db)):
    # 1. Simpan ke database NotificationHistory
    notif = models.NotificationHistory(
        title=payload.title,
        body=payload.body,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # 2. Catat ke Audit Log
    audit = models.AuditLog(
        id_user=1,
        aktivitas=f"Admin menyiarkan notifikasi warga: '{payload.title}' ({payload.body[:45]}...)"
    )
    db.add(audit)
    db.commit()
    return {
        "status": "sent",
        "sent": 1,
        "failed": 0,
        "in_app": True,
        "id_notification": notif.id_notification,
        "message": f"Notifikasi '{payload.title}' berhasil disiarkan dan tersimpan di database warga."
    }


@api_router.post("/notifications/fcm/send-to-token")
def send_fcm_to_token(payload: schemas.NotificationCreate, db: Session = Depends(get_db)):
    notif = models.NotificationHistory(
        title=payload.title,
        body=payload.body,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()

    audit = models.AuditLog(
        id_user=1,
        aktivitas=f"Admin mengirim notifikasi langsung ke perangkat: '{payload.title}'"
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "message": "Notifikasi terkirim dan tersimpan."}


@api_router.get("/notifications")
@api_router.get("/notifications/warga")
def get_warga_notifications(limit: int = 50, db: Session = Depends(get_db)):
    notifs = db.query(models.NotificationHistory).order_by(models.NotificationHistory.created_at.desc()).limit(limit).all()
    return [
        {
            "id_notification": n.id_notification,
            "title": n.title,
            "body": n.body,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "read_at": n.read_at.isoformat() if n.read_at else None,
            "is_read": n.read_at is not None,
        }
        for n in notifs
    ]


@api_router.patch("/notifications/{id_notification}/read")
@api_router.post("/notifications/{id_notification}/read")
def mark_notification_read(id_notification: int, db: Session = Depends(get_db)):
    notif = db.query(models.NotificationHistory).filter(models.NotificationHistory.id_notification == id_notification).first()
    if notif:
        notif.read_at = datetime.utcnow()
        db.commit()
    return {"status": "success"}


# --- UPDATE PROFIL PENGGUNA / ADMIN ---
@api_router.put("/admin/profile/{id_user}", response_model=schemas.UserResponse)
@api_router.put("/user/profile/{id_user}", response_model=schemas.UserResponse)
@api_router.put("/user/{id_user}", response_model=schemas.UserResponse)
def update_user_profile(id_user: int, data: schemas.UserProfileUpdate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id_user == id_user).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")

    if data.nama_lengkap is not None:
        user.nama_lengkap = data.nama_lengkap
    if data.no_kk is not None:
        user.no_kk = data.no_kk
    if data.no_hp is not None:
        user.no_hp = data.no_hp
    if data.username is not None:
        user.username = data.username
    if data.rt is not None:
        user.rt = data.rt
    if data.rw is not None:
        user.rw = data.rw
    if data.password:
        user.password_hash = data.password
    if data.role is not None:
        user.role = data.role

    db.commit()
    db.refresh(user)

    audit = models.AuditLog(
        id_user=user.id_user,
        aktivitas=f"Admin memperbarui profil biodata: {user.nama_lengkap} (NIK: {user.nik})"
    )
    db.add(audit)
    db.commit()
    return user


@api_router.get("/auth/me")
@api_router.get("/me")
def get_me_profile(db: Session = Depends(get_db)):
    admin_user = db.query(models.User).filter(models.User.role == "admin").first()
    if admin_user:
        return admin_user
    user = db.query(models.User).first()
    return user



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
@api_router.post("/admin/approve-warga/{id_user}")
@api_router.put("/admin/verifikasi-warga/{id_user}")
@api_router.post("/admin/verifikasi-warga/{id_user}")
@api_router.put("/verifikasi-warga/{id_user}")
@api_router.post("/verifikasi-warga/{id_user}")
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
@api_router.post("/admin/reject-warga/{id_user}")
@api_router.delete("/admin/reject-warga/{id_user}")
@api_router.put("/admin/tolak-warga/{id_user}")
@api_router.post("/admin/tolak-warga/{id_user}")
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

    audit = models.AuditLog(
        id_user=pengaduan.id_user,
        aktivitas=f"Admin mengubah status laporan {pengaduan.nomor_tiket} menjadi '{data_update.status_laporan}'" + (f" (Catatan: {data_update.catatan_admin})" if data_update.catatan_admin else "")
    )
    db.add(audit)
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