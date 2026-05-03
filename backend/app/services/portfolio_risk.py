import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Position, RiskScore

logger = logging.getLogger(__name__)


async def get_latest_risk_score(position_id: int, db: AsyncSession) -> Optional[dict]:
    from sqlalchemy import desc

    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.position_id == position_id)
        .order_by(desc(RiskScore.created_at))
        .limit(1)
    )
    row = result.scalar_one_or_none()
    if not row:
        return None
    return {
        "score": row.score,
        "rsi": row.rsi_signal,
        "macd": row.macd_signal,
        "bb_percent_b": row.bb_signal,
        "sentiment": row.sentiment_signal,
        "notes": row.notes,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


async def calculate_portfolio_risk_summary(
    portfolio_id: int,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(Position).where(Position.portfolio_id == portfolio_id)
    )
    positions = result.scalars().all()

    if not positions:
        return {
            "portfolio_id": portfolio_id,
            "error": "No positions found",
        }

    position_risks = []
    scored_count = 0
    total_weighted_score = 0.0
    total_value = 0.0
    high_risk_positions = []
    medium_risk_positions = []
    low_risk_positions = []

    for position in positions:
        latest = await get_latest_risk_score(position.id, db)
        position_value = position.shares * position.avg_buy_price

        entry = {
            "position_id": position.id,
            "ticker": position.ticker,
            "shares": position.shares,
            "avg_buy_price": position.avg_buy_price,
            "estimated_value": round(position_value, 2),
            "risk_score": latest["score"] if latest else None,
            "risk_level": None,
            "last_calculated": latest["created_at"] if latest else None,
        }

        if latest:
            score = latest["score"]
            scored_count += 1
            total_weighted_score += score * position_value
            total_value += position_value

            if score >= 70:
                entry["risk_level"] = "high"
                high_risk_positions.append(position.ticker)
            elif score >= 40:
                entry["risk_level"] = "medium"
                medium_risk_positions.append(position.ticker)
            else:
                entry["risk_level"] = "low"
                low_risk_positions.append(position.ticker)
        else:
            total_value += position_value

        position_risks.append(entry)

    portfolio_score = (
        round(total_weighted_score / total_value, 1)
        if total_value > 0 and scored_count > 0
        else None
    )

    if portfolio_score is not None:
        if portfolio_score >= 70:
            portfolio_level = "high"
            portfolio_note = "Portfolio is under significant stress — review positions"
        elif portfolio_score >= 40:
            portfolio_level = "medium"
            portfolio_note = "Portfolio has moderate risk — monitor closely"
        else:
            portfolio_level = "low"
            portfolio_note = "Portfolio looks stable"
    else:
        portfolio_level = "unknown"
        portfolio_note = "Run risk calculation first"

    return {
        "portfolio_id": portfolio_id,
        "portfolio_risk_score": portfolio_score,
        "portfolio_risk_level": portfolio_level,
        "portfolio_note": portfolio_note,
        "total_positions": len(positions),
        "scored_positions": scored_count,
        "high_risk_positions": high_risk_positions,
        "medium_risk_positions": medium_risk_positions,
        "low_risk_positions": low_risk_positions,
        "positions": position_risks,
    }
