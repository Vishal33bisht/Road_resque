import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.environment = os.getenv("APP_ENV", "development").lower()
        self.testing = os.getenv("TESTING", "").lower() in {"1", "true", "yes"}
        self.secret_key = self._required("SECRET_KEY")
        self.database_url = self._database_url()
        self.cors_origins = self._cors_origins()
        self.access_token_expire_minutes = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
        self.refresh_token_expire_days = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
        self.secure_cookies = os.getenv("SECURE_COOKIES", str(self.environment == "production")).lower() in {
            "1",
            "true",
            "yes",
        }
        self.cookie_samesite = os.getenv(
            "COOKIE_SAMESITE",
            "none" if self.environment == "production" else "lax",
        ).lower()

    def _required(self, name: str) -> str:
        value = os.getenv(name)
        if not value:
            if self.testing:
                return f"test-{name.lower()}-change-me"
            raise RuntimeError(f"{name} must be set in the environment")
        return value

    def _database_url(self) -> str:
        value = os.getenv("DATABASE_URL")
        if not value:
            if self.testing:
                return "sqlite:///./test_roadside_rescue.db"
            raise RuntimeError("DATABASE_URL must be set in the environment")
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql://", 1)
        return value

    def _cors_origins(self) -> list[str]:
        raw_origins = os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173",
        )
        return [origin.strip().rstrip("/") for origin in raw_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
