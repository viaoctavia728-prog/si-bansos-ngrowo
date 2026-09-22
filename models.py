from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from datetime import datetime
from database import Base

# Model untuk Tabel Users
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    nik = Column(String(16), unique=True, index=True, nullable=False)
    nama = Column(String(100), nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="warga")
    rt = Column(String(5), nullable=True)
    rw = Column(String(5), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# Model untuk Tabel Pengajuan Bansos (Poin 3)
class PengajuanBansos(Base):
    __tablename__ = "pengajuan_bansos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    jenis_bansos = Column(String(50), nullable=False)
    alasan = Column(Text, nullable=False)
    status = Column(String(20), default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)