import random
import string
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister

router = APIRouter()


@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    user_exist = db.query(User).filter(User.nik == user_data.nik).first()
    if user_exist:
        raise HTTPException(status_code=400, detail="NIK sudah terdaftar!")

    new_user = User(
        nik=user_data.nik,
        nama_lengkap=user_data.nama_lengkap,
        no_kk=user_data.no_kk,
        no_hp=user_data.no_hp,
        username=user_data.username,
        password_hash=hash_password(user_data.password),  # ✅ Hash bcrypt
        rt=user_data.rt,
        rw=user_data.rw,
        role="user",
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registrasi berhasil",
        "data": {
            "id_user": new_user.id_user,
            "nik": new_user.nik,
            "nama_lengkap": new_user.nama_lengkap,
            "role": new_user.role,
        },
    }


@router.post(
    "/login",
    openapi_extra={
        "requestBody": {
            "content": {
                "application/x-www-form-urlencoded": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "username": {"type": "string", "description": "Username atau NIK"},
                            "password": {"type": "string", "description": "Password akun"},
                        },
                        "required": ["username", "password"],
                    }
                },
                "application/json": {
                    "schema": {
                        "type": "object",
                        "properties": {
                            "nik": {"type": "string", "example": "3512345678901234"},
                            "username": {"type": "string", "example": "admin"},
                            "password": {"type": "string", "example": "admin123"},
                        },
                        "required": ["password"],
                    }
                },
            }
        }
    },
)
async def login(request: Request, db: Session = Depends(get_db)):
    content_type = request.headers.get("content-type", "")
    identifier = None
    password = None

    if "application/json" in content_type:
        try:
            body = await request.json()
            identifier = body.get("nik") or body.get("username")
            password = body.get("password")
        except Exception:
            pass
    else:
        # Menangani form data (otomatis dikirim dari modal Swagger UI OAuth2 Authorize)
        try:
            form = await request.form()
            identifier = form.get("username") or form.get("nik")
            password = form.get("password")
        except Exception:
            pass

    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username/NIK dan Password wajib diisi!",
        )

    # Cari user berdasarkan NIK atau Username
    user = db.query(User).filter(
        (User.nik == str(identifier).strip()) | (User.username == str(identifier).strip())
    ).first()

    if not user or not verify_password(str(password), user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="NIK/Username atau Password salah!",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"id_user": user.id_user, "role": user.role})

    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Login berhasil!",
        "data": {
            "id_user": user.id_user,
            "nik": user.nik,
            "nama_lengkap": user.nama_lengkap,
            "role": user.role,
            "rt": user.rt,
            "rw": user.rw,
        },
    }

