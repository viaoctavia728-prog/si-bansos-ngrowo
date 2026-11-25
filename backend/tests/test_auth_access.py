import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.deps import get_current_user
from app.core.security import create_access_token
from app.db.base import Base
from app.models import User


def create_test_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine)()


def test_legacy_token_prefix_does_not_grant_admin_access():
    db = create_test_session()
    try:
        with pytest.raises(HTTPException) as error:
            get_current_user("token-admin-forged", db)

        assert error.value.status_code == 401
    finally:
        db.close()


def test_inactive_user_token_is_rejected():
    db = create_test_session()
    try:
        user = User(
            nik="3524000000000006",
            nama_lengkap="Warga Nonaktif",
            password_hash="test",
            role="user",
            is_active=False,
        )
        db.add(user)
        db.commit()
        token = create_access_token({"id_user": user.id_user, "role": user.role})

        with pytest.raises(HTTPException) as error:
            get_current_user(token, db)

        assert error.value.status_code == 401
    finally:
        db.close()
