from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String

from app.db.base import Base


class FcmDeviceToken(Base):
    __tablename__ = "fcm_device_tokens"

    id_token = Column(Integer, primary_key=True, index=True)
    id_user = Column(Integer, ForeignKey("users.id_user", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(512), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)