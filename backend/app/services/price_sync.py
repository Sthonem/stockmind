from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Position, PriceHistory
from app.services.market_data import get_ohlcv


async def sync_position_price_history(
    db: AsyncSession,
    position: Position,
    period: str = "1mo",
) -> dict:
    df = get_ohlcv(position.ticker, period=period)
    inserted = 0

    for date, row in df.iterrows():
        result = await db.execute(
            select(PriceHistory).where(
                PriceHistory.position_id == position.id,
                PriceHistory.date == date.to_pydatetime(),
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            continue

        db.add(
            PriceHistory(
                position_id=position.id,
                ticker=position.ticker,
                date=date.to_pydatetime(),
                open=float(row["open"]),
                high=float(row["high"]),
                low=float(row["low"]),
                close=float(row["close"]),
                volume=float(row["volume"]),
            )
        )
        inserted += 1

    await db.commit()
    return {"ticker": position.ticker, "inserted": inserted}


async def sync_all_positions(db: AsyncSession) -> dict:
    result = await db.execute(select(Position))
    positions = result.scalars().all()

    synced = []
    errors = []

    for position in positions:
        try:
            synced.append(await sync_position_price_history(db, position))
        except Exception as e:
            errors.append({"ticker": position.ticker, "error": str(e)})

    return {
        "positions_checked": len(positions),
        "synced": synced,
        "errors": errors,
    }
