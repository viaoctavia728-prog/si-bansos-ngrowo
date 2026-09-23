from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, DateTime
from datetime import datetime
from sqlalchemy.orm import relationship
from database import Base

# 1. Tabel Users
class User(Base):
    __tablename__ = "users"

    id_user = Column(Integer, primary_key=True, index=True)
    nik = Column(String(16), unique=True, index=True, nullable=False)
    nama_lengkap = Column(String(100), nullable=False)
    no_kk = Column(String(16), nullable=True)
    no_hp = Column(String(15), nullable=True)
    username = Column(String(50), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # 'user' atau 'admin'
    rt = Column(String(10), nullable=True)
    rw = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    pengaduan = relationship("PengaduanBansos", back_populates="pelapor")


# 2. Tabel Pengaduan Bansos
class PengaduanBansos(Base):
    __tablename__ = "pengaduan_bansos"

    id_laporan = Column(Integer, primary_key=True, index=True)
    nomor_tiket = Column(String(20), unique=True, index=True, nullable=False)
    id_user = Column(Integer, ForeignKey("users.id_user"), nullable=False)
    nik_terlapor = Column(String(16), nullable=True)
    kategori_aduan = Column(String(50), nullable=False)
    program_terkait = Column(String(50), nullable=False)
    deskripsi_kejadian = Column(Text, nullable=False)
    bukti_foto = Column(String(255), nullable=True)
    lokasi_spesifik = Column(String(255), nullable=True)
    is_anonymous = Column(Boolean, default=False)
    status_laporan = Column(String(20), default="pending")
    catatan_admin = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    pelapor = relationship("User", back_populates="pengaduan")


# 3. Tabel Data Penerima Bansos (Transparansi Publik)
class DataBansos(Base):
    __tablename__ = "data_bansos"

    id_bansos = Column(Integer, primary_key=True, index=True)
    nik_penerima = Column(String(16), index=True, nullable=False)
    nama_penerima = Column(String(100), nullable=False)
    no_kk = Column(String(16), nullable=True)
    jenis_bansos = Column(String(50), nullable=False) # 'PKH', 'BPNT', 'BLT Desa', dll
    periode_tahun = Column(Integer, nullable=False)   # Contoh: 2026
    status_penerima = Column(String(20), default="aktif") # 'aktif', 'graduasi', 'penangguhan'
    rt = Column(String(10), nullable=False)
    rw = Column(String(10), nullable=False)
    dusun = Column(String(50), nullable=True)


# 4. Tabel Wilayah Ngrowo (Master Data RT/RW)
class WilayahNgrowo(Base):
    __tablename__ = "wilayah_ngrowo"

    id_wilayah = Column(Integer, primary_key=True, index=True)
    dusun = Column(String(50), nullable=False)
    rt = Column(String(10), nullable=False)
    rw = Column(String(10), nullable=False)
    nama_ketua_rt = Column(String(100), nullable=True)


# 5. Tabel Audit Log (Log Aktivitas Admin/Sistem)
class AuditLog(Base):
    __tablename__ = "audit_log"

    id_log = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, nullable=True)
    aktivitas = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)