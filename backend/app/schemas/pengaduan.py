from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PengaduanCreate(BaseModel):
  id_user: Optional[int] = None  # Dibaca otomatis dari token auth backend
  nik_terlapor: Optional[str] = None
  kategori_aduan: str
  program_terkait: Optional[str] = None  # Opsional agar form FE tidak error
  deskripsi_kejadian: str
  lokasi_spesifik: Optional[str] = None
  bukti_foto: Optional[str] = None
  is_anonymous: Optional[bool] = False


class PengaduanUpdateStatus(BaseModel):
  status_laporan: str
  catatan_admin: Optional[str] = None


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