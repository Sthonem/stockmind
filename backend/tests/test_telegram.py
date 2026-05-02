import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.telegram import (
    format_daily_summary,
    format_earnings_alert,
    format_risk_alert,
    format_watchlist_alert,
    send_telegram_message,
)


def test_no_token_returns_not_sent():
    with patch("app.services.telegram.settings") as mock_settings:
        mock_settings.TELEGRAM_BOT_TOKEN = ""
        mock_settings.TELEGRAM_CHAT_ID = ""
        result = send_telegram_message("Test message")
    assert result["sent"] is False
    assert "TELEGRAM_BOT_TOKEN" in result["reason"]


def test_no_chat_id_returns_not_sent():
    with patch("app.services.telegram.settings") as mock_settings:
        mock_settings.TELEGRAM_BOT_TOKEN = "fake_token"
        mock_settings.TELEGRAM_CHAT_ID = ""
        result = send_telegram_message("Test message")
    assert result["sent"] is False


def test_send_message_mock_success():
    mock_response = MagicMock()
    mock_response.json.return_value = {"ok": True, "result": {"message_id": 123}}
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.telegram.settings") as mock_settings:
        mock_settings.TELEGRAM_BOT_TOKEN = "fake_token"
        mock_settings.TELEGRAM_CHAT_ID = "123456"
        with patch("httpx.Client") as mock_client:
            mock_client.return_value.__enter__.return_value.post.return_value = (
                mock_response
            )
            result = send_telegram_message("Hello StockMind!")

    assert result["sent"] is True


def test_format_risk_alert_high():
    msg = format_risk_alert(
        ticker="NVDA",
        risk_score=75.0,
        risk_level="high",
        stop_loss=480.0,
        current_price=510.0,
        recommendation="Consider reducing position",
    )
    assert "NVDA" in msg
    assert "75.0" in msg
    assert "HIGH" in msg
    assert "480.00" in msg
    assert "🔴" in msg


def test_format_risk_alert_low():
    msg = format_risk_alert(
        ticker="AAPL",
        risk_score=25.0,
        risk_level="low",
        stop_loss=170.0,
        current_price=185.0,
        recommendation="Position looks stable",
    )
    assert "🟢" in msg
    assert "LOW" in msg


def test_format_daily_summary():
    msg = format_daily_summary(
        date="2025-01-15",
        portfolio_score=62.0,
        portfolio_level="medium",
        high_risk_tickers=["TSLA", "NVDA"],
        summary_text="Market is volatile today with tech stocks leading losses.",
    )
    assert "2025-01-15" in msg
    assert "TSLA" in msg
    assert "NVDA" in msg
    assert "62.0" in msg


def test_format_earnings_alert_critical():
    msg = format_earnings_alert(
        ticker="AAPL",
        company_name="Apple Inc",
        days_until=2,
        urgency="critical",
    )
    assert "🚨" in msg
    assert "AAPL" in msg
    assert "2 days" in msg
    assert "CRITICAL" in msg


def test_format_watchlist_alert():
    msg = format_watchlist_alert(
        ticker="TSLA",
        alert_type="price_above",
        current_price=255.0,
        threshold=250.0,
    )
    assert "TSLA" in msg
    assert "above" in msg
    assert "255.00" in msg


if __name__ == "__main__":
    tests = [
        test_no_token_returns_not_sent,
        test_no_chat_id_returns_not_sent,
        test_send_message_mock_success,
        test_format_risk_alert_high,
        test_format_risk_alert_low,
        test_format_daily_summary,
        test_format_earnings_alert_critical,
        test_format_watchlist_alert,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
