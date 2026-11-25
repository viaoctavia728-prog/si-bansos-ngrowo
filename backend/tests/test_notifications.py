import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.routes.notifications import (
    archive_notification,
    dismiss_notification,
    get_notifications,
    mark_notification_read,
)
from app.db.base import Base
from app.models import AuditLog, NotificationHistory, User


def create_test_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


def create_user(db, nik, role="user"):
    user = User(
        nik=nik,
        nama_lengkap=f"User {nik}",
        password_hash="test",
        role=role,
    )
    db.add(user)
    db.flush()
    return user


def test_reading_global_notification_is_per_user():
    db = create_test_session()
    try:
        reader = create_user(db, "3524000000000001")
        other_user = create_user(db, "3524000000000002")
        notification = NotificationHistory(title="Jadwal", body="Informasi jadwal desa")
        db.add(notification)
        db.commit()

        mark_notification_read(notification.id_notification, current_user={"id_user": reader.id_user}, db=db)

        reader_result = get_notifications(current_user={"id_user": reader.id_user}, db=db)
        other_result = get_notifications(current_user={"id_user": other_user.id_user}, db=db)

        assert reader_result[0]["is_read"] is True
        assert other_result[0]["is_read"] is False
    finally:
        db.close()


def test_archiving_hides_notification_from_residents_and_keeps_audit_trail():
    db = create_test_session()
    try:
        admin = create_user(db, "admin000000000001", role="admin")
        resident = create_user(db, "3524000000000003")
        notification = NotificationHistory(title="Pengumuman", body="Isi pengumuman")
        db.add(notification)
        db.commit()

        archive_notification(notification.id_notification, db, {"id_user": admin.id_user})

        assert get_notifications(current_user={"id_user": resident.id_user}, db=db) == []
        assert db.query(NotificationHistory).filter_by(id_notification=notification.id_notification).one().is_archived
        assert db.query(AuditLog).one().aktivitas == "Mengarsipkan pengumuman: Pengumuman"
    finally:
        db.close()


def test_dismissing_global_notification_hides_it_only_for_that_user():
    db = create_test_session()
    try:
        resident = create_user(db, "3524000000000004")
        other_resident = create_user(db, "3524000000000005")
        notification = NotificationHistory(title="Jadwal", body="Informasi jadwal desa")
        db.add(notification)
        db.commit()

        dismiss_notification(
            notification.id_notification,
            current_user={"id_user": resident.id_user},
            db=db,
        )

        assert get_notifications(current_user={"id_user": resident.id_user}, db=db) == []
        assert len(get_notifications(current_user={"id_user": other_resident.id_user}, db=db)) == 1
    finally:
        db.close()


def test_resident_cannot_dismiss_notification_targeted_to_another_user():
    db = create_test_session()
    try:
        owner = create_user(db, "3524000000000006")
        other_resident = create_user(db, "3524000000000007")
        notification = NotificationHistory(
            id_user=owner.id_user,
            title="Info pribadi",
            body="Informasi untuk pemilik akun",
        )
        db.add(notification)
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            dismiss_notification(
                notification.id_notification,
                current_user={"id_user": other_resident.id_user},
                db=db,
            )

        assert exc_info.value.status_code == 404
        assert get_notifications(current_user={"id_user": owner.id_user}, db=db)
    finally:
        db.close()
