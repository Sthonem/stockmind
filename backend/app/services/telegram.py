import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

TELEGRAM_API_BASE = "https://api.telegram.org/bot"


def send_telegram_message(
    message: str,
    chat_id: str = None,
    parse_mode: str = "HTML",
) -> dict:
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set — skipping notification")
        return {"sent": False, "reason": "TELEGRAM_BOT_TOKEN not configured"}

    target_chat_id = chat_id or settings.TELEGRAM_CHAT_ID
    if not target_chat_id:
        return {
            "sent": False,
            "reason": "No chat_id provided and TELEGRAM_CHAT_ID not set",
        }

    url = f"{TELEGRAM_API_BASE}{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": target_chat_id,
        "text": message,
        "parse_mode": parse_mode,
        "disable_web_page_preview": True,
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(url, json=payload)
            response.raise_for_status()
            return {"sent": True, "response": response.json()}

    except httpx.HTTPStatusError as e:
        logger.error(f"Telegram HTTP error: {e.response.status_code} — {e.response.text}")
        return {"sent": False, "error": str(e)}
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        return {"sent": False, "error": str(e)}


def format_risk_alert(
    ticker: str,
    risk_score: float,
    risk_level: str,
    stop_loss: float,
    current_price: float,
    recommendation: str,
) -> str:
    emoji = "🔴" if risk_level == "high" else "🟡" if risk_level == "medium" else "🟢"
    return (
        f"{emoji} <b>StockMind Risk Alert</b>\n\n"
        f"<b>Ticker:</b> {ticker}\n"
        f"<b>Risk Score:</b> {risk_score}/100 ({risk_level.upper()})\n"
        f"<b>Current Price:</b> ${current_price:.2f}\n"
        f"<b>Stop-Loss:</b> ${stop_loss:.2f}\n\n"
        f"<b>Recommendation:</b> {recommendation}"
    )


def format_daily_summary(
    date: str,
    portfolio_score: float,
    portfolio_level: str,
    high_risk_tickers: list,
    summary_text: str,
) -> str:
    emoji = (
        "🔴" if portfolio_level == "high" else "🟡" if portfolio_level == "medium" else "🟢"
    )
    tickers_line = ", ".join(high_risk_tickers) if high_risk_tickers else "None"
    short_summary = summary_text[:400] + "..." if len(summary_text) > 400 else summary_text

    return (
        f"📊 <b>StockMind Daily Briefing</b> — {date}\n\n"
        f"{emoji} <b>Portfolio Risk:</b> {portfolio_score}/100 ({portfolio_level.upper()})\n"
        f"⚠️ <b>High Risk Positions:</b> {tickers_line}\n\n"
        f"{short_summary}"
    )


def format_earnings_alert(
    ticker: str,
    company_name: str,
    days_until: int,
    urgency: str,
) -> str:
    emoji = "🚨" if urgency == "critical" else "⚠️" if urgency == "high" else "📅"
    return (
        f"{emoji} <b>Earnings Alert</b>\n\n"
        f"<b>{company_name} ({ticker})</b>\n"
        f"Earnings in <b>{days_until} days</b>\n"
        f"Urgency: {urgency.upper()}\n\n"
        f"Consider reviewing your position before the report."
    )


def format_watchlist_alert(
    ticker: str,
    alert_type: str,
    current_price: float,
    threshold: float,
) -> str:
    direction = "above" if current_price >= threshold else "below"
    return (
        f"👀 <b>Watchlist Alert</b>\n\n"
        f"<b>{ticker}</b> is now <b>{direction}</b> your target\n"
        f"Current: ${current_price:.2f}\n"
        f"Target: ${threshold:.2f}\n"
        f"Alert type: {alert_type}"
    )
