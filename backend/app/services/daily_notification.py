import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.portfolio import Portfolio, Position
from app.services.daily_summary import generate_daily_summary
from app.services.earnings import get_earnings_info
from app.services.portfolio_risk import calculate_portfolio_risk_summary
from app.services.telegram import (
    format_daily_summary,
    format_earnings_alert,
    send_telegram_message,
)

logger = logging.getLogger(__name__)


async def send_daily_portfolio_notification(
    portfolio_id: int,
    db: AsyncSession,
) -> dict:
    try:
        positions_result = await db.execute(
            select(Position).where(Position.portfolio_id == portfolio_id)
        )
        positions = positions_result.scalars().all()
        portfolio_tickers = [p.ticker for p in positions]

        if not portfolio_tickers:
            return {"sent": False, "reason": "No positions in portfolio"}

        risk_summary = await calculate_portfolio_risk_summary(portfolio_id, db)
        portfolio_score = risk_summary.get("portfolio_risk_score") or 0.0
        portfolio_level = risk_summary.get("portfolio_risk_level", "unknown")
        high_risk = risk_summary.get("high_risk_positions", [])

        daily = generate_daily_summary(portfolio_tickers=portfolio_tickers)
        summary_text = daily.get("summary", "No summary available")

        message = format_daily_summary(
            date=datetime.now().strftime("%Y-%m-%d"),
            portfolio_score=portfolio_score,
            portfolio_level=portfolio_level,
            high_risk_tickers=high_risk,
            summary_text=summary_text,
        )

        result = send_telegram_message(message)
        return {
            "portfolio_id": portfolio_id,
            "sent": result.get("sent", False),
            "portfolio_score": portfolio_score,
            "high_risk_count": len(high_risk),
        }

    except Exception as e:
        logger.error(f"Daily notification failed for portfolio {portfolio_id}: {e}")
        return {"portfolio_id": portfolio_id, "sent": False, "error": str(e)}


async def send_earnings_notifications(db: AsyncSession) -> list:
    results = []
    try:
        positions_result = await db.execute(select(Position))
        positions = positions_result.scalars().all()

        seen_tickers = set()
        for position in positions:
            if position.ticker in seen_tickers:
                continue
            seen_tickers.add(position.ticker)

            earnings = get_earnings_info(position.ticker)
            urgency = earnings.get("urgency", "none")

            if urgency in ["critical", "high"]:
                message = format_earnings_alert(
                    ticker=position.ticker,
                    company_name=earnings.get("company_name", position.ticker),
                    days_until=earnings.get("days_until_earnings", 0),
                    urgency=urgency,
                )
                result = send_telegram_message(message)
                results.append(
                    {
                        "ticker": position.ticker,
                        "urgency": urgency,
                        "days_until": earnings.get("days_until_earnings"),
                        "sent": result.get("sent", False),
                    }
                )

    except Exception as e:
        logger.error(f"Earnings notifications failed: {e}")

    return results


async def run_all_daily_notifications():
    logger.info("Starting daily notifications...")
    async with AsyncSessionLocal() as db:
        try:
            portfolios_result = await db.execute(select(Portfolio))
            portfolios = portfolios_result.scalars().all()

            for portfolio in portfolios:
                result = await send_daily_portfolio_notification(portfolio.id, db)
                logger.info(f"Daily notification for portfolio {portfolio.id}: {result}")

            earnings_results = await send_earnings_notifications(db)
            logger.info(f"Earnings notifications sent: {len(earnings_results)}")

        except Exception as e:
            logger.error(f"Daily notifications run failed: {e}")
