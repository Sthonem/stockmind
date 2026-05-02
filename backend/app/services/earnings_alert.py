import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.portfolio import Portfolio, Position
from app.services.earnings import get_earnings_history, get_earnings_info
from app.services.telegram import (
    format_earnings_alert,
    send_telegram_message,
)

logger = logging.getLogger(__name__)


def calculate_earnings_risk_adjustment(
    days_until: int,
    earnings_history: list,
) -> dict:
    if not earnings_history:
        return {
            "adjustment": 1.2,
            "reason": "No earnings history — applying default volatility premium",
        }

    completed = [e for e in earnings_history if e.get("eps_actual") is not None]
    if not completed:
        return {
            "adjustment": 1.2,
            "reason": "No completed earnings data available",
        }

    surprises = [
        e["surprise_pct"] for e in completed if e.get("surprise_pct") is not None
    ]
    avg_surprise = sum(abs(s) for s in surprises) / len(surprises) if surprises else 0

    beats = sum(1 for e in completed if e.get("beat_estimate") is True)
    beat_rate = beats / len(completed) if completed else 0.5

    if avg_surprise > 10:
        adjustment = 1.4
        reason = (
            f"High surprise history (avg {avg_surprise:.1f}%) — "
            "elevated volatility expected"
        )
    elif avg_surprise > 5:
        adjustment = 1.25
        reason = f"Moderate surprise history (avg {avg_surprise:.1f}%)"
    else:
        adjustment = 1.1
        reason = f"Low surprise history (avg {avg_surprise:.1f}%) — stable earnings"

    if days_until <= 3:
        adjustment = min(adjustment * 1.2, 2.0)
        reason += " — imminent earnings amplify risk"

    return {
        "adjustment": round(adjustment, 2),
        "reason": reason,
        "beat_rate": round(beat_rate * 100, 1),
        "avg_surprise_pct": round(avg_surprise, 2),
        "earnings_samples": len(completed),
    }


async def check_earnings_alerts_for_portfolio(
    portfolio_id: int,
    db: AsyncSession,
    send_notifications: bool = True,
) -> list:
    result = await db.execute(
        select(Position).where(Position.portfolio_id == portfolio_id)
    )
    positions = result.scalars().all()

    alerts = []
    for position in positions:
        earnings = get_earnings_info(position.ticker)
        urgency = earnings.get("urgency", "none")

        if urgency not in ["critical", "high", "medium"]:
            continue

        days_until = earnings.get("days_until_earnings", 99)
        history = get_earnings_history(position.ticker)
        risk_adjustment = calculate_earnings_risk_adjustment(days_until, history)

        alert_entry = {
            "ticker": position.ticker,
            "company_name": earnings.get("company_name", position.ticker),
            "days_until_earnings": days_until,
            "urgency": urgency,
            "eps_estimate": earnings.get("eps_estimate"),
            "risk_adjustment": risk_adjustment["adjustment"],
            "risk_reason": risk_adjustment["reason"],
            "beat_rate": risk_adjustment.get("beat_rate"),
            "notification_sent": False,
        }

        if send_notifications and urgency in ["critical", "high"]:
            message = format_earnings_alert(
                ticker=position.ticker,
                company_name=earnings.get("company_name", position.ticker),
                days_until=days_until,
                urgency=urgency,
            )

            extra_info = (
                f"\n\n📈 <b>Earnings History:</b>\n"
                f"Beat rate: {risk_adjustment.get('beat_rate', 'N/A')}%\n"
                f"Avg surprise: {risk_adjustment.get('avg_surprise_pct', 'N/A')}%\n"
                f"Risk note: {risk_adjustment['reason']}"
            )
            notification = send_telegram_message(message + extra_info)
            alert_entry["notification_sent"] = notification.get("sent", False)

        alerts.append(alert_entry)

    return alerts


async def run_earnings_alert_check():
    logger.info("Running earnings alert check...")
    async with AsyncSessionLocal() as db:
        try:
            portfolios_result = await db.execute(select(Portfolio))
            portfolios = portfolios_result.scalars().all()

            total_alerts = 0
            for portfolio in portfolios:
                alerts = await check_earnings_alerts_for_portfolio(
                    portfolio.id,
                    db,
                    send_notifications=True,
                )
                total_alerts += len(alerts)
                logger.info(
                    f"Earnings alerts for portfolio {portfolio.id}: {len(alerts)}"
                )

            logger.info(f"Earnings alert check complete: {total_alerts} total alerts")
        except Exception as e:
            logger.error(f"Earnings alert check failed: {e}")
