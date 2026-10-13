from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.house_validation import HouseConditionAssessment


class GeminiNotConfiguredError(Exception):
    pass


class GeminiAssessmentError(Exception):
    pass


def extract_response_text(response) -> str | None:
    if response is None:
        return None

    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return text.strip()

    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            part_text = getattr(part, "text", None)
            if isinstance(part_text, str) and part_text.strip():
                return part_text.strip()

    return None


ASSESSMENT_PROMPT = """Nilai hanya kondisi fisik rumah yang benar-benar terlihat pada foto untuk membantu petugas melakukan pemeriksaan awal.
Jangan menyimpulkan pendapatan, identitas atau jumlah penghuni, kepemilikan aset, kelayakan bansos, maupun Desil dari foto.
Jika foto tidak cukup jelas atau tidak menampilkan rumah, gunakan condition_level 'tidak_dapat_dinilai' dan confidence rendah.
Jangan mengidentifikasi orang dalam foto. Sebutkan indikator visual secara faktual dan ringkas.
Balas sebagai JSON dengan field: condition_level (baik/sedang/kurang/tidak_dapat_dinilai), confidence (angka 0 sampai 1), visible_indicators (array string), explanation (string), limitations (array string), manual_review_required (true)."""


def assess_house_photo(image_bytes: bytes, mime_type: str) -> HouseConditionAssessment:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise GeminiNotConfiguredError

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=[
                ASSESSMENT_PROMPT,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
        response_text = extract_response_text(response)
    except Exception as exc:
        raise GeminiAssessmentError from exc

    if not response_text:
        raise GeminiAssessmentError
    try:
        assessment = HouseConditionAssessment.model_validate_json(response_text)
    except ValidationError as exc:
        raise GeminiAssessmentError from exc
    return assessment