import asyncio
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.daily_notification import (
    send_daily_portfolio_notification,
    send_earnings_notifications,
)


def make_mock_position(ticker: str, portfolio_id: int = 1):
    p = MagicMock()
    p.ticker = ticker
    p.portfolio_id = portfolio_id
    p.shares = 10.0
    p.avg_buy_price = 150.0
    return p


def test_no_positions_returns_not_sent():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await send_daily_portfolio_notification(1, mock_db)
        assert result["sent"] is False
        assert "No positions" in result["reason"]

    asyncio.run(run())


def test_daily_notification_mock_sent():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_position("AAPL"),
            make_mock_position("NVDA"),
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        mock_risk = {
            "portfolio_risk_score": 55.0,
            "portfolio_risk_level": "medium",
            "high_risk_positions": ["NVDA"],
        }
        mock_daily = {"summary": "Market is volatile. Bottom line: Stay cautious."}
        mock_notification = {"sent": True}

        with patch(
            "app.services.daily_notification.calculate_portfolio_risk_summary",
            return_value=mock_risk,
        ):
            with patch(
                "app.services.daily_notification.generate_daily_summary",
                return_value=mock_daily,
            ):
                with patch(
                    "app.services.daily_notification.send_telegram_message",
                    return_value=mock_notification,
                ):
                    result = await send_daily_portfolio_notification(1, mock_db)

        assert result["sent"] is True
        assert result["portfolio_score"] == 55.0
        assert result["high_risk_count"] == 1

    asyncio.run(run())


def test_daily_notification_error_graceful():
    async def run():
        mock_db = AsyncMock()
        mock_db.execute = AsyncMock(side_effect=Exception("DB error"))

        result = await send_daily_portfolio_notification(1, mock_db)
        assert result["sent"] is False
        assert "error" in result

    asyncio.run(run())


def test_earnings_notifications_critical():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_position("AAPL"),
            make_mock_position("NVDA"),
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        def mock_earnings(ticker):
            if ticker == "AAPL":
                return {
                    "urgency": "critical",
                    "company_name": "Apple Inc",
                    "days_until_earnings": 2,
                }
            return {"urgency": "none"}

        with patch(
            "app.services.daily_notification.get_earnings_info",
            side_effect=mock_earnings,
        ):
            with patch(
                "app.services.daily_notification.send_telegram_message",
                return_value={"sent": True},
            ):
                results = await send_earnings_notifications(mock_db)

        assert len(results) == 1
        assert results[0]["ticker"] == "AAPL"
        assert results[0]["urgency"] == "critical"

    asyncio.run(run())


def test_earnings_notifications_no_urgent():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [make_mock_position("AAPL")]
        mock_db.execute = AsyncMock(return_value=mock_result)

        with patch(
            "app.services.daily_notification.get_earnings_info",
            return_value={"urgency": "none"},
        ):
            results = await send_earnings_notifications(mock_db)

        assert len(results) == 0

    asyncio.run(run())


if __name__ == "__main__":
    tests = [
        test_no_positions_returns_not_sent,
        test_daily_notification_mock_sent,
        test_daily_notification_error_graceful,
        test_earnings_notifications_critical,
        test_earnings_notifications_no_urgent,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
