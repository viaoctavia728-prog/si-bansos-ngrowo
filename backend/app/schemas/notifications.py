from pydantic import BaseModel, Field


class FcmTokenRegistration(BaseModel):
    token: str = Field(min_length=20, max_length=512)


class FcmNotificationCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=500)


class FcmTargetNotificationCreate(FcmNotificationCreate):
    target_token: str = Field(min_length=20, max_length=512)