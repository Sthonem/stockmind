import re

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./stockmind.db"
    GROQ_API_KEY: str = ""
    NEWS_API_KEY: str = ""
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_CHAT_ID: str = ""
    FRONTEND_URL: str = ""
    ENVIRONMENT: str = "development"

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    @property
    def is_postgres(self) -> bool:
        url = self.DATABASE_URL
        return url.startswith("postgres://") or url.startswith("postgresql://")

    @property
    def async_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        # Strip all SSL-related query params — we pass ssl=True via connect_args instead
        url = re.sub(r"[?&]sslmode=[^&]*", "", url)
        url = re.sub(r"[?&]ssl=[^&]*", "", url)
        # Clean up dangling ? or & left behind
        url = re.sub(r"\?$", "", url)
        url = re.sub(r"\?&", "?", url)
        return url

    class Config:
        env_file = ".env"


settings = Settings()
