from functools import lru_cache
import json

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Survey Service"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+asyncpg://survey:survey@postgres:5432/survey_db"
    redis_url: str = "redis://redis:6379/0"

    jwt_secret: str = Field(default="change-this-secret-in-production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120

    # Храним CORS как строку, потому что pydantic-settings пытается
    # JSON-декодировать list[str] до вызова валидаторов.
    # Поддерживаются оба формата:
    # CORS_ORIGINS=http://localhost,http://localhost:5173
    # CORS_ORIGINS=["http://localhost","http://localhost:5173"]
    cors_origins: str = "http://localhost,http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        value = self.cors_origins.strip()
        if not value:
            return []

        if value.startswith("["):
            parsed = json.loads(value)
            if not isinstance(parsed, list):
                raise ValueError("CORS_ORIGINS JSON value must be a list")
            return [str(origin).strip() for origin in parsed if str(origin).strip()]

        return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
