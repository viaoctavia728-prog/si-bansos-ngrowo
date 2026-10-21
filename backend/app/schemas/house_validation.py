from typing import Literal

from pydantic import BaseModel, Field, field_validator


class HouseConditionAssessment(BaseModel):
    condition_level: Literal["baik", "sedang", "kurang", "tidak_dapat_dinilai"]
    confidence: float = Field(ge=0.0, le=1.0)
    visible_indicators: list[str] = Field(default_factory=list, max_length=5)
    explanation: str = Field(..., max_length=200)
    limitations: list[str] = Field(default_factory=list, max_length=3)
    manual_review_required: Literal[True] = True

    @field_validator("visible_indicators", mode="before")
    @classmethod
    def sanitize_visible_indicators(cls, values):
        if not isinstance(values, list):
            return []
        return [text for item in values[:5] if (text := str(item).strip())][:5]

    @field_validator("limitations", mode="before")
    @classmethod
    def sanitize_limitations(cls, values):
        if not isinstance(values, list):
            return []
        return [text for item in values[:3] if (text := str(item).strip())][:3]

    @field_validator("visible_indicators", "limitations")
    @classmethod
    def limit_item_length(cls, values):
        return [item[:60] for item in values]

    @field_validator("explanation", mode="before")
    @classmethod
    def sanitize_explanation(cls, value):
        text = str(value or "").strip()
        return (text or "Kondisi fisik dinilai berdasarkan foto dokumentasi.")[:200]

    @field_validator("confidence", mode="before")
    @classmethod
    def round_confidence(cls, value):
        try:
            return max(0.0, min(1.0, round(float(value), 2)))
        except (TypeError, ValueError):
            return 0.5
