from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer

from app.db.base import Base


class NotificationRead(Base):
    __tablename__ = "notification_reads"

    id_notification = Column(
        Integer,
        ForeignKey("notification_history.id_notification", ondelete="CASCADE"),
        primary_key=True,
    )
    id_user = Column(
        Integer,
        ForeignKey("users.id_user", ondelete="CASCADE"),
        primary_key=True,
    )
    read_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    dismissed_at = Column(DateTime, nullable=True)
