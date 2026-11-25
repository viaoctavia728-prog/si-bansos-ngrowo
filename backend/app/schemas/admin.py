from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class EligibleResidentCreate(BaseModel):
    nik: str = Field(min_length=16, max_length=16, pattern=r"^\d{16}$")
    nama_lengkap: str = Field(min_length=2, max_length=100)
    desil: int = Field(ge=1, le=10, default=4)

    @field_validator("nama_lengkap", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value


class EligibleResidentUpdate(BaseModel):
    nama_lengkap: Optional[str] = Field(default=None, min_length=2, max_length=100)
    desil: Optional[int] = Field(default=None, ge=1, le=10)
    is_active: Optional[bool] = None

    @field_validator("nama_lengkap", mode="before")
    @classmethod
    def strip_name(cls, value):
        return value.strip() if isinstance(value, str) else value


class EligibleResidentResponse(BaseModel):
    id: int
    nik: str
    nama_lengkap: str
    desil: int
    is_active: bool
    registered_user_id: Optional[int] = None
    account_active: Optional[bool] = None
    account_verified: Optional[bool] = None

    class Config:
        from_attributes = True


class AdminWargaUpdate(BaseModel):
    nama_lengkap: Optional[str] = Field(default=None, min_length=2, max_length=100)
    no_kk: Optional[str] = Field(default=None, max_length=16, pattern=r"^\d{16}$")
    no_hp: Optional[str] = Field(default=None, max_length=15, pattern=r"^\d{8,15}$")
    rt: Optional[str] = Field(default=None, max_length=10)
    rw: Optional[str] = Field(default=None, max_length=10)
    alamat_detail: Optional[str] = Field(default=None, max_length=255)
    desil: Optional[int] = Field(default=None, ge=1, le=10)

    @field_validator("nama_lengkap", "no_kk", "no_hp", "rt", "rw", "alamat_detail", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value


class JadwalBansosCreate(BaseModel):
    program: str = Field(min_length=2, max_length=120)
    tanggal: str = Field(min_length=2, max_length=40)
    iso_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    jam: str = Field(min_length=2, max_length=60)
    lokasi: str = Field(min_length=2, max_length=180)
    status: str = Field(default="Dijadwalkan", min_length=2, max_length=30)
    persyaratan: list[str] = Field(default_factory=list)

    @field_validator("program", "tanggal", "jam", "lokasi", "status", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("persyaratan", mode="before")
    @classmethod
    def normalize_requirements(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        if isinstance(value, list):
            return [item.strip() for item in value if isinstance(item, str) and item.strip()]
        return value

    @field_validator("iso_date")
    @classmethod
    def validate_iso_date(cls, value):
        date.fromisoformat(value)
        return value


class JadwalBansosUpdate(BaseModel):
    program: Optional[str] = Field(default=None, min_length=2, max_length=120)
    tanggal: Optional[str] = Field(default=None, min_length=2, max_length=40)
    iso_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    jam: Optional[str] = Field(default=None, min_length=2, max_length=60)
    lokasi: Optional[str] = Field(default=None, min_length=2, max_length=180)
    status: Optional[str] = Field(default=None, min_length=2, max_length=30)
    persyaratan: Optional[list[str]] = None

    @field_validator("program", "tanggal", "jam", "lokasi", "status", mode="before")
    @classmethod
    def strip_text(cls, value):
        return value.strip() if isinstance(value, str) else value

    @field_validator("persyaratan", mode="before")
    @classmethod
    def normalize_requirements(cls, value):
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        if isinstance(value, list):
            return [item.strip() for item in value if isinstance(item, str) and item.strip()]
        return value

    @field_validator("iso_date")
    @classmethod
    def validate_iso_date(cls, value):
        if value is not None:
            date.fromisoformat(value)
        return value
