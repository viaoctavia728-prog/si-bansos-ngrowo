from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SI-BANSOS NGROWO"
    database_url: str = "mysql+pymysql://sibansos_user:sibansos_pass@db/db_sibansos_ngrowo"
    secret_key: str = "super-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.1-flash-lite"
    staff_portal_pin: str = Field(min_length=1)
    cors_origins: str = "http://localhost,http://localhost:80,http://localhost:3000,http://localhost:5173,http://localhost:4173,http://127.0.0.1,http://127.0.0.1:80,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:4173,http://frontend"

    @field_validator("staff_portal_pin")
    @classmethod
    def require_nonempty_staff_portal_pin(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("STAFF_PORTAL_PIN must not be empty.")
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()
