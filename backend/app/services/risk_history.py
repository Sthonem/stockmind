import logging
from typing import Optional

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Position, RiskScore
from app.services.market_data import get_ohlcv
from app.services.risk_service import calculate_risk_for_ticker
from app.services.stop_loss import analyze_stop_loss_for_ticker

logger = logging.getLogger(__name__)


async def save_risk_score(
    position_id: int,
    ticker: str,
    avg_buy_price: Optional[float],
    db: AsyncSession,
    include_sentiment: bool = True,
) -> dict:
    try:
        risk_result = calculate_risk_for_ticker(
            ticker,
            include_sentiment=include_sentiment,
        )
        df = get_ohlcv(ticker, period="6mo")
        stop_loss = analyze_stop_loss_for_ticker(
            df=df,
            risk_score=risk_result["risk"]["score"],
            avg_buy_price=avg_buy_price,
        )

        components = risk_result["risk"]["components"]
        indicators = risk_result["indicators"]

        record = RiskScore(
            position_id=position_id,
            ticker=ticker,
            score=risk_result["risk"]["score"],
            rsi_signal=indicators["rsi"]["value"],
            macd_signal=indicators["macd"]["value"],
            bb_signal=indicators["bollinger_bands"]["percent_b"],
            sentiment_signal=risk_result.get("sentiment_score"),
            notes=(
                f"Level: {risk_result['risk']['level']} | "
                f"Signal: {risk_result['overall_signal']} | "
                f"Stop-loss: {stop_loss['stop_loss_price']} | "
                f"Sentiment: {'included' if risk_result['sentiment_included'] else 'not included'} | "
                f"{risk_result['risk']['recommendation']}"
            ),
        )

        db.add(record)
        await db.commit()
        await db.refresh(record)

        return {
            "saved": True,
            "risk_score_id": record.id,
            "ticker": ticker,
            "score": record.score,
            "level": risk_result["risk"]["level"],
            "stop_loss": stop_loss["stop_loss_price"],
            "sentiment_included": risk_result["sentiment_included"],
        }

    except Exception as e:
        logger.error(f"Failed to save risk score for {ticker}: {e}")
        return {"saved": False, "ticker": ticker, "error": str(e)}


async def get_risk_history(
    position_id: int,
    db: AsyncSession,
    limit: int = 30,
) -> list:
    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.position_id == position_id)
        .order_by(desc(RiskScore.created_at))
        .limit(limit)
    )
    rows = result.scalars().all()
    return [
        {
            "id": r.id,
            "ticker": r.ticker,
            "score": r.score,
            "rsi": r.rsi_signal,
            "macd": r.macd_signal,
            "bb_percent_b": r.bb_signal,
            "sentiment": r.sentiment_signal,
            "notes": r.notes,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


async def save_risk_scores_for_portfolio(
    portfolio_id: int,
    db: AsyncSession,
) -> list:
    result = await db.execute(
        select(Position).where(Position.portfolio_id == portfolio_id)
    )
    positions = result.scalars().all()

    results = []
    for position in positions:
        outcome = await save_risk_score(
            position_id=position.id,
            ticker=position.ticker,
            avg_buy_price=position.avg_buy_price,
            db=db,
        )
        results.append(outcome)

    return results
