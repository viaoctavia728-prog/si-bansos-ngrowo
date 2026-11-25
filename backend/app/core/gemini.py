from google import genai
from google.genai import types
from pydantic import ValidationError
import logging
import time

from app.core.config import get_settings
from app.schemas.house_validation import HouseConditionAssessment


FALLBACK_MODELS = ("gemini-3.5-flash", "gemini-3-flash-preview")


class GeminiNotConfiguredError(Exception):
    pass


class GeminiAssessmentError(Exception):
    def __init__(self, message: str = "Gemini gagal menilai foto"):
        super().__init__(message)


ASSESSMENT_PROMPT = """PERAN DAN KONTEKS
Anda adalah asisten AI untuk membantu petugas Desa Ngrowo melakukan penyaringan awal
kondisi fisik rumah dalam proses verifikasi bantuan sosial. Hasil Anda bukan keputusan
kelayakan bantuan dan wajib diverifikasi secara manual oleh petugas.

TUGAS
Analisis hanya kondisi fisik yang terlihat pada foto, terutama:
1. Atap
2. Dinding
3. Lantai
4. Struktur bangunan yang tampak

Jangan membuat kesimpulan berdasarkan hal yang tidak terlihat pada foto.
Jika foto menampilkan rumah dengan cukup jelas, tentukan kondisi umum:
- "baik": bagian bangunan yang terlihat tampak kokoh dan terawat
- "sedang": terdapat kerusakan atau kekurangan ringan
- "kurang": terlihat kerusakan berat atau bagian bangunan non-permanen
- "tidak_dapat_dinilai": foto buram, terlalu gelap, bukan rumah, atau tidak cukup jelas

BATASAN DAN KEAMANAN
- Jangan mengidentifikasi wajah, nama, NIK, atau identitas siapa pun.
- Jangan menilai jumlah penghuni, aset, pendapatan, atau status ekonomi.
- Jangan menyatakan seseorang pasti layak atau tidak layak menerima bantuan.
- Jangan mengarang kondisi bagian rumah yang tidak terlihat.
- Jika ragu, gunakan "tidak_dapat_dinilai" dan jelaskan keterbatasannya.

FORMAT DAN GAYA JAWABAN
Balas hanya JSON valid tanpa markdown, pengantar, atau komentar.
Gunakan keys persis seperti contoh berikut:
{
  "condition_level": "baik | sedang | kurang | tidak_dapat_dinilai",
  "confidence": 0.0,
  "visible_indicators": ["maksimal 5 indikator yang terlihat"],
  "explanation": "penjelasan faktual maksimal 200 karakter",
  "limitations": ["maksimal 3 keterbatasan"],
  "manual_review_required": true
}

Aturan format:
- confidence harus berupa angka antara 0.0 dan 1.0.
- visible_indicators dan limitations harus berupa array string.
- Setiap indikator dan keterbatasan maksimal 60 karakter.
- explanation harus faktual, netral, singkat, dan tidak menghakimi.
- manual_review_required wajib selalu true.
- Gunakan Bahasa Indonesia.

CONTOH
Foto rumah dengan dinding bambu rapuh, lantai tanah, dan atap berkarat:
{"condition_level":"kurang","confidence":0.88,"visible_indicators":["Dinding bambu tampak rapuh","Lantai tanah belum diplester","Atap seng terlihat berkarat"],"explanation":"Bangunan tampak kurang layak berdasarkan kondisi dinding, lantai, dan atap yang terlihat.","limitations":["Interior rumah tidak terlihat"],"manual_review_required":true}

Foto rumah dengan dinding bata, genteng bergeser, dan kusen kusam:
{"condition_level":"sedang","confidence":0.78,"visible_indicators":["Dinding bata sebagian diplester","Beberapa genteng tampak bergeser","Kusen kayu terlihat kusam"],"explanation":"Rumah tampak cukup layak, tetapi terdapat beberapa kerusakan ringan yang terlihat.","limitations":["Fondasi dan bagian belakang tidak terlihat"],"manual_review_required":true}

Foto rumah dengan kondisi fisik yang tidak jelas:
{"condition_level":"tidak_dapat_dinilai","confidence":0.15,"visible_indicators":[],"explanation":"Foto tidak menampilkan rumah dengan jelas sehingga kondisi fisiknya tidak dapat dinilai.","limitations":["Foto terlalu gelap atau buram"],"manual_review_required":true}"""


def _clean_json_text(text: str | None) -> str | None:
    if not text:
        return None
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(lines[1:-1] if lines and lines[-1].strip() == "```" else lines[1:]).strip()
    return text


def extract_response_text(response) -> str | None:
    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return _clean_json_text(text)

    for candidate in getattr(response, "candidates", None) or []:
        content = getattr(candidate, "content", None)
        for part in getattr(content, "parts", None) or []:
            part_text = getattr(part, "text", None)
            if isinstance(part_text, str) and part_text.strip():
                return _clean_json_text(part_text)
    return None


def assess_house_photo(image_bytes: bytes, mime_type: str) -> HouseConditionAssessment:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise GeminiNotConfiguredError

    try:
        client = genai.Client(api_key=settings.gemini_api_key)
        response = None
        last_error = None
        models = tuple(dict.fromkeys((settings.gemini_model, *FALLBACK_MODELS)))
        for model in models:
            for attempt in range(2):
                try:
                    response = client.models.generate_content(
                        model=model,
                        contents=[ASSESSMENT_PROMPT, types.Part.from_bytes(data=image_bytes, mime_type=mime_type)],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            max_output_tokens=1500,
                            temperature=0.2,
                        ),
                    )
                    break
                except Exception as exc:
                    last_error = exc
                    status_code = getattr(exc, "status_code", None)
                    if status_code == 503 and attempt == 0:
                        time.sleep(1.5)
                        continue
                    break
            if response is not None:
                break
        if response is None and last_error is not None:
            raise last_error
        response_text = extract_response_text(response)
        if not response_text:
            raise GeminiAssessmentError
        return HouseConditionAssessment.model_validate_json(response_text)
    except GeminiAssessmentError:
        raise
    except ValidationError as exc:
        logging.getLogger(__name__).warning("Gemini returned invalid assessment JSON: %s", exc)
        raise GeminiAssessmentError("Gemini mengirim hasil JSON yang tidak lengkap. Silakan coba lagi.") from exc
    except Exception as exc:
        logging.getLogger(__name__).exception("Gemini house assessment failed")
        raise GeminiAssessmentError(str(exc)) from exc
