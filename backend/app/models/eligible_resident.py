from sqlalchemy import Column, ForeignKey, Integer, String

from app.db.base import Base


class EligibleResident(Base):
    __tablename__ = "eligible_residents"

    id = Column(Integer, primary_key=True, index=True)
    nik = Column(String(16), unique=True, index=True, nullable=False)
    nama_lengkap = Column(String(100), nullable=False)
    nama_normalized = Column(String(100), nullable=False)
    registered_user_id = Column(Integer, ForeignKey("users.id_user"), nullable=True)