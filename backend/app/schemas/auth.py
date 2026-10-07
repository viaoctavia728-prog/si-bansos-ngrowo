from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class UserRegister(BaseModel):
    nik: str = Field(min_length=16, max_length=16, pattern=r"^\d{16}$")
    nama_lengkap: str = Field(min_length=2, max_length=100)
    no_kk: Optional[str] = Field(default=None, min_length=16, max_length=16, pattern=r"^\d{16}$")
    no_hp: Optional[str] = Field(default=None, min_length=8, max_length=15, pattern=r"^\d{8,15}$")
    rt: Optional[str] = Field(default=None, max_length=10)
    rw: Optional[str] = Field(default=None, max_length=10)
    alamat_detail: Optional[str] = Field(default=None, max_length=255)
    password: str = Field(min_length=6, max_length=72)

    @field_validator("nik", "nama_lengkap", mode="before")
    @classmethod
    def strip_required_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("no_kk", "no_hp", "rt", "rw", "alamat_detail", mode="before")
    @classmethod
    def normalize_optional_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value

    @field_validator("password")
    @classmethod
    def enforce_bcrypt_byte_limit(cls, value):
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password maksimal 72 byte.")
        return value


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
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True