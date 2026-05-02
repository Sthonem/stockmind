import logging
from datetime import datetime

import yfinance as yf
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Position

logger = logging.getLogger(__name__)


def get_earnings_info(ticker: str) -> dict:
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        earnings_date = None
        earnings_timestamp = info.get("earningsTimestamp")
        earnings_timestamp_start = info.get("earningsTimestampStart")

        if earnings_timestamp:
            earnings_date = datetime.fromtimestamp(earnings_timestamp)
        elif earnings_timestamp_start:
            earnings_date = datetime.fromtimestamp(earnings_timestamp_start)

        days_until = None
        is_upcoming = False
        urgency = "none"

        if earnings_date:
            now = datetime.now()
            days_until = (earnings_date - now).days

            if 0 <= days_until <= 30:
                is_upcoming = True
                if days_until <= 3:
                    urgency = "critical"
                elif days_until <= 7:
                    urgency = "high"
                elif days_until <= 14:
                    urgency = "medium"
                else:
                    urgency = "low"

        eps_estimate = info.get("forwardEps")
        eps_actual_last = info.get("trailingEps")

        return {
            "ticker": ticker,
            "earnings_date": earnings_date.isoformat() if earnings_date else None,
            "days_until_earnings": days_until,
            "is_upcoming": is_upcoming,
            "urgency": urgency,
            "eps_estimate": eps_estimate,
            "eps_actual_last_quarter": eps_actual_last,
            "company_name": info.get("longName", ticker),
            "fiscal_year_end": info.get("fiscalYearEnd"),
        }

    except Exception as e:
        logger.error(f"Earnings info failed for {ticker}: {e}")
        return {
            "ticker": ticker,
            "earnings_date": None,
            "days_until_earnings": None,
            "is_upcoming": False,
            "urgency": "none",
            "error": str(e),
        }


def get_earnings_history(ticker: str) -> list:
    try:
        stock = yf.Ticker(ticker)
        earnings = stock.earnings_dates

        if earnings is None or earnings.empty:
            return []

        history = []
        for date, row in earnings.head(8).iterrows():
            eps_estimate = row.get("EPS Estimate")
            eps_actual = row.get("Reported EPS")

            beat = None
            surprise_pct = None
            if eps_estimate is not None and eps_actual is not None:
                try:
                    beat = float(eps_actual) > float(eps_estimate)
                    if float(eps_estimate) != 0:
                        surprise_pct = round(
                            (
                                (float(eps_actual) - float(eps_estimate))
                                / abs(float(eps_estimate))
                            )
                            * 100,
                            2,
                        )
                except Exception:
                    pass

            history.append(
                {
                    "date": str(date.date()) if hasattr(date, "date") else str(date),
                    "eps_estimate": (
                        float(eps_estimate) if eps_estimate is not None else None
                    ),
                    "eps_actual": float(eps_actual) if eps_actual is not None else None,
                    "beat_estimate": beat,
                    "surprise_pct": surprise_pct,
                }
            )

        return history

    except Exception as e:
        logger.error(f"Earnings history failed for {ticker}: {e}")
        return []


async def get_portfolio_earnings_calendar(
    portfolio_id: int,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(Position).where(Position.portfolio_id == portfolio_id)
    )
    positions = result.scalars().all()

    if not positions:
        return {"error": "No positions found"}

    upcoming = []
    all_earnings = []

    for position in positions:
        info = get_earnings_info(position.ticker)
        all_earnings.append(info)
        if info.get("is_upcoming"):
            upcoming.append(info)

    upcoming_sorted = sorted(
        upcoming,
        key=lambda x: x.get("days_until_earnings") or 999,
    )

    critical = [e for e in upcoming if e.get("urgency") == "critical"]
    high = [e for e in upcoming if e.get("urgency") == "high"]

    return {
        "portfolio_id": portfolio_id,
        "total_positions": len(positions),
        "upcoming_earnings_count": len(upcoming),
        "critical_urgency": [e["ticker"] for e in critical],
        "high_urgency": [e["ticker"] for e in high],
        "upcoming_earnings": upcoming_sorted,
        "all_earnings": all_earnings,
    }
