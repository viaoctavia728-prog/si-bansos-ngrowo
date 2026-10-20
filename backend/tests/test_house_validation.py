from types import SimpleNamespace

from app.core.gemini import extract_response_text
from app.schemas.house_validation import HouseConditionAssessment


def test_extract_response_text_supports_candidate_parts():
    response = SimpleNamespace(
        text=None,
        candidates=[
            SimpleNamespace(
                content=SimpleNamespace(
                    parts=[
                        SimpleNamespace(
                            text='{"condition_level":"baik","confidence":0.8,"visible_indicators":["atap rata"],"explanation":"Rumah terlihat dalam kondisi baik.","limitations":[],"manual_review_required":true}'
                        )
                    ]
                )
            )
        ],
    )

    assert extract_response_text(response) == (
        '{"condition_level":"baik","confidence":0.8,"visible_indicators":["atap rata"],"explanation":"Rumah terlihat dalam kondisi baik.","limitations":[],"manual_review_required":true}'
    )


def test_house_condition_assessment_model_accepts_valid_payload():
    payload = '{"condition_level":"sedang","confidence":0.7,"visible_indicators":["dinding tampak cukup kokoh"],"explanation":"Kondisi fisik terlihat sedang.","limitations":["Tidak dapat menilai detail interior"],"manual_review_required":true}'

    assessment = HouseConditionAssessment.model_validate_json(payload)

    assert assessment.condition_level == "sedang"
    assert assessment.manual_review_required is True


def test_house_condition_assessment_enforces_array_and_char_limits():
    # Menguji pembatasan jumlah item array (maks 5 item), pembatasan karakter per item (maks 60), dan penjelasan (maks 200)
    long_indicator = "A" * 100
    long_limitation = "B" * 100
    long_explanation = "C" * 300
    indicators = [f"Indikator {i}: {long_indicator}" for i in range(10)]
    limitations = [f"Batasan {i}: {long_limitation}" for i in range(8)]

    import json
    payload = json.dumps({
        "condition_level": "kurang",
        "confidence": 0.85,
        "visible_indicators": indicators,
        "explanation": long_explanation,
        "limitations": limitations,
        "manual_review_required": True,
    })

    assessment = HouseConditionAssessment.model_validate_json(payload)
    assert len(assessment.visible_indicators) <= 5
    assert len(assessment.limitations) <= 3
    assert all(len(item) <= 60 for item in assessment.visible_indicators)
    assert all(len(item) <= 60 for item in assessment.limitations)
    assert len(assessment.explanation) <= 200


def test_extract_response_text_cleans_markdown_fences():
    fenced_text = '```json\n{"condition_level":"baik","confidence":0.9,"visible_indicators":["atap genteng utuh"],"explanation":"Rumah kokoh.","limitations":[],"manual_review_required":true}\n```'
    response = SimpleNamespace(text=fenced_text)
    clean_text = extract_response_text(response)
    assert not clean_text.startswith("```")
    assert not clean_text.endswith("```")
    assessment = HouseConditionAssessment.model_validate_json(clean_text)
    assert assessment.condition_level == "baik"
