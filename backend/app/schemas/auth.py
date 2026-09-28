from typing import Optional
from pydantic import BaseModel


class UserRegister(BaseModel):
    nik: str
    nama_lengkap: str
    no_kk: Optional[str] = None
    no_hp: Optional[str] = None
    rt: Optional[str] = None
    rw: Optional[str] = None
    alamat_detail: Optional[str] = None  # Menampung seluruh detail alamat warga
    username: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    nik: Optional[str] = None
    username: Optional[str] = None
    password: str


class UserResponse(BaseModel):
    id_user: int
    nik: str
    nama_lengkap: str
    no_kk: Optional[str] = None
    no_hp: Optional[str] = None
    rt: Optional[str] = None
    rw: Optional[str] = None
    alamat_detail: Optional[str] = None
    username: Optional[str] = None
    role: str

    class Config:
        from_attributes = True