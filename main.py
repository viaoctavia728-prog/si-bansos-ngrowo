import base64
import json
import os
import hashlib
import hmac
import secrets
import urllib.error
import urllib.request

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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


class EvidenceAnalysisRequest(BaseModel):
    image_data: str
    description: str = ""


class RegisterRequest(BaseModel):
    nama_lengkap: str
    nik: str
    no_kk: str
    no_wa: str
    rw: str
    rt: str
    detail_alamat: str
    username: str
    password: str


class LoginRequest(BaseModel):
    nik: str
    password: str


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120_000)
    return f"{salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split("$", 1)
        expected = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt_hex), 120_000)
        return hmac.compare_digest(expected.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _ensure_users_table(connection):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS warga (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nama_lengkap VARCHAR(150) NOT NULL,
                nik VARCHAR(16) NOT NULL UNIQUE,
                no_kk VARCHAR(16) NOT NULL,
                no_wa VARCHAR(30) NOT NULL,
                rw VARCHAR(5) NOT NULL,
                rt VARCHAR(5) NOT NULL,
                detail_alamat TEXT NOT NULL,
                username VARCHAR(60) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            """
        )
    connection.commit()


def _public_user(row):
    return {
        "id": row["id"],
        "nama_lengkap": row["nama_lengkap"],
        "nik": row["nik"],
        "no_kk": row["no_kk"],
        "no_wa": row["no_wa"],
        "rw": row["rw"],
        "rt": row["rt"],
        "detail_alamat": row["detail_alamat"],
        "username": row["username"],
    }


@app.post("/register")
def register(request: RegisterRequest):
    if not request.nama_lengkap.strip() or len(request.nik) != 16 or len(request.no_kk) != 16:
        raise HTTPException(status_code=400, detail="Nama, NIK, dan No. KK harus diisi dengan benar.")
    if not request.nik.isdigit() or not request.no_kk.isdigit():
        raise HTTPException(status_code=400, detail="NIK dan No. KK hanya boleh berisi angka.")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password/PIN minimal 6 karakter.")

    connection = None
    try:
        connection = get_db_connection()
        _ensure_users_table(connection)
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM warga WHERE nik = %s OR username = %s", (request.nik, request.username.strip()))
            if cursor.fetchone():
                raise HTTPException(status_code=409, detail="NIK atau username sudah terdaftar.")
            cursor.execute(
                """
                INSERT INTO warga
                (nama_lengkap, nik, no_kk, no_wa, rw, rt, detail_alamat, username, password_hash)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    request.nama_lengkap.strip(), request.nik, request.no_kk, request.no_wa.strip(),
                    request.rw, request.rt, request.detail_alamat.strip(),
                    request.username.strip(), _hash_password(request.password),
                ),
            )
            user_id = cursor.lastrowid
            cursor.execute("SELECT * FROM warga WHERE id = %s", (user_id,))
            user = cursor.fetchone()
        connection.commit()
        return {"message": "Pendaftaran berhasil.", "user": _public_user(user)}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Database tidak dapat menyimpan pendaftaran: {error}") from error
    finally:
        if connection:
            connection.close()


@app.post("/login")
def login(request: LoginRequest):
    connection = None
    try:
        connection = get_db_connection()
        _ensure_users_table(connection)
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM warga WHERE nik = %s", (request.nik,))
            user = cursor.fetchone()
        if not user or not _verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="NIK atau PIN tidak cocok.")
        return {"message": "Login berhasil.", "user": _public_user(user)}
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=503, detail=f"Database tidak dapat memproses login: {error}") from error
    finally:
        if connection:
            connection.close()


@app.post("/analyze-evidence")
def analyze_evidence(request: EvidenceAnalysisRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY belum dikonfigurasi di backend.")

    if not request.image_data.startswith("data:image/") or "," not in request.image_data:
        raise HTTPException(status_code=400, detail="Bukti harus berupa data URL gambar yang valid.")

    media_type, encoded_image = request.image_data.split(",", 1)
    prompt = (
        "Analisis foto rumah ini sebagai bantuan awal untuk petugas desa. "
        "Berikan estimasi kondisi rumah yang mungkin berkorelasi dengan desil kesejahteraan, "
        "bukan keputusan kelayakan bansos. Jangan menebak identitas, suku, agama, kesehatan, "
        "atau atribut sensitif. Balas JSON valid dengan keys: estimated_desil (1-10 atau null), "
        "confidence (0-1), observations (array string), limitations (array string). "
        "Gunakan null jika foto tidak cukup jelas. Deskripsi warga: " + request.description
    )
    payload = {
        "model": os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini"),
        "temperature": 0,
        "response_format": {"type": "json_object"},
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": request.image_data}},
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