from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401 - load models before create_all


def create_tables():
    Base.metadata.create_all(bind=engine)

