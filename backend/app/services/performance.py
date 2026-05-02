import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Position, PriceHistory
from app.services.market_data import get_current_price

logger = logging.getLogger(__name__)


def calculate_position_performance(
    ticker: str,
    shares: float,
    avg_buy_price: float,
    current_price: float,
) -> dict:
    cost_basis = shares * avg_buy_price
    current_value = shares * current_price
    unrealized_pnl = current_value - cost_basis
    unrealized_pnl_pct = ((current_price - avg_buy_price) / avg_buy_price) * 100

    return {
        "ticker": ticker,
        "shares": shares,
        "avg_buy_price": round(avg_buy_price, 2),
        "current_price": round(current_price, 2),
        "cost_basis": round(cost_basis, 2),
        "current_value": round(current_value, 2),
        "unrealized_pnl": round(unrealized_pnl, 2),
        "unrealized_pnl_pct": round(unrealized_pnl_pct, 2),
        "is_profitable": unrealized_pnl > 0,
    }


async def get_portfolio_performance(
    portfolio_id: int,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(Position).where(Position.portfolio_id == portfolio_id)
    )
    positions = result.scalars().all()

    if not positions:
        return {"error": "No positions found", "portfolio_id": portfolio_id}

    position_performances = []
    total_cost_basis = 0.0
    total_current_value = 0.0
    failed_tickers = []

    for position in positions:
        current_price = get_current_price(position.ticker)

        if current_price is None:
            failed_tickers.append(position.ticker)
            position_performances.append(
                {
                    "ticker": position.ticker,
                    "shares": position.shares,
                    "avg_buy_price": position.avg_buy_price,
                    "current_price": None,
                    "cost_basis": round(position.shares * position.avg_buy_price, 2),
                    "current_value": None,
                    "unrealized_pnl": None,
                    "unrealized_pnl_pct": None,
                    "is_profitable": None,
                    "error": "Price unavailable",
                }
            )
            total_cost_basis += position.shares * position.avg_buy_price
            continue

        perf = calculate_position_performance(
            ticker=position.ticker,
            shares=position.shares,
            avg_buy_price=position.avg_buy_price,
            current_price=current_price,
        )
        position_performances.append(perf)
        total_cost_basis += perf["cost_basis"]
        total_current_value += perf["current_value"]

    total_pnl = total_current_value - total_cost_basis
    total_pnl_pct = (
        ((total_current_value - total_cost_basis) / total_cost_basis * 100)
        if total_cost_basis > 0
        else 0.0
    )

    best_performer = None
    worst_performer = None
    valid_perfs = [
        p for p in position_performances if p.get("unrealized_pnl_pct") is not None
    ]

    if valid_perfs:
        best_performer = max(valid_perfs, key=lambda x: x["unrealized_pnl_pct"])
        worst_performer = min(valid_perfs, key=lambda x: x["unrealized_pnl_pct"])

    return {
        "portfolio_id": portfolio_id,
        "total_cost_basis": round(total_cost_basis, 2),
        "total_current_value": round(total_current_value, 2),
        "total_unrealized_pnl": round(total_pnl, 2),
        "total_unrealized_pnl_pct": round(total_pnl_pct, 2),
        "is_overall_profitable": total_pnl > 0,
        "best_performer": best_performer["ticker"] if best_performer else None,
        "worst_performer": worst_performer["ticker"] if worst_performer else None,
        "positions": position_performances,
        "failed_tickers": failed_tickers,
        "positions_count": len(positions),
    }
