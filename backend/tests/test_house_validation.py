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
