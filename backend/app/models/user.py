from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(Base):
    __tablename__ = "users"

    id_user = Column(Integer, primary_key=True, index=True)
    nik = Column(String(16), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=True)
    nama_lengkap = Column(String(100), nullable=False)
    no_kk = Column(String(16), nullable=True)
    no_hp = Column(String(15), nullable=True)

    rt = Column(String(10), nullable=True)
    rw = Column(String(10), nullable=True)
    alamat_detail = Column(String(255), nullable=True)  # <--- Penampung Alamat Lengkap
    foto_profil = Column(String(255), nullable=True)
    id_wilayah = Column(Integer, ForeignKey("wilayah_ngrowo.id_wilayah"), nullable=True)

    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="warga")  # <--- Default role diset 'warga'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi ke tabel Pengaduan & Wilayah
    pengaduan = relationship("PengaduanBansos", back_populates="pelapor")
    wilayah = relationship("WilayahNgrowo", back_populates="users")