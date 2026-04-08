from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Resolve .env path: config.py is at backend/app/core/config.py
# .env is at backend/.env → 2 parents up
ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=True,
    )


settings = Settings()
