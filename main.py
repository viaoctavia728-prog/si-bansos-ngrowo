from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_db_connection

app = FastAPI(title="SI-BANSOS Desa Ngrowo API")

# Konfigurasi CORS agar Frontend (HTML/JS Nur) bisa mengakses Backend ini
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
            # Ambil daftar semua tabel yang ada di database
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