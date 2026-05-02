import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Position, RiskScore
from app.services.market_data import get_current_price, get_ohlcv
from app.services.stop_loss import analyze_stop_loss_for_ticker
from app.services.telegram import format_risk_alert, send_telegram_message

logger = logging.getLogger(__name__)

DEFAULT_RISK_THRESHOLD = 70.0
DEFAULT_MEDIUM_THRESHOLD = 40.0


async def get_latest_risk_score(position_id: int, db: AsyncSession) -> float | None:
    from sqlalchemy import desc

    result = await db.execute(
        select(RiskScore)
        .where(RiskScore.position_id == position_id)
        .order_by(desc(RiskScore.created_at))
        .limit(1)
    )
    row = result.scalar_one_or_none()
    return row.score if row else None


async def check_and_alert_position(
    position: Position,
    db: AsyncSession,
    risk_threshold: float = DEFAULT_RISK_THRESHOLD,
    send_notification: bool = True,
) -> dict:
    risk_score = await get_latest_risk_score(position.id, db)

    if risk_score is None:
        return {
            "position_id": position.id,
            "ticker": position.ticker,
            "alert_triggered": False,
            "alert_sent": False,
            "reason": "No risk score available — run risk calculation first",
        }

    alert_triggered = risk_score >= risk_threshold
    risk_level = "high" if risk_score >= 70 else "medium" if risk_score >= 40 else "low"

    result = {
        "position_id": position.id,
        "ticker": position.ticker,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "threshold": risk_threshold,
        "alert_triggered": alert_triggered,
        "alert_sent": False,
        "checked_at": datetime.now().isoformat(),
    }

    if not alert_triggered:
        result["reason"] = f"Risk score {risk_score} below threshold {risk_threshold}"
        return result

    stop_loss_price = None
    current_price = get_current_price(position.ticker)

    if current_price:
        try:
            df = get_ohlcv(position.ticker, period="6mo")
            stop_loss_data = analyze_stop_loss_for_ticker(
                df=df,
                risk_score=risk_score,
                avg_buy_price=position.avg_buy_price,
            )
            stop_loss_price = stop_loss_data["stop_loss_price"]
        except Exception as e:
            logger.warning(f"Stop-loss calc failed for {position.ticker}: {e}")

    if send_notification:
        message = format_risk_alert(
            ticker=position.ticker,
            risk_score=risk_score,
            risk_level=risk_level,
            stop_loss=stop_loss_price or 0.0,
            current_price=current_price or 0.0,
            recommendation=f"Risk score exceeded threshold of {risk_threshold}",
        )
        notification = send_telegram_message(message)
        result["alert_sent"] = notification.get("sent", False)
        result["notification_result"] = notification
    else:
        result["alert_sent"] = False
        result["reason"] = "Notifications disabled"

    result["stop_loss_price"] = stop_loss_price
    result["current_price"] = current_price
    return result


async def check_portfolio_alerts(
    portfolio_id: int,
    db: AsyncSession,
    risk_threshold: float = DEFAULT_RISK_THRESHOLD,
    send_notifications: bool = True,
) -> dict:
    result = await db.execute(
        select(Position).where(Position.portfolio_id == portfolio_id)
    )
    positions = result.scalars().all()

    if not positions:
        return {"error": "No positions found", "portfolio_id": portfolio_id}

    alert_results = []
    triggered_count = 0
    sent_count = 0

    for position in positions:
        check = await check_and_alert_position(
            position=position,
            db=db,
            risk_threshold=risk_threshold,
            send_notification=send_notifications,
        )
        alert_results.append(check)
        if check.get("alert_triggered"):
            triggered_count += 1
        if check.get("alert_sent"):
            sent_count += 1

    return {
        "portfolio_id": portfolio_id,
        "positions_checked": len(positions),
        "alerts_triggered": triggered_count,
        "notifications_sent": sent_count,
        "threshold_used": risk_threshold,
        "results": alert_results,
        "checked_at": datetime.now().isoformat(),
    }
