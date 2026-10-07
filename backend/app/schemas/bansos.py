from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class DataBansosCreate(BaseModel):
  nik_penerima: str = Field(min_length=16, max_length=16, pattern=r"^\d{16}$")
  nama_penerima: str = Field(min_length=2, max_length=100)
  no_kk: Optional[str] = Field(default=None, min_length=16, max_length=16, pattern=r"^\d{16}$")
  jenis_bansos: str = Field(min_length=2, max_length=50)
  periode_tahun: int = Field(ge=2000, le=2100)
  status_penerima: Literal["aktif", "graduasi", "penangguhan"] = "aktif"
  rt: str = Field(min_length=1, max_length=10)
  rw: str = Field(min_length=1, max_length=10)
  dusun: Optional[str] = Field(default=None, max_length=50)


class DataBansosResponse(DataBansosCreate):
  id_bansos: int

  class Config:
    from_attributes = True


# Schema Khusus Cek Bansos Publik Warga (Input NIK di Frontend)
class CekBansosRequest(BaseModel):
  nik: str = Field(min_length=16, max_length=16, pattern=r"^\d{16}$")


class CekBansosResponse(BaseModel):
  terdaftar: bool
  nik: str
  nama_penerima: Optional[str] = None
  rt: Optional[str] = None
  rw: Optional[str] = None
  detail_bantuan: List[Dict[str, str]] = Field(default_factory=list)