from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.wilayah import WilayahNgrowo
from app.schemas.wilayah import WilayahResponse

router = APIRouter()


@router.get("", response_model=list[WilayahResponse])
def get_wilayah(db: Session = Depends(get_db)):
    return db.query(WilayahNgrowo).all()
