from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import verify_token

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    description="Login menggunakan Username/NIK dan Password di form Authorize",
)


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = verify_token(token)
        return payload
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau kadaluarsa",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak! Hanya admin yang diizinkan.",
        )
    return current_user
