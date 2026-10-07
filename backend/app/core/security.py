from datetime import datetime, timedelta
from typing import Any, Dict

from jose import JWTError, jwt
from passlib.context import CryptContext  # <--- Tambahan untuk Bcrypt

from app.core.config import get_settings

settings = get_settings()

# Setup konteks enkripsi password menggunakan Bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# 1. FUNGSI BCRYPT (ENKRIPSI PASSWORD)
# ==========================================
def hash_password(password: str) -> str:
    """Mengubah password plain text menjadi hash Bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Memverifikasi apakah password cocok dengan hash yang tersimpan"""
    return pwd_context.verify(plain_password, hashed_password)


# ==========================================
# 2. FUNGSI JWT TOKEN
# ==========================================
def create_access_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError as exc:
        raise ValueError("Token tidak valid") from exc