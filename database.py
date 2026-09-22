import pymysql
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Konfigurasi PyMySQL (Koneksi Manual)
def get_db_connection():
    connection = pymysql.connect(
        host="localhost",
        user="root",
        password="",  # XAMPP default password kosong
        database="db_sibansos_ngrowo",
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection

# 2. Konfigurasi SQLAlchemy (ORM untuk Register, Login, Models)
DATABASE_URL = "mysql+pymysql://root:@localhost/db_sibansos_ngrowo"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency untuk mendapatkan session DB di FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()