import secrets
import time

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.user import User
import app.models  # noqa: F401 - load models before create_all


def create_tables(max_retries: int = 30, delay_seconds: int = 2):
    for attempt in range(1, max_retries + 1):
        try:
            Base.metadata.create_all(bind=engine)
            ensure_username_column()
            seed_default_admin()
            seed_demo_warga()
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
            if not demo_warga.username and not db.query(User).filter(User.username == "wargademo").first():
                demo_warga.username = "wargademo"
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
            )
        )
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

