import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Watchlist, WatchlistAlert
from app.services.market_data import get_current_price
from app.services.telegram import format_watchlist_alert, send_telegram_message

logger = logging.getLogger(__name__)


async def add_to_watchlist(
    ticker: str,
    db: AsyncSession,
    notes: str = None,
    target_price: float = None,
    alert_above: float = None,
    alert_below: float = None,
) -> dict:
    item = Watchlist(
        ticker=ticker.upper(),
        notes=notes,
        target_price=target_price,
        alert_above=alert_above,
        alert_below=alert_below,
        is_active=1,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return {
        "id": item.id,
        "ticker": item.ticker,
        "target_price": item.target_price,
        "alert_above": item.alert_above,
        "alert_below": item.alert_below,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


async def get_watchlist(db: AsyncSession) -> list:
    result = await db.execute(select(Watchlist).where(Watchlist.is_active == 1))
    items = result.scalars().all()
    return [
        {
            "id": item.id,
            "ticker": item.ticker,
            "notes": item.notes,
            "target_price": item.target_price,
            "alert_above": item.alert_above,
            "alert_below": item.alert_below,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in items
    ]


async def check_watchlist_alerts(
    db: AsyncSession,
    send_notifications: bool = True,
) -> list:
    result = await db.execute(select(Watchlist).where(Watchlist.is_active == 1))
    items = result.scalars().all()
    triggered = []

    for item in items:
        current_price = get_current_price(item.ticker)
        if current_price is None:
            continue

        alerts_to_fire = []

        if item.alert_above and current_price >= item.alert_above:
            alerts_to_fire.append(
                {
                    "alert_type": "price_above",
                    "threshold": item.alert_above,
                }
            )

        if item.alert_below and current_price <= item.alert_below:
            alerts_to_fire.append(
                {
                    "alert_type": "price_below",
                    "threshold": item.alert_below,
                }
            )

        if item.target_price:
            pct_diff = abs(current_price - item.target_price) / item.target_price
            if pct_diff <= 0.02:
                alerts_to_fire.append(
                    {
                        "alert_type": "near_target",
                        "threshold": item.target_price,
                    }
                )

        for alert in alerts_to_fire:
            alert_record = WatchlistAlert(
                watchlist_id=item.id,
                ticker=item.ticker,
                alert_type=alert["alert_type"],
                threshold=alert["threshold"],
                triggered_price=current_price,
                triggered_at=datetime.now(),
                notification_sent=0,
            )
            db.add(alert_record)

            notification_sent = False
            if send_notifications:
                message = format_watchlist_alert(
                    ticker=item.ticker,
                    alert_type=alert["alert_type"],
                    current_price=current_price,
                    threshold=alert["threshold"],
                )
                notification = send_telegram_message(message)
                notification_sent = notification.get("sent", False)
                alert_record.notification_sent = 1 if notification_sent else 0

            triggered.append(
                {
                    "ticker": item.ticker,
                    "alert_type": alert["alert_type"],
                    "current_price": current_price,
                    "threshold": alert["threshold"],
                    "notification_sent": notification_sent,
                }
            )

    if triggered:
        await db.commit()

    return triggered
