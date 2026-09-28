from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, bansos, pengaduan, wilayah
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
    allow_origins=[
        "http://localhost:5173",   # Vite dev server (lokal)
        "http://localhost:3000",   # React dev server (alternatif)
        "http://127.0.0.1:5173",
        "http://localhost",        # Docker Nginx frontend
        "http://localhost:80",     # Docker Nginx frontend (eksplisit)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
# Alias router untuk kompatibilitas endpoint langsung /login dan /register
app.include_router(auth.router, tags=["Auth Alias"])

app.include_router(bansos.router, prefix="/bansos", tags=["Bansos"])
app.include_router(pengaduan.router, prefix="/pengaduan", tags=["Pengaduan"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(wilayah.router, prefix="/wilayah", tags=["Wilayah"])


@app.get("/")
def root():
    return {"message": "Selamat Datang di API SI-BANSOS Desa Ngrowo!"}