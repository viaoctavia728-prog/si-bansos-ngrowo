from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Integer, JSON, String

from app.db.base import Base


class JadwalBansos(Base):
    __tablename__ = "jadwal_bansos"

    id = Column(Integer, primary_key=True, index=True)
    program = Column(String(120), nullable=False)
    tanggal = Column(String(40), nullable=False)
    iso_date = Column(String(10), nullable=False)
    jam = Column(String(60), nullable=False)
    lokasi = Column(String(180), nullable=False)
    status = Column(String(30), nullable=False, default="Dijadwalkan")
    persyaratan = Column(JSON, nullable=False, default=list)
    is_archived = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
