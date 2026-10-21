from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.house_validation import HouseConditionAssessment


class GeminiNotConfiguredError(Exception):
    pass


class GeminiAssessmentError(Exception):
    pass


ASSESSMENT_PROMPT = """Anda adalah asisten AI penilai kondisi fisik bangunan untuk SI-BANSOS Desa Ngrowo.
Nilai hanya kondisi fisik yang tampak pada foto: atap, dinding, lantai, dan struktur bangunan.
Ini adalah penyaringan awal untuk petugas, bukan keputusan kelayakan bansos.
Jangan mengidentifikasi wajah, identitas, jumlah penghuni, aset, atau status ekonomi.
Jika foto kabur, gelap, atau bukan rumah, gunakan condition_level 'tidak_dapat_dinilai'.
Gunakan Bahasa Indonesia yang faktual, netral, dan ringkas.

FORMAT DAN STRUKTUR OUTPUT WAJIB:
- Balas hanya JSON valid, tanpa markdown, pengantar, atau komentar.
- Gunakan keys persis: condition_level, confidence, visible_indicators, explanation,
  limitations, manual_review_required.
- condition_level wajib salah satu dari: baik, sedang, kurang, tidak_dapat_dinilai.
- confidence berupa angka 0.0 sampai 1.0.
- visible_indicators berupa array maksimal 5 string, setiap string maksimal 60 karakter.
- explanation berupa string maksimal 200 karakter.
- limitations berupa array maksimal 3 string, setiap string maksimal 60 karakter.
- manual_review_required wajib boolean true karena hasil AI harus diverifikasi petugas.

CONTOH OUTPUT:
1. Rumah tampak kurang layak:
{"condition_level":"kurang","confidence":0.88,"visible_indicators":["Dinding bambu tampak rapuh","Lantai tanah belum diplester","Atap seng terlihat berkarat"],"explanation":"Bangunan tampak non-permanen dengan kerusakan yang terlihat pada dinding, lantai, dan atap.","limitations":["Interior rumah tidak terlihat"],"manual_review_required":true}

2. Rumah tampak dalam kondisi sedang:
{"condition_level":"sedang","confidence":0.78,"visible_indicators":["Dinding bata sebagian diplester","Beberapa genteng tampak bergeser","Kusen kayu terlihat kusam"],"explanation":"Rumah tampak cukup layak secara fisik, tetapi terdapat beberapa kerusakan ringan yang terlihat.","limitations":["Fondasi dan bagian belakang tidak terlihat"],"manual_review_required":true}

3. Rumah tampak baik:
{"condition_level":"baik","confidence":0.91,"visible_indicators":["Dinding permanen tampak kokoh","Atap terlihat utuh","Lantai teras sudah berkeramik"],"explanation":"Bangunan tampak permanen dan terawat berdasarkan bagian luar yang terlihat pada foto.","limitations":["Kondisi interior tidak dapat dinilai"],"manual_review_required":true}

4. Foto tidak dapat dinilai:
{"condition_level":"tidak_dapat_dinilai","confidence":0.15,"visible_indicators":[],"explanation":"Foto tidak menampilkan rumah dengan jelas atau kualitas gambar tidak cukup untuk penilaian.","limitations":["Foto terlalu gelap atau buram"],"manual_review_required":true}"""


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
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=[ASSESSMENT_PROMPT, types.Part.from_bytes(data=image_bytes, mime_type=mime_type)],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=500,
                temperature=0.2,
            ),
        )
        response_text = extract_response_text(response)
        if not response_text:
            raise GeminiAssessmentError
        return HouseConditionAssessment.model_validate_json(response_text)
    except (GeminiAssessmentError, ValidationError):
        raise
    except Exception as exc:
        raise GeminiAssessmentError from exc
