from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.security import verify_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    description="Authorize menggunakan username akun dan password. Login web warga tetap dapat memakai NIK.",
)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = verify_token(token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau kadaluarsa",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    user_id = payload.get("id_user")
    if user_id is not None:
        user = db.query(User).filter(User.id_user == user_id, User.is_active.is_(True)).first()
        if not user or payload.get("role") != user.role:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Sesi tidak aktif. Silakan masuk kembali.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    return payload


def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Hanya admin yang diizinkan.",
        )
    return current_user
