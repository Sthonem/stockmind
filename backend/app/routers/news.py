from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.news import fetch_market_news, fetch_news
from app.services.news_categorizer import get_category_summary
from app.services.sentiment import analyze_batch_sentiment
from app.services.sentiment_history import (
    get_sentiment_history,
    save_sentiment_snapshot,
)

router = APIRouter(prefix="/api/v1/news", tags=["news"])


@router.get("/market/latest")
def market_news():
    articles = fetch_market_news()
    return {
        "count": len(articles),
        "articles": articles,
    }


@router.get("/{ticker}")
def ticker_news(ticker: str, days_back: int = 7):
    articles = fetch_news(ticker.upper(), days_back=days_back)
    return {
        "ticker": ticker.upper(),
        "count": len(articles),
        "articles": articles,
    }


@router.get("/{ticker}/sentiment")
def ticker_sentiment(ticker: str, days_back: int = 7):
    articles = fetch_news(ticker.upper(), days_back=days_back)
    if not articles:
        return {
            "ticker": ticker.upper(),
            "overall_score": 0.0,
            "overall_sentiment": "neutral",
            "message": "No articles found or NEWS_API_KEY not configured",
        }
    result = analyze_batch_sentiment(articles)
    return {"ticker": ticker.upper(), **result}


@router.get("/{ticker}/categorized")
def ticker_news_categorized(ticker: str, days_back: int = 7):
    articles = fetch_news(ticker.upper(), days_back=days_back)
    if not articles:
        return {
            "ticker": ticker.upper(),
            "total_articles": 0,
            "message": "No articles found or NEWS_API_KEY not configured",
        }
    summary = get_category_summary(articles)
    return {"ticker": ticker.upper(), **summary}


@router.post("/{ticker}/sentiment/save")
async def save_sentiment(ticker: str, db: AsyncSession = Depends(get_db)):
    result = await save_sentiment_snapshot(ticker.upper(), db)
    return result


@router.get("/{ticker}/sentiment/history")
async def sentiment_history(
    ticker: str,
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
):
    history = await get_sentiment_history(ticker.upper(), db, limit=limit)
    if not history:
        raise HTTPException(status_code=404, detail="No sentiment history found")
    return {"ticker": ticker.upper(), "history": history}
