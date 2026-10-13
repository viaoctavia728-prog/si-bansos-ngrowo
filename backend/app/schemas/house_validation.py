from typing import Literal

from pydantic import BaseModel, Field


class HouseConditionAssessment(BaseModel):
    condition_level: Literal["baik", "sedang", "kurang", "tidak_dapat_dinilai"]
    confidence: float = Field(ge=0, le=1)
    visible_indicators: list[str]
    explanation: str
    limitations: list[str]
    manual_review_required: Literal[True] = True