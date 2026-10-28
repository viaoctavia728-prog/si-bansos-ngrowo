import secrets
import time

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User
from app.models.bansos import DataBansos
from app.models.eligible_resident import EligibleResident
import app.models  # noqa: F401 - load models before create_all


def create_tables(max_retries: int = 30, delay_seconds: int = 2):
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            ensure_username_column()
            ensure_user_status_columns()
            ensure_notification_preference_column()
            ensure_desil_columns()
            seed_default_admin()
            seed_demo_warga()
            activate_eligible_citizens()
            seed_missing_usernames()
            seed_demo_desil_and_bansos()
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


def ensure_notification_preference_column():
    columns = {column["name"] for column in inspect(engine).get_columns("users")}
    if "notifikasi_otomatis" not in columns:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE users ADD COLUMN notifikasi_otomatis BOOLEAN NOT NULL DEFAULT TRUE"))


def ensure_desil_columns():
    for table in ("eligible_residents", "data_bansos"):
        columns = {column["name"] for column in inspect(engine).get_columns(table)}
        if "desil" not in columns:
            with engine.begin() as connection:
                connection.execute(text(f"ALTER TABLE {table} ADD COLUMN desil INTEGER NOT NULL DEFAULT 4"))


def seed_demo_desil_and_bansos():
    db: Session = SessionLocal()
    try:
        residents = db.query(EligibleResident).order_by(EligibleResident.id).all()
        if not residents:
            return

        for index, resident in enumerate(residents):
            resident.desil = (index % 10) + 1

        existing_niks = {row.nik_penerima for row in db.query(DataBansos.nik_penerima).all()}
        demo_recipients = residents[:20]
        for index, resident in enumerate(demo_recipients):
            if resident.nik in existing_niks:
                continue
            db.add(
                DataBansos(
                    nik_penerima=resident.nik,
                    nama_penerima=resident.nama_lengkap,
                    no_kk=None,
                    jenis_bansos="Bansos Beras CPP",
                    periode_tahun=2026,
                    status_penerima="aktif",
                    rt=f"{(index % 5) + 1:03d}",
                    rw=f"{(index % 5) + 1:03d}",
                    dusun="Desa Ngrowo",
                    desil=resident.desil,
                )
            )
        db.commit()
    finally:
        db.close()


def seed_default_admin():
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
            password_hash=hash_password("admin"),
            role="admin",
        )
        db.add(default_admin)
        db.commit()
    finally:
        db.close()


def seed_demo_warga():
    db: Session = SessionLocal()
    try:
        demo_warga = db.query(User).filter(User.nik == "3524000000000001").first()
        if demo_warga:
            changed = False
            if not demo_warga.username and not db.query(User).filter(User.username == "wargademo").first():
                demo_warga.username = "wargademo"
                changed = True
            if not demo_warga.is_ngrowo_resident or not demo_warga.is_verified:
                demo_warga.is_ngrowo_resident = True
                demo_warga.is_verified = True
                changed = True
            if changed:
                db.commit()
            return

        if db.query(User).filter(User.username == "wargademo").first():
            return

        db.add(
            User(
                nik="3524000000000001",
                username="wargademo",
                nama_lengkap="Warga Demo",
                no_kk="3524000000000000",
                no_hp="000000000000",
                password_hash=hash_password("admin123"),
                rt="001",
                rw="001",
                role="user",
                is_ngrowo_resident=True,
                is_verified=True,
            )
        )
        db.commit()
    finally:
        db.close()


def activate_eligible_citizens():
    db: Session = SessionLocal()
    try:
        users = (
            db.query(User)
            .join(EligibleResident, EligibleResident.nik == User.nik)
            .filter(User.role.in_(["user", "warga"]))
            .all()
        )
        changed = False
        for user in users:
            if not user.is_ngrowo_resident or not user.is_verified:
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
