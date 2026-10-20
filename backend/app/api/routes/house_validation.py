from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import get_current_admin
from app.core.gemini import (
    GeminiAssessmentError,
    GeminiNotConfiguredError,
    assess_house_photo,
)
from app.core.storage import MAX_HOUSE_IMAGE_BYTES
from app.schemas.house_validation import HouseConditionAssessment

router = APIRouter()
IMAGE_SIGNATURES = {
    "image/jpeg": lambda data: data.startswith(b"\xff\xd8\xff"),
    "image/png": lambda data: data.startswith(b"\x89PNG\r\n\x1a\n"),
    "image/webp": lambda data: data[:4] == b"RIFF" and data[8:12] == b"WEBP",
}


@router.post("/validate-house", response_model=HouseConditionAssessment)
def validate_house(
    file: UploadFile = File(...),
    _current_admin: dict = Depends(get_current_admin),
):
    mime_type = (file.content_type or "").lower()
    signature_check = IMAGE_SIGNATURES.get(mime_type)
    if signature_check is None:
        raise HTTPException(status_code=400, detail="Foto harus berformat JPG, PNG, atau WEBP.")

    contents = file.file.read(MAX_HOUSE_IMAGE_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="File foto rumah tidak boleh kosong.")
    if len(contents) > MAX_HOUSE_IMAGE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Ukuran file foto rumah melebihi batas 2 MB. Harap unggah foto maksimal 2 MB agar sistem tidak berat saat diproses.",
        )
    if not signature_check(contents):
        raise HTTPException(status_code=400, detail="Isi file tidak sesuai dengan format foto.")

    try:
        return assess_house_photo(contents, mime_type)
    except GeminiNotConfiguredError as exc:
        raise HTTPException(status_code=503, detail="Layanan Gemini belum dikonfigurasi.") from exc
    except GeminiAssessmentError as exc:
        raise HTTPException(status_code=502, detail="Gemini gagal menilai foto. Silakan coba lagi.") from exc