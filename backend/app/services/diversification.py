import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Position
from app.services.market_data import get_stock_info

logger = logging.getLogger(__name__)

SECTOR_RISK_WEIGHTS = {
    "Technology": 1.3,
    "Consumer Cyclical": 1.2,
    "Communication Services": 1.2,
    "Financial Services": 1.1,
    "Healthcare": 0.9,
    "Industrials": 1.0,
    "Consumer Defensive": 0.8,
    "Energy": 1.1,
    "Basic Materials": 1.0,
    "Real Estate": 1.0,
    "Utilities": 0.7,
    "Unknown": 1.0,
}


def calculate_herfindahl_index(weights: list[float]) -> float:
    return sum(w**2 for w in weights)


def calculate_diversification_score(
    sector_weights: dict,
    position_weights: dict,
    num_positions: int,
) -> dict:
    hhi_sector = calculate_herfindahl_index(list(sector_weights.values()))
    hhi_position = calculate_herfindahl_index(list(position_weights.values()))

    max_hhi = 1.0
    min_hhi_sector = 1.0 / max(len(sector_weights), 1)
    min_hhi_position = 1.0 / max(num_positions, 1)

    if len(sector_weights) <= 1:
        sector_score = 0.0
    else:
        sector_score = (
            1 - (hhi_sector - min_hhi_sector) / (max_hhi - min_hhi_sector + 1e-9)
        ) * 100

    if num_positions <= 1:
        position_score = 0.0
    else:
        position_score = (
            1
            - (hhi_position - min_hhi_position)
            / (max_hhi - min_hhi_position + 1e-9)
        ) * 100

    sector_score = max(0.0, min(100.0, sector_score))
    position_score = max(0.0, min(100.0, position_score))

    overall_score = sector_score * 0.5 + position_score * 0.5

    if overall_score >= 70:
        level = "well_diversified"
        note = "Portfolio is well diversified across sectors and positions"
    elif overall_score >= 40:
        level = "moderately_diversified"
        note = "Some concentration risk — consider adding positions in underrepresented sectors"
    else:
        level = "concentrated"
        note = "High concentration risk — portfolio heavily weighted in few sectors or positions"

    dominant_sector = (
        max(sector_weights, key=sector_weights.get) if sector_weights else "Unknown"
    )
    dominant_position = (
        max(position_weights, key=position_weights.get)
        if position_weights
        else "Unknown"
    )

    return {
        "overall_score": round(overall_score, 1),
        "sector_score": round(sector_score, 1),
        "position_score": round(position_score, 1),
        "level": level,
        "note": note,
        "dominant_sector": dominant_sector,
        "dominant_position": dominant_position,
        "hhi_sector": round(hhi_sector, 4),
        "hhi_position": round(hhi_position, 4),
    }


async def get_portfolio_diversification(
    portfolio_id: int,
    db: AsyncSession,
) -> dict:
    result = await db.execute(
        select(Position).where(Position.portfolio_id == portfolio_id)
    )
    positions = result.scalars().all()

    if not positions:
        return {"error": "No positions found"}

    total_value = sum(p.shares * p.avg_buy_price for p in positions)
    if total_value == 0:
        return {"error": "Portfolio has zero value"}

    sector_values = {}
    position_weights = {}
    position_sectors = []

    for position in positions:
        position_value = position.shares * position.avg_buy_price
        weight = position_value / total_value
        position_weights[position.ticker] = weight

        try:
            info = get_stock_info(position.ticker)
            sector = info.get("sector") or "Unknown"
        except Exception:
            sector = "Unknown"

        sector_values[sector] = sector_values.get(sector, 0) + position_value

        position_sectors.append(
            {
                "ticker": position.ticker,
                "sector": sector,
                "weight": round(weight * 100, 2),
                "value": round(position_value, 2),
            }
        )

    sector_weights = {
        sector: value / total_value for sector, value in sector_values.items()
    }

    sector_distribution = {
        sector: round(weight * 100, 2) for sector, weight in sector_weights.items()
    }

    diversification = calculate_diversification_score(
        sector_weights=sector_weights,
        position_weights=position_weights,
        num_positions=len(positions),
    )

    sector_risk_score = sum(
        sector_weights.get(sector, 0) * SECTOR_RISK_WEIGHTS.get(sector, 1.0)
        for sector in sector_weights
    )

    return {
        "portfolio_id": portfolio_id,
        "total_value": round(total_value, 2),
        "num_positions": len(positions),
        "num_sectors": len(sector_values),
        "sector_distribution": sector_distribution,
        "position_details": position_sectors,
        "diversification": diversification,
        "sector_risk_multiplier": round(sector_risk_score, 3),
    }
