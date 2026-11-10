from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class PengaduanCreate(BaseModel):
  id_user: Optional[int] = Field(default=None, gt=0)
  nik_terlapor: Optional[str] = Field(default=None, min_length=16, max_length=16, pattern=r"^\d{16}$")
  kategori_aduan: str = Field(min_length=3, max_length=50)
  program_terkait: Optional[str] = Field(default=None, max_length=50)
  deskripsi_kejadian: str = Field(min_length=10, max_length=10000)
  lokasi_spesifik: Optional[str] = Field(default=None, max_length=255)
  bukti_foto: Optional[str] = Field(default=None, max_length=255)
  is_anonymous: Optional[bool] = False


class BuktiFotoUpload(BaseModel):
  filename: str = Field(min_length=1, max_length=255)
  content_type: str = Field(min_length=1, max_length=100)
  content_base64: str = Field(min_length=1, max_length=2_800_000)


class PengaduanUpdateStatus(BaseModel):
  status_laporan: Literal["pending", "proses", "selesai", "ditolak"]
  catatan_admin: Optional[str] = Field(default=None, max_length=5000)


class PengaduanAdminCreate(BaseModel):
  id_user: int = Field(gt=0)
  nik_terlapor: Optional[str] = Field(default=None, min_length=16, max_length=16, pattern=r"^\d{16}$")
  kategori_aduan: str = Field(min_length=3, max_length=50)
  program_terkait: Optional[str] = Field(default=None, max_length=50)
  deskripsi_kejadian: str = Field(min_length=10, max_length=10000)
  lokasi_spesifik: Optional[str] = Field(default=None, max_length=255)
  bukti_foto: Optional[str] = Field(default=None, max_length=255)
  is_anonymous: Optional[bool] = False
  status_laporan: Literal["pending", "proses", "selesai", "ditolak"] = "pending"
  catatan_admin: Optional[str] = Field(default=None, max_length=5000)


class PengaduanAdminUpdate(BaseModel):
  nik_terlapor: Optional[str] = Field(default=None, max_length=16)
  kategori_aduan: Optional[str] = Field(default=None, min_length=3, max_length=50)
  program_terkait: Optional[str] = Field(default=None, max_length=50)
  deskripsi_kejadian: Optional[str] = Field(default=None, min_length=10, max_length=10000)
  lokasi_spesifik: Optional[str] = Field(default=None, max_length=255)
  bukti_foto: Optional[str] = Field(default=None, max_length=255)
  is_anonymous: Optional[bool] = None
  status_laporan: Optional[Literal["pending", "proses", "selesai", "ditolak"]] = None
  catatan_admin: Optional[str] = Field(default=None, max_length=5000)

  # Data penetapan bantuan saat laporan disetujui (status selesai)
  jenis_bansos: Optional[str] = Field(default=None, max_length=50)
  desil: Optional[int] = Field(default=None, ge=1, le=10)
  periode_tahun: Optional[int] = Field(default=None, ge=2000, le=2100)
  nik_penerima: Optional[str] = Field(default=None, max_length=16)


class PengaduanResponse(BaseModel):
  id_laporan: int
  nomor_tiket: str
  id_user: Optional[int] = None
  nik_terlapor: Optional[str] = None
  kategori_aduan: str
  program_terkait: Optional[str] = None
  deskripsi_kejadian: str
  lokasi_spesifik: Optional[str] = None
  bukti_foto: Optional[str] = None
  is_anonymous: bool
  status_laporan: str
  catatan_admin: Optional[str] = None
  created_at: datetime

  class Config:
    from_attributes = True