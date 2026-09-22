from pydantic import BaseModel
from typing import Optional

# ==================== SCHEMAS USER & REGISTER ====================
class RegisterRequest(BaseModel):
    nik: str
    nama: str
    password: str
    rt: Optional[str] = "01"
    rw: Optional[str] = "01"

class UserData(BaseModel):
    id: int
    nik: str
    nama: str

class RegisterResponse(BaseModel):
    status: str
    message: str
    data: UserData

    class Config:
        from_attributes = True

# ==================== SCHEMAS PENGAJUAN BANSOS (POIN 3) ====================
class PengajuanCreate(BaseModel):
    user_id: int
    jenis_bansos: str
    alasan: str

class PengajuanData(BaseModel):
    id_pengajuan: int
    user_id: int
    jenis_bansos: str
    status: str

class PengajuanResponse(BaseModel):
    status: str
    message: str
    data: PengajuanData

    class Config:
        from_attributes = True