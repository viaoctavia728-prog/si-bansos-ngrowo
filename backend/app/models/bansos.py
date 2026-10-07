from sqlalchemy import Column, Integer, String

from app.db.base import Base


class DataBansos(Base):
    __tablename__ = "data_bansos"

    id_bansos = Column(Integer, primary_key=True, index=True)
    nik_penerima = Column(String(16), index=True, nullable=False)
    nama_penerima = Column(String(100), nullable=False)
    no_kk = Column(String(16), nullable=True)
    jenis_bansos = Column(String(50), nullable=False)
    periode_tahun = Column(Integer, nullable=False)
    status_penerima = Column(String(20), default="aktif")
    rt = Column(String(10), nullable=False)
    rw = Column(String(10), nullable=False)
    dusun = Column(String(50), nullable=True)
