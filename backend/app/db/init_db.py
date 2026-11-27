import secrets
import time

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User
from app.models.eligible_resident import EligibleResident
import app.models  # noqa: F401 - load models before create_all


def create_tables(max_retries: int = 30, delay_seconds: int = 2):
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            ensure_username_column()
            ensure_user_status_columns()
            ensure_resident_active_columns()
            ensure_eligible_resident_location_columns()
            ensure_notification_preference_column()
            ensure_notification_archive_column()
            ensure_notification_dismissal_column()
            ensure_desil_columns()
            ensure_bansos_period_column()
            drop_dusun_columns()
            seed_default_admin()
            activate_eligible_citizens()
            seed_missing_usernames()
            return
        except Exception:
            if attempt == max_retries:
                raise
            time.sleep(delay_seconds)


def ensure_username_column():
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "username" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL"))

    inspector = inspect(engine)
    username_index_exists = any(
        index.get("unique") and index.get("column_names") == ["username"]
        for index in inspector.get_indexes("users")
    )
    if not username_index_exists:
        with engine.begin() as connection:
            connection.execute(text("CREATE UNIQUE INDEX uq_users_username ON users (username)"))

    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "foto_profil" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN foto_profil VARCHAR(255) NULL"))


def ensure_user_status_columns():
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    missing_columns = {
        "is_ngrowo_resident": "BOOLEAN NOT NULL DEFAULT FALSE",
        "is_verified": "BOOLEAN NOT NULL DEFAULT FALSE",
    }
    with engine.begin() as connection:
        for column, definition in missing_columns.items():
            if column not in columns:
                connection.execute(text(f"ALTER TABLE users ADD COLUMN {column} {definition}"))


def ensure_resident_active_columns():
    for table in ("users", "eligible_residents", "data_bansos"):
        columns = {column["name"] for column in inspect(engine).get_columns(table)}
        if "is_active" not in columns:
            with engine.begin() as connection:
                connection.execute(
                    text(f"ALTER TABLE {table} ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE")
                )


def ensure_eligible_resident_location_columns():
    columns = {column["name"] for column in inspect(engine).get_columns("eligible_residents")}
    with engine.begin() as connection:
        for column in ("rt", "rw"):
            if column not in columns:
                connection.execute(text(f"ALTER TABLE eligible_residents ADD COLUMN {column} VARCHAR(10) NULL"))


def ensure_notification_preference_column():
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    if "notifikasi_otomatis" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN notifikasi_otomatis BOOLEAN NOT NULL DEFAULT TRUE"))


def ensure_notification_archive_column():
    columns = {column["name"] for column in inspect(engine).get_columns("notification_history")}
    if "is_archived" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE notification_history ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT FALSE")
            )


def ensure_notification_dismissal_column():
    columns = {column["name"] for column in inspect(engine).get_columns("notification_reads")}
    if "dismissed_at" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE notification_reads ADD COLUMN dismissed_at DATETIME NULL"))


def ensure_desil_columns():
    for table in ("eligible_residents", "data_bansos"):
        columns = {column["name"] for column in inspect(engine).get_columns(table)}
        if "desil" not in columns:
            with engine.begin() as connection:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN desil INTEGER NOT NULL DEFAULT 4"))


def ensure_bansos_period_column():
    columns = {column["name"] for column in inspect(engine).get_columns("data_bansos")}
    if "periode_bulan" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE data_bansos ADD COLUMN periode_bulan INTEGER NULL"))


def drop_dusun_columns():
    """Hapus kolom dusun yang sudah tidak dipakai sistem."""
    for table in ("wilayah_ngrowo", "data_bansos"):
        try:
            columns = {column["name"] for column in inspect(engine).get_columns(table)}
        except Exception:
            continue
        if "dusun" in columns:
            with engine.begin() as connection:
                connection.execute(text(f"ALTER TABLE {table} DROP COLUMN dusun"))


def seed_default_admin():
    initial_password = get_settings().admin_initial_password.strip()
    if not initial_password:
        return
    db: Session = SessionLocal()
    try:
        admin = db.query(User).filter(User.nik == "admin").first()
        if admin:
            if not admin.username and not db.query(User).filter(User.username == "admin").first():
                admin.username = "admin"
                db.commit()
            return

        default_admin = User(
            nik="admin",
            username="admin",
            nama_lengkap="Administrator",
            no_kk="0000000000000000",
            no_hp="000000000000",
            rt="00",
            rw="00",
            password_hash=hash_password(initial_password),
            role="admin",
        )
        db.add(default_admin)
        db.commit()
    finally:
        db.close()


def activate_eligible_citizens():
    db: Session = SessionLocal()
    try:
        changed = False
        resident_accounts = (
            db.query(User, EligibleResident)
            .join(EligibleResident, EligibleResident.nik == User.nik)
            .filter(User.role.in_(["user", "warga"]))
            .all()
        )
        for user, resident in resident_accounts:
            if resident.registered_user_id != user.id_user:
                resident.registered_user_id = user.id_user
                changed = True
            if user.is_active and resident.is_active and (
                not user.is_ngrowo_resident or not user.is_verified
            ):
                user.is_ngrowo_resident = True
                user.is_verified = True
                changed = True
        if changed:
            db.commit()
    finally:
        db.close()


def seed_missing_usernames():
    db: Session = SessionLocal()
    try:
        users = db.query(User).filter(User.username.is_(None)).all()
        for user in users:
            prefix = "admin" if user.role == "admin" else "warga"
            while True:
                username = f"{prefix}_{secrets.token_hex(4)}"
                if not db.query(User).filter(User.username == username).first():
                    user.username = username
                    break
        db.commit()
    finally:
        db.close()
