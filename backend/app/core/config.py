from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SI-BANSOS NGROWO"
    database_url: str = "mysql+pymysql://sibansos_user:sibansos_pass@db/db_sibansos_ngrowo"
    secret_key: str = "super-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    cors_origins: str = "http://localhost,http://localhost:80,http://localhost:3000,http://localhost:5173,http://localhost:4173,http://127.0.0.1,http://127.0.0.1:80,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:4173,http://frontend"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

