import logging

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import SentimentHistory
from app.services.news import fetch_news
from app.services.news_categorizer import get_category_summary
from app.services.sentiment import analyze_batch_sentiment

logger = logging.getLogger(__name__)


async def save_sentiment_snapshot(ticker: str, db: AsyncSession) -> dict:
    try:
        articles = fetch_news(ticker, days_back=3)
        if not articles:
            return {"saved": False, "ticker": ticker, "reason": "No articles found"}

        sentiment_result = analyze_batch_sentiment(articles)
        category_result = get_category_summary(articles)

        record = SentimentHistory(
            ticker=ticker,
            overall_score=sentiment_result["overall_score"],
            overall_sentiment=sentiment_result["overall_sentiment"],
            positive_count=sentiment_result["positive_count"],
            negative_count=sentiment_result["negative_count"],
            neutral_count=sentiment_result["neutral_count"],
            article_count=sentiment_result["article_count"],
            dominant_category=category_result["dominant_category"],
            urgent_count=category_result["urgent_count"],
        )

        db.add(record)
        await db.commit()
        await db.refresh(record)

        return {
            "saved": True,
            "ticker": ticker,
            "overall_score": record.overall_score,
            "overall_sentiment": record.overall_sentiment,
            "dominant_category": record.dominant_category,
            "urgent_count": record.urgent_count,
        }

    except Exception as e:
        logger.error(f"Failed to save sentiment for {ticker}: {e}")
        return {"saved": False, "ticker": ticker, "error": str(e)}


async def get_sentiment_history(ticker: str, db: AsyncSession, limit: int = 30) -> list:
    result = await db.execute(
        select(SentimentHistory)
        .where(SentimentHistory.ticker == ticker)
        .order_by(desc(SentimentHistory.created_at))
        .limit(limit)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "ticker": r.ticker,
            "overall_score": r.overall_score,
            "overall_sentiment": r.overall_sentiment,
            "positive_count": r.positive_count,
            "negative_count": r.negative_count,
            "neutral_count": r.neutral_count,
            "article_count": r.article_count,
            "dominant_category": r.dominant_category,
            "urgent_count": r.urgent_count,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


async def get_latest_sentiment(ticker: str, db: AsyncSession) -> dict | None:
    result = await db.execute(
        select(SentimentHistory)
        .where(SentimentHistory.ticker == ticker)
        .order_by(desc(SentimentHistory.created_at))
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if not row:
        return None
    return {
        "overall_score": row.overall_score,
        "overall_sentiment": row.overall_sentiment,
        "dominant_category": row.dominant_category,
        "urgent_count": row.urgent_count,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }
