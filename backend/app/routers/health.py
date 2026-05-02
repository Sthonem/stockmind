from fastapi import APIRouter

from app.config import settings

router = APIRouter(prefix="/api/v1", tags=["health"])


@router.get("/health")
def health():
    return {"status": "ok"}


@router.get("/status")
def status():
    return {
        "status": "ok",
        "environment": settings.ENVIRONMENT,
        "features": {
            "ai_chat": bool(settings.GROQ_API_KEY),
            "news_feed": bool(settings.NEWS_API_KEY),
            "telegram": bool(settings.TELEGRAM_BOT_TOKEN and settings.TELEGRAM_CHAT_ID),
            "database": "postgresql" if "postgresql" in settings.async_database_url else "sqlite",
        }
    }
