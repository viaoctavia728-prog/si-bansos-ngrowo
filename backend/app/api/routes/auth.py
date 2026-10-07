import json
import secrets
from pathlib import Path
from urllib.parse import parse_qsl
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.core.storage import MAX_UPLOAD_BYTES, UPLOAD_DIR
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, UserProfileUpdate, UserRegister, UserResponse

router = APIRouter()
PROFILE_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}


@router.post("/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    user_exist = db.query(User).filter(User.nik == user_data.nik).first()
    if user_exist:
        raise HTTPException(status_code=400, detail="NIK sudah terdaftar!")

    while True:
        username = f"warga_{secrets.token_hex(4)}"
        if not db.query(User).filter(User.username == username).first():
            break

    new_user = User(
        nik=user_data.nik,
        username=username,
        nama_lengkap=user_data.nama_lengkap,
        no_kk=user_data.no_kk,
        no_hp=user_data.no_hp,
        alamat_detail=user_data.alamat_detail,
        password_hash=hash_password(user_data.password),  # ✅ Hash bcrypt
        rt=user_data.rt,
        rw=user_data.rw,
        role="user",
    )
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="NIK atau username sudah terdaftar!") from exc
    db.refresh(new_user)

    return {
        "message": "Registrasi berhasil",
        "data": {
            "id_user": new_user.id_user,
            "nik": new_user.nik,
            "username": new_user.username,
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
                            "grant_type": {"type": "string", "default": "password"},
                            "username": {"type": "string", "description": "Username akun warga atau admin"},
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
                            "password": {"type": "string", "example": "password123"},
                        },
                        "required": ["nik", "password"],
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

    try:
        if "application/json" in content_type:
            body = await request.json()
            identifier = body.get("nik") or body.get("username")
            password = body.get("password")
        else:
            form = await request.form()
            identifier = form.get("username") or form.get("nik")
            password = form.get("password")
    except Exception:
        try:
            raw_body = await request.body()
            if raw_body:
                if "application/x-www-form-urlencoded" in content_type:
                    payload = dict(parse_qsl(raw_body.decode("utf-8"), keep_blank_values=True))
                else:
                    payload = json.loads(raw_body.decode("utf-8"))
                identifier = payload.get("username") or payload.get("nik")
                password = payload.get("password")
        except Exception:
            pass

    if not identifier or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="NIK/Username dan Password wajib diisi!",
        )

    identifier = str(identifier).strip()
    user = db.query(User).filter(User.nik == identifier).first()
    if not user:
        user = db.query(User).filter(User.username == identifier).first()

    if not user and identifier.lower() == "admin":
        user = db.query(User).filter(User.role == "admin").first()

    if not user or not verify_password(str(password), user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="NIK/Username atau Password salah!",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"id_user": user.id_user, "role": user.role})

    return {
        "access_token": token,
        "token": token,
        "token_type": "bearer",
        "message": "Login berhasil!",
        "data": {
            "id_user": user.id_user,
            "nik": user.nik,
            "nama_lengkap": user.nama_lengkap,
            "role": user.role,
            "rt": user.rt,
            "rw": user.rw,
            "foto_profil": user.foto_profil,
        },
    }


@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id_user == current_user.get("id_user")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Profil pengguna tidak ditemukan!")
    return user


@router.patch("/me", response_model=UserResponse)
def update_current_profile(
    profile: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id_user == current_user.get("id_user")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Profil pengguna tidak ditemukan!")
    for field, value in profile.model_dump(exclude_unset=True).items():
        setattr(user, field, value.strip() if isinstance(value, str) else value)
    db.commit()
    db.refresh(user)
    return user


@router.post("/me/photo", response_model=UserResponse)
async def upload_current_profile_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id_user == current_user.get("id_user")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Profil pengguna tidak ditemukan!")
    extension = PROFILE_IMAGE_TYPES.get(file.content_type or "")
    if not extension:
        raise HTTPException(status_code=400, detail="Foto harus berformat JPG, PNG, atau WEBP.")
    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="File foto tidak boleh kosong.")
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran foto maksimal 2 MB.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"profile_{user.id_user}_{uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(contents)
    previous_photo = user.foto_profil
    user.foto_profil = f"/uploads/{filename}"
    db.commit()
    db.refresh(user)
    if previous_photo:
        previous_path = UPLOAD_DIR / Path(previous_photo).name
        if previous_path.name.startswith(f"profile_{user.id_user}_") and previous_path.is_file():
            previous_path.unlink(missing_ok=True)
    return user


@router.delete("/me/photo", response_model=UserResponse)
def delete_current_profile_photo(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id_user == current_user.get("id_user")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Profil pengguna tidak ditemukan!")
    previous_photo = user.foto_profil
    user.foto_profil = None
    db.commit()
    db.refresh(user)
    if previous_photo:
        previous_path = UPLOAD_DIR / Path(previous_photo).name
        if previous_path.name.startswith(f"profile_{user.id_user}_") and previous_path.is_file():
            previous_path.unlink(missing_ok=True)
    return user


@router.get("/user/{nik}", response_model=UserResponse)
def get_user_by_nik(
    nik: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = db.query(User).filter(User.nik == nik).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")
    if user.id_user != current_user.get("id_user") and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Data user hanya dapat dilihat oleh pemilik akun atau admin.")
    return user