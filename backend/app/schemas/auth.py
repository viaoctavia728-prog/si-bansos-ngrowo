from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserRegister(BaseModel):
    nik: str
    nama_lengkap: str
    no_kk: Optional[str] = None
    no_hp: Optional[str] = None
    rt: Optional[str] = None
    rw: Optional[str] = None
    alamat_detail: Optional[str] = None  # Menampung seluruh detail alamat warga
    password: str


class UserLogin(BaseModel):
    nik: Optional[str] = None
    username: Optional[str] = None
    password: str


class UserProfileUpdate(BaseModel):
    nama_lengkap: Optional[str] = Field(default=None, min_length=1, max_length=100)
    no_kk: Optional[str] = Field(default=None, max_length=16)
    no_hp: Optional[str] = Field(default=None, max_length=15)
    rt: Optional[str] = Field(default=None, max_length=10)
    rw: Optional[str] = Field(default=None, max_length=10)
    alamat_detail: Optional[str] = Field(default=None, max_length=255)


class UserResponse(BaseModel):
    id_user: int
    nik: str
    nama_lengkap: str
    no_kk: Optional[str] = None
    no_hp: Optional[str] = None
    rt: Optional[str] = None
    rw: Optional[str] = None
    alamat_detail: Optional[str] = None
    foto_profil: Optional[str] = None
    username: Optional[str] = None
    role: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True