import base64
import binascii
import random
import string
from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.storage import MAX_UPLOAD_BYTES, UPLOAD_DIR
from app.db.session import get_db
from app.models.pengaduan import PengaduanBansos
from app.models.user import User
from app.schemas.pengaduan import BuktiFotoUpload, PengaduanCreate, PengaduanResponse

router = APIRouter()
IMAGE_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def generate_nomor_tiket():
    tanggal = datetime.now().strftime("%Y%m%d")
    acak = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
    return f"ADU-{tanggal}-{acak}"


def _response_pengaduan(pengaduan: PengaduanBansos):
    response = PengaduanResponse.model_validate(pengaduan)
    if response.is_anonymous:
        response.id_user = None
    return response


@router.post("/upload-bukti")
def upload_bukti_foto(data: BuktiFotoUpload, _current_user: dict = Depends(get_current_user)):
    extension = IMAGE_EXTENSIONS.get(data.content_type)
    if not extension:
        raise HTTPException(status_code=400, detail="Format foto harus JPG, PNG, atau WEBP.")

    try:
        contents = base64.b64decode(data.content_base64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail="Data foto tidak valid.") from exc

    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Ukuran foto maksimal 2 MB.")
    if not contents:
        raise HTTPException(status_code=400, detail="File foto tidak boleh kosong.")
    if data.content_type == "image/jpeg" and not contents.startswith(b"\xff\xd8\xff"):
        raise HTTPException(status_code=400, detail="Isi file bukan foto JPG yang valid.")
    if data.content_type == "image/png" and not contents.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(status_code=400, detail="Isi file bukan foto PNG yang valid.")
    if data.content_type == "image/webp" and (contents[:4] != b"RIFF" or contents[8:12] != b"WEBP"):
        raise HTTPException(status_code=400, detail="Isi file bukan foto WEBP yang valid.")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(contents)
    return {"bukti_foto": f"/uploads/{filename}"}


@router.post("", response_model=PengaduanResponse, status_code=201)
def buat_pengaduan(
    pengaduan_data: PengaduanCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user.get("id_user")
    if not isinstance(user_id, int):
        raise HTTPException(status_code=401, detail="Token tidak memiliki identitas pengguna yang valid.")
    if pengaduan_data.id_user is not None and pengaduan_data.id_user != user_id:
        raise HTTPException(status_code=403, detail="Pengaduan hanya dapat dibuat untuk akun sendiri.")

    user = db.query(User).filter(User.id_user == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan!")

    tiket = generate_nomor_tiket()

    new_pengaduan = PengaduanBansos(
        nomor_tiket=tiket,
        id_user=user_id,
        nik_terlapor=pengaduan_data.nik_terlapor,
        kategori_aduan=pengaduan_data.kategori_aduan,
        program_terkait=pengaduan_data.program_terkait or "Umum",
        deskripsi_kejadian=pengaduan_data.deskripsi_kejadian,
        lokasi_spesifik=pengaduan_data.lokasi_spesifik,
        bukti_foto=pengaduan_data.bukti_foto,
        is_anonymous=pengaduan_data.is_anonymous,
        status_laporan="pending",
    )
    db.add(new_pengaduan)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Pengaduan gagal disimpan karena konflik data. Silakan coba lagi.") from exc
    db.refresh(new_pengaduan)
    return _response_pengaduan(new_pengaduan)


@router.get("/tracking/{nomor_tiket}", response_model=PengaduanResponse)
def tracking_pengaduan(nomor_tiket: str, db: Session = Depends(get_db)):
    pengaduan = db.query(PengaduanBansos).filter(PengaduanBansos.nomor_tiket == nomor_tiket).first()
    if not pengaduan:
        raise HTTPException(status_code=404, detail="Nomor Tiket tidak ditemukan!")
    return _response_pengaduan(pengaduan)


@router.get("/user/{id_user}", response_model=list[PengaduanResponse])
def get_pengaduan_by_user(
    id_user: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if id_user != current_user.get("id_user"):
        raise HTTPException(status_code=403, detail="Pengaduan hanya dapat dilihat oleh pemilik akun.")
    pengaduan = db.query(PengaduanBansos).filter(PengaduanBansos.id_user == id_user).all()
    return [_response_pengaduan(item) for item in pengaduan]
