from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.portfolio import Watchlist
from app.schemas.watchlist import WatchlistCreate, WatchlistResponse, WatchlistUpdate
from app.services.watchlist import add_to_watchlist, check_watchlist_alerts

router = APIRouter(prefix="/api/v1/watchlist", tags=["watchlist"])


@router.post("/", response_model=WatchlistResponse)
async def add_watchlist_item(
    data: WatchlistCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await add_to_watchlist(
        ticker=data.ticker,
        db=db,
        notes=data.notes,
        target_price=data.target_price,
        alert_above=data.alert_above,
        alert_below=data.alert_below,
    )
    item = await db.get(Watchlist, result["id"])
    return item


@router.get("/", response_model=list[WatchlistResponse])
async def list_watchlist(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Watchlist).where(Watchlist.is_active == 1))
    return result.scalars().all()


@router.put("/{item_id}", response_model=WatchlistResponse)
async def update_watchlist_item(
    item_id: int,
    data: WatchlistUpdate,
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(Watchlist, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")

    if data.notes is not None:
        item.notes = data.notes
    if data.target_price is not None:
        item.target_price = data.target_price
    if data.alert_above is not None:
        item.alert_above = data.alert_above
    if data.alert_below is not None:
        item.alert_below = data.alert_below
    if data.is_active is not None:
        item.is_active = data.is_active

    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{item_id}")
async def remove_watchlist_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(Watchlist, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Watchlist item not found")
    item.is_active = 0
    await db.commit()
    return {"message": f"{item.ticker} removed from watchlist"}


@router.post("/check")
async def check_alerts(
    send_notifications: bool = False,
    db: AsyncSession = Depends(get_db),
):
    triggered = await check_watchlist_alerts(
        db,
        send_notifications=send_notifications,
    )
    return {
        "triggered_count": len(triggered),
        "alerts": triggered,
    }
