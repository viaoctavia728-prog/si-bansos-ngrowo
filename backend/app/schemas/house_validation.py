from typing import Literal

from pydantic import BaseModel, Field, field_validator


class HouseConditionAssessment(BaseModel):
    condition_level: Literal["baik", "sedang", "kurang", "tidak_dapat_dinilai"]
    confidence: float = Field(ge=0.0, le=1.0)
    visible_indicators: list[str] = Field(default_factory=list, max_length=5)
    explanation: str = Field(..., max_length=250)
    limitations: list[str] = Field(default_factory=list, max_length=3)
    manual_review_required: Literal[True] = True

    @field_validator("visible_indicators", mode="before")
    @classmethod
    def sanitize_visible_indicators(cls, values):
        if not isinstance(values, list):
            return []
        sanitized = []
        # Maksimal 5 item array, maksimal 60 karakter per item
        for item in values[:5]:
            text = str(item).strip()
            if text:
                sanitized.append(text[:60])
        return sanitized

    @field_validator("limitations", mode="before")
    @classmethod
    def sanitize_limitations(cls, values):
        if not isinstance(values, list):
            return []
        sanitized = []
        # Maksimal 3 item array, maksimal 60 karakter per item
        for item in values[:3]:
            text = str(item).strip()
            if text:
                sanitized.append(text[:60])
        return sanitized

    @field_validator("explanation", mode="before")
    @classmethod
    def sanitize_explanation(cls, value):
        text = str(value or "").strip()
        if not text:
            return "Kondisi fisik telah dinilai berdasarkan foto dokumentasi."
        # Maksimal 200 karakter
        return text[:200]

    @field_validator("confidence", mode="before")
    @classmethod
    def round_confidence(cls, value):
        try:
            val = float(value)
            return max(0.0, min(1.0, round(val, 2)))
        except (ValueError, TypeError):
            return 0.5