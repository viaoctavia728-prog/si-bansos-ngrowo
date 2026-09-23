from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ==================== SCHEMAS USER ====================
class UserRegister(BaseModel):
    nik: str
    nama_lengkap: str
    no_kk: Optional[str] = None
    no_hp: Optional[str] = None
    username: Optional[str] = None
    password: str
    rt: Optional[str] = None
    rw: Optional[str] = None

class UserLogin(BaseModel):
    nik: str
    password: str

class UserResponse(BaseModel):
    id_user: int
    nik: str
    nama_lengkap: str
    username: Optional[str] = None
    role: str
    rt: Optional[str] = None
    rw: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== SCHEMAS PENGADUAN BANSOS ====================
class PengaduanCreate(BaseModel):
    id_user: int
    nik_terlapor: Optional[str] = None
    kategori_aduan: str
    program_terkait: str
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
    id_user: int
    nik_terlapor: Optional[str] = None
    kategori_aduan: str
    program_terkait: str
    deskripsi_kejadian: str
    lokasi_spesifik: Optional[str] = None
    bukti_foto: Optional[str] = None
    is_anonymous: bool
    status_laporan: str
    catatan_admin: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== SCHEMAS DATA BANSOS (TRANSPARANSI) ====================
class DataBansosCreate(BaseModel):
    nik_penerima: str
    nama_penerima: str
    no_kk: Optional[str] = None
    jenis_bansos: str
    periode_tahun: int
    status_penerima: Optional[str] = "aktif"
    rt: str
    rw: str
    dusun: Optional[str] = None

class DataBansosResponse(DataBansosCreate):
    id_bansos: int

    class Config:
        from_attributes = True


# ==================== SCHEMAS WILAYAH NGROWO ====================
class WilayahResponse(BaseModel):
    id_wilayah: int
    dusun: str
    rt: str
    rw: str
    nama_ketua_rt: Optional[str] = None

    class Config:
        from_attributes = True