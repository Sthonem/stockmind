import logging
from datetime import datetime, timedelta

import httpx
import yfinance as yf

from app.config import settings

logger = logging.getLogger(__name__)

NEWSAPI_BASE_URL = "https://newsapi.org/v2"


def build_ticker_query(ticker: str, company_name: str = None) -> str:
    if company_name:
        return f'"{ticker}" OR "{company_name}"'
    return f'"{ticker}"'


def _fetch_yfinance_news(ticker: str) -> list:
    """Fetch news from yfinance — no API key required, always available."""
    try:
        stock = yf.Ticker(ticker)
        raw = stock.news or []
        articles = []
        for item in raw[:20]:
            content = item.get("content", {})
            title = content.get("title") or item.get("title", "")
            if not title or "[Removed]" in title:
                continue
            pub_time = content.get("pubDate") or ""
            if not pub_time:
                ts = item.get("providerPublishTime")
                if ts:
                    pub_time = datetime.fromtimestamp(ts).isoformat()
            summary = content.get("summary") or content.get("description") or ""
            provider = (content.get("provider") or {}).get("displayName") or item.get("publisher", "")
            url = content.get("canonicalUrl", {}).get("url") or item.get("link", "")
            articles.append({
                "title": title,
                "description": summary,
                "source": provider,
                "url": url,
                "published_at": pub_time,
                "content_preview": summary[:300],
            })
        return articles
    except Exception as e:
        logger.warning(f"yfinance news fetch failed for {ticker}: {e}")
        return []


def fetch_news(ticker: str, company_name: str = None, days_back: int = 7) -> list:
    # Try NewsAPI first if key is configured
    if settings.NEWS_API_KEY:
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
            result = [
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
            if result:
                return result
        except httpx.HTTPStatusError as e:
            logger.error(f"NewsAPI HTTP error for {ticker}: {e.response.status_code}")
        except Exception as e:
            logger.error(f"NewsAPI fetch failed for {ticker}: {e}")

    # Fallback: yfinance news (no API key needed)
    logger.info(f"Using yfinance news fallback for {ticker}")
    return _fetch_yfinance_news(ticker)


def fetch_market_news(days_back: int = 1) -> list:
    if not settings.NEWS_API_KEY:
        # Fallback: fetch news for major market tickers via yfinance
        try:
            articles = []
            for sym in ["SPY", "QQQ"]:
                articles.extend(_fetch_yfinance_news(sym))
            seen = set()
            unique = []
            for a in articles:
                if a["title"] not in seen:
                    seen.add(a["title"])
                    unique.append(a)
            return unique[:10]
        except Exception as e:
            logger.error(f"Market news fallback failed: {e}")
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
