import logging
from typing import Optional

from app.services.news import fetch_news
from app.services.risk_engine import compute_risk_score
from app.services.sentiment import analyze_batch_sentiment
from app.services.technical_analysis import analyze_ticker

logger = logging.getLogger(__name__)


def calculate_risk_for_ticker(
    ticker: str,
    sentiment_score: Optional[float] = None,
    include_sentiment: bool = False,
) -> dict:
    analysis = analyze_ticker(ticker)
    indicators = analysis["indicators"]

    if include_sentiment and sentiment_score is None:
        try:
            articles = fetch_news(ticker)
            if articles:
                sentiment_result = analyze_batch_sentiment(articles)
                sentiment_score = sentiment_result["overall_score"]
                logger.info(f"Sentiment for {ticker}: {sentiment_score}")
        except Exception as e:
            logger.warning(f"Sentiment fetch failed for {ticker}: {e}")
            sentiment_score = None

    rsi_value = indicators["rsi"]["value"]
    macd_histogram = indicators["macd"]["value"]
    macd_value = indicators["macd"]["value"]
    bb_percent_b = indicators["bollinger_bands"]["percent_b"]
    ema_direction = indicators["ema"]["direction"]
    ema_strength = indicators["ema"]["strength"]

    risk = compute_risk_score(
        rsi_value=rsi_value,
        macd_histogram=macd_histogram,
        macd_value=macd_value,
        bb_percent_b=bb_percent_b,
        ema_direction=ema_direction,
        ema_strength=ema_strength,
        sentiment_score=sentiment_score,
    )

    return {
        "ticker": ticker,
        "latest_price": analysis["latest_price"],
        "overall_signal": analysis["overall_signal"],
        "composite_score": analysis["composite_score"],
        "sentiment_score": sentiment_score,
        "sentiment_included": sentiment_score is not None,
        "risk": risk,
        "indicators": indicators,
    }
