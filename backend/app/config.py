import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


@dataclass(frozen=True)
class Settings:
    allowed_origins: tuple[str, ...]


def get_settings() -> Settings:
    raw_origins = os.getenv(
        "LUNARA_FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "https://lunara-mission-trainer.onrender.com",
    )
    origins = tuple(origin.strip() for origin in raw_origins.split(",") if origin.strip())
    return Settings(allowed_origins=origins)
