from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class EligibleResident(Base):
    __tablename__ = "eligible_residents"

    id = Column(Integer, primary_key=True, index=True)
    nik = Column(String(16), unique=True, index=True, nullable=False)
    nama_lengkap = Column(String(100), nullable=False)
    nama_normalized = Column(String(100), nullable=False)
    rt = Column(String(10), nullable=True)
    rw = Column(String(10), nullable=True)
    registered_user_id = Column(Integer, ForeignKey("users.id_user"), nullable=True)
    desil = Column(Integer, nullable=False, default=4)
    is_active = Column(Boolean, nullable=False, default=True)

    registered_user = relationship(
        "User",
        back_populates="eligible_resident",
        foreign_keys=[registered_user_id],
    )
