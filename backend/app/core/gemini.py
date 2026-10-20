from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.house_validation import HouseConditionAssessment


class GeminiNotConfiguredError(Exception):
    pass


class GeminiAssessmentError(Exception):
    pass


def _clean_json_text(text: str | None) -> str | None:
    if not text:
        return None
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def extract_response_text(response) -> str | None:
    if response is None:
        return None

    text = getattr(response, "text", None)
    if isinstance(text, str) and text.strip():
        return _clean_json_text(text)

    candidates = getattr(response, "candidates", None) or []
    for candidate in candidates:
        content = getattr(candidate, "content", None)
        parts = getattr(content, "parts", None) or []
        for part in parts:
            part_text = getattr(part, "text", None)
            if isinstance(part_text, str) and part_text.strip():
                return _clean_json_text(part_text)

    return None


ASSESSMENT_PROMPT = """Anda adalah asisten AI penilai kondisi fisik bangunan untuk Sistem Informasi Bantuan Sosial (SI-BANSOS) Desa Ngrowo.
Tugas Anda adalah memprediksi dan menilai kondisi fisik rumah warga calon penerima bantuan sosial secara objektif berdasarkan foto dokumentasi lapangan yang masuk (komponen atap, dinding, lantai, dan kelayakan fisik bangunan).

KONTEKS DAN TUJUAN:
Penilaian visual ini digunakan oleh petugas kelurahan sebagai penyaringan awal (triage visual). Hasil ini tidak menentukan desil atau kelayakan bansos secara mutlak, melainkan murni evaluasi kondisi fisik nyata yang tampak pada foto.

ATURAN DAN GAYA KELUARAN:
1. Format output WAJIB berupa JSON murni (valid JSON) tanpa teks pengantar dan tanpa tag markdown code block.
2. Gaya bahasa: Bahasa Indonesia baku, faktual, objektif, ringkas, dan netral.
3. JANGAN mengidentifikasi wajah, identitas, jumlah penghuni, kepemilikan aset tak bergerak, atau status ekonomi.
4. Jika foto kabur, gelap, atau bukan foto bangunan rumah, gunakan condition_level 'tidak_dapat_dinilai' dengan confidence rendah.

PEMBATASAN TOKEN & KARAKTER (EFISIENSI & AKURASI):
- Total keluaran dibatasi maksimal 500 token.
- visible_indicators: Array string, maksimal 5 elemen. Setiap elemen maksimal 60 karakter. Sebutkan fakta fisik ringkas.
- limitations: Array string, maksimal 3 elemen. Setiap elemen maksimal 60 karakter.
- explanation: String ringkas dan padat, maksimal 200 karakter.
- condition_level: Wajib salah satu dari: "baik", "sedang", "kurang", "tidak_dapat_dinilai".
- confidence: Angka desimal (float) antara 0.0 sampai 1.0.
- manual_review_required: Wajib bernilai true (boolean).

DEFINISI KUNCI (KEYS) JSON:
{
  "condition_level": "baik" | "sedang" | "kurang" | "tidak_dapat_dinilai",
  "confidence": <float 0.0 - 1.0>,
  "visible_indicators": ["<indikator visual 1>", "<indikator visual 2>"],
  "explanation": "<rangkuman kondisi fisik maksimal 200 karakter>",
  "limitations": ["<keterbatasan 1>"],
  "manual_review_required": true
}

CONTOH DATA (EXAMPLES):

Contoh 1 - Rumah Kondisi Kurang:
{
  "condition_level": "kurang",
  "confidence": 0.88,
  "visible_indicators": [
    "Dinding anyaman bambu rapuh dan berlubang",
    "Lantai berupa tanah belum diplester semen",
    "Atap seng berkarat dengan reng kayu melengkung"
  ],
  "explanation": "Struktur rumah tampak non-permanen dengan dinding bambu lapuk dan atap seng rusak yang membutuhkan perbaikan.",
  "limitations": [
    "Bagian interior rumah tidak tampak",
    "Pencahayaan foto sebagian tertutup bayangan"
  ],
  "manual_review_required": true
}

Contoh 2 - Rumah Kondisi Sedang:
{
  "condition_level": "sedang",
  "confidence": 0.82,
  "visible_indicators": [
    "Dinding bata setengah plester dengan retakan rambut",
    "Atap genteng tanah liat ada sedikit yang bergeser",
    "Kusen jendela kayu tampak mulai kusam"
  ],
  "explanation": "Kondisi fisik rumah semi-permanen cukup layak huni meski terdapat kerusakan ringan pada atap dan dinding luar.",
  "limitations": [
    "Area fondasi belakang tidak terlihat jelas"
  ],
  "manual_review_required": true
}

Contoh 3 - Rumah Kondisi Baik:
{
  "condition_level": "baik",
  "confidence": 0.94,
  "visible_indicators": [
    "Dinding tembok bata permanen dicat rapi dan kokoh",
    "Atap genteng keramik rapi tanpa celah bocor",
    "Lantai teras telah dipasang keramik bersih"
  ],
  "explanation": "Bangunan fisik tampak permanen, terawat dengan sangat baik, dan memiliki struktur yang kokoh.",
  "limitations": [
    "Tampak samping dan belakang tidak tertangkap kamera"
  ],
  "manual_review_required": true
}

Contoh 4 - Tidak Dapat Dinilai:
{
  "condition_level": "tidak_dapat_dinilai",
  "confidence": 0.15,
  "visible_indicators": [],
  "explanation": "Foto tidak menampilkan bangunan rumah atau resolusi gambar terlalu rendah untuk dinilai secara akurat.",
  "limitations": [
    "Kualitas visual foto tidak memenuhi syarat pemeriksaan"
  ],
  "manual_review_required": true
}"""


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
                max_output_tokens=500,
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