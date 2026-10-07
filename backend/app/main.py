from datetime import datetime, timezone

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.deps import get_current_user
from app.api.routes import admin, auth, bansos, notifications, pengaduan, wilayah
from app.core.config import get_settings
from app.core.storage import UPLOAD_DIR
from app.db.init_db import create_tables

# Buat semua tabel jika belum ada
create_tables()

app = FastAPI(
    title="SI-BANSOS NGROWO API",
    description="Backend API Sistem Informasi Transparansi & Pengaduan Bansos Desa Ngrowo",
    version="2.0.0",
)

# CORS Middleware agar frontend React/Vite dapat terhubung
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in get_settings().cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router utama
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(auth.router, prefix="/api", tags=["Auth API"])
# Alias router untuk kompatibilitas endpoint langsung /login dan /register
app.include_router(auth.router, tags=["Auth Alias"])

app.include_router(bansos.router, prefix="/bansos", tags=["Bansos"])
app.include_router(bansos.router, prefix="/api/bansos", tags=["Bansos API"])
app.include_router(bansos.public_router, tags=["Bansos Publik"])

app.include_router(pengaduan.router, prefix="/pengaduan", tags=["Pengaduan"])
app.include_router(pengaduan.router, prefix="/api/pengaduan", tags=["Pengaduan API"])

app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin API"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications API"])

app.include_router(wilayah.router, prefix="/wilayah", tags=["Wilayah"])
app.include_router(wilayah.router, prefix="/api/wilayah", tags=["Wilayah API"])

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/")
def root():
    return {"message": "Selamat Datang di API SI-BANSOS Desa Ngrowo!"}


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "app": "si-bansos-ngrowo",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/me")
def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    return {"data": current_user}


@app.get("/api/jadwal")
def get_jadwal():
    return {
        "status": "ok",
        "data": {
            "judul": "Jadwal Penyaluran Bansos Desa Ngrowo",
            "tahap": "Tahap II - 2026",
            "tanggal": "2026-11-18",
            "waktu": "08.00 - 12.00 WIB",
            "lokasi": "Balai Desa Ngrowo",
            "program": "Beras CPP 10 Kg / KPM",
            "total_kpm": 222,
            "sesi": [
                {"rt": "001", "jumlah_kpm": 124, "waktu": "08.00 - 10.00 WIB"},
                {"rt": "002", "jumlah_kpm": 98, "waktu": "10.00 - 12.00 WIB"},
            ],
        },
    }