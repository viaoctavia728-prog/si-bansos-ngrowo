from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


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
