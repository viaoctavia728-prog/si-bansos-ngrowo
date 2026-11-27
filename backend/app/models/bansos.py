from sqlalchemy import Boolean, Column, Integer, String

from app.db.base import Base


class DataBansos(Base):
    __tablename__ = "data_bansos"

    id_bansos = Column(Integer, primary_key=True, index=True)
    nik_penerima = Column(String(16), index=True, nullable=False)
    nama_penerima = Column(String(100), nullable=False)
    no_kk = Column(String(16), nullable=True)
    jenis_bansos = Column(String(50), nullable=False)
    periode_tahun = Column(Integer, nullable=False)
    periode_bulan = Column(Integer, nullable=True)
    status_penerima = Column(String(20), default="aktif")
    rt = Column(String(10), nullable=False)
    rw = Column(String(10), nullable=False)
    desil = Column(Integer, nullable=False, default=4)
    is_active = Column(Boolean, nullable=False, default=True)
