from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String

from app.db.base import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id_log = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, nullable=True)
    aktivitas = Column(String(255), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
