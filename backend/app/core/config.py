from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "SI-BANSOS NGROWO"
    database_url: str = "mysql+pymysql://sibansos_user:sibansos_pass@db/db_sibansos_ngrowo"
    secret_key: str = "super-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

