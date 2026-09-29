from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class WilayahNgrowo(Base):
    __tablename__ = "wilayah_ngrowo"

    id_wilayah = Column(Integer, primary_key=True, index=True)
    dusun = Column(String(50), nullable=False)
    rt = Column(String(10), nullable=False)
    rw = Column(String(10), nullable=False)
    nama_ketua_rt = Column(String(100), nullable=True)

    users = relationship("User", back_populates="wilayah")
