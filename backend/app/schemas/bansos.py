from typing import Dict, List, Optional
from pydantic import BaseModel


class DataBansosCreate(BaseModel):
  nik_penerima: str
  nama_penerima: str
  no_kk: Optional[str] = None
  jenis_bansos: str
  periode_tahun: int
  status_penerima: Optional[str] = "aktif"
  rt: str
  rw: str


class DataBansosResponse(DataBansosCreate):
  id_bansos: int

  class Config:
    from_attributes = True


# Schema Khusus Cek Bansos Publik Warga (Input NIK di Frontend)
class CekBansosRequest(BaseModel):
  nik: str


class CekBansosResponse(BaseModel):
  terdaftar: bool
  nik: str
  nama_penerima: Optional[str] = None
  rt: Optional[str] = None
  rw: Optional[str] = None
  detail_bantuan: Optional[List[Dict[str, str]]] = []