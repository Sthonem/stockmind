import logging
from datetime import datetime, timedelta

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

NEWSAPI_BASE_URL = "https://newsapi.org/v2"


def build_ticker_query(ticker: str, company_name: str = None) -> str:
    if company_name:
        return f'"{ticker}" OR "{company_name}"'
    return f'"{ticker}"'


def fetch_news(ticker: str, company_name: str = None, days_back: int = 7) -> list:
    if not settings.NEWS_API_KEY:
        logger.warning("NEWS_API_KEY not set — returning empty news list")
        return []

    from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    query = build_ticker_query(ticker, company_name)

    params = {
        "q": query,
        "from": from_date,
        "sortBy": "publishedAt",
        "language": "en",
        "pageSize": 20,
        "apiKey": settings.NEWS_API_KEY,
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{NEWSAPI_BASE_URL}/everything", params=params)
            response.raise_for_status()
            data = response.json()

        articles = data.get("articles", [])
        return [
            {
                "title": a.get("title", ""),
                "description": a.get("description", ""),
                "source": a.get("source", {}).get("name", ""),
                "url": a.get("url", ""),
                "published_at": a.get("publishedAt", ""),
                "content_preview": (a.get("content") or "")[:300],
            }
            for a in articles
            if a.get("title") and "[Removed]" not in a.get("title", "")
        ]

    except httpx.HTTPStatusError as e:
        logger.error(f"NewsAPI HTTP error for {ticker}: {e.response.status_code}")
        return []
    except Exception as e:
        logger.error(f"NewsAPI fetch failed for {ticker}: {e}")
        return []


def fetch_market_news(days_back: int = 1) -> list:
    if not settings.NEWS_API_KEY:
        return []

    from_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    params = {
        "q": "stock market OR S&P500 OR Federal Reserve OR inflation",
        "from": from_date,
        "sortBy": "publishedAt",
        "language": "en",
        "pageSize": 10,
        "apiKey": settings.NEWS_API_KEY,
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(f"{NEWSAPI_BASE_URL}/everything", params=params)
            response.raise_for_status()
            data = response.json()

        articles = data.get("articles", [])
        return [
            {
                "title": a.get("title", ""),
                "description": a.get("description", ""),
                "source": a.get("source", {}).get("name", ""),
                "url": a.get("url", ""),
                "published_at": a.get("publishedAt", ""),
            }
            for a in articles
            if a.get("title") and "[Removed]" not in a.get("title", "")
        ]

    except Exception as e:
        logger.error(f"Market news fetch failed: {e}")
        return []
