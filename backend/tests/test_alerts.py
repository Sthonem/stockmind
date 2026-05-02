import asyncio
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.alerts import check_and_alert_position, check_portfolio_alerts


def make_mock_position(id=1, ticker="AAPL", shares=10, avg_buy=150.0):
    p = MagicMock()
    p.id = id
    p.ticker = ticker
    p.shares = shares
    p.avg_buy_price = avg_buy
    p.portfolio_id = 1
    return p


def test_no_risk_score_no_alert():
    async def run():
        mock_db = AsyncMock()
        position = make_mock_position()

        with patch("app.services.alerts.get_latest_risk_score", return_value=None):
            result = await check_and_alert_position(
                position=position,
                db=mock_db,
                risk_threshold=70.0,
                send_notification=False,
            )

        assert result["alert_triggered"] is False
        assert result["alert_sent"] is False

    asyncio.run(run())


def test_below_threshold_no_alert():
    async def run():
        mock_db = AsyncMock()
        position = make_mock_position()

        with patch("app.services.alerts.get_latest_risk_score", return_value=45.0):
            result = await check_and_alert_position(
                position=position,
                db=mock_db,
                risk_threshold=70.0,
                send_notification=False,
            )

        assert result["alert_triggered"] is False
        assert result["risk_score"] == 45.0

    asyncio.run(run())


def test_above_threshold_triggers_alert():
    async def run():
        mock_db = AsyncMock()
        position = make_mock_position()

        with patch("app.services.alerts.get_latest_risk_score", return_value=78.0):
            with patch("app.services.alerts.get_current_price", return_value=None):
                result = await check_and_alert_position(
                    position=position,
                    db=mock_db,
                    risk_threshold=70.0,
                    send_notification=False,
                )

        assert result["alert_triggered"] is True
        assert result["risk_score"] == 78.0
        assert result["risk_level"] == "high"

    asyncio.run(run())


def test_notification_sent_when_enabled():
    async def run():
        mock_db = AsyncMock()
        position = make_mock_position()
        mock_notification = {"sent": True}

        with patch("app.services.alerts.get_latest_risk_score", return_value=75.0):
            with patch("app.services.alerts.get_current_price", return_value=160.0):
                with patch(
                    "app.services.alerts.get_ohlcv",
                    side_effect=Exception("no data"),
                ):
                    with patch(
                        "app.services.alerts.send_telegram_message",
                        return_value=mock_notification,
                    ):
                        result = await check_and_alert_position(
                            position=position,
                            db=mock_db,
                            risk_threshold=70.0,
                            send_notification=True,
                        )

        assert result["alert_triggered"] is True
        assert result["alert_sent"] is True

    asyncio.run(run())


def test_portfolio_check_structure():
    async def run():
        mock_db = AsyncMock()
        positions = [
            make_mock_position(1, "AAPL", 10, 150.0),
            make_mock_position(2, "NVDA", 5, 400.0),
        ]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = positions
        mock_db.execute = AsyncMock(return_value=mock_result)

        with patch("app.services.alerts.get_latest_risk_score", return_value=45.0):
            result = await check_portfolio_alerts(
                portfolio_id=1,
                db=mock_db,
                risk_threshold=70.0,
                send_notifications=False,
            )

        assert "positions_checked" in result
        assert "alerts_triggered" in result
        assert "notifications_sent" in result
        assert result["positions_checked"] == 2
        assert result["alerts_triggered"] == 0

    asyncio.run(run())


def test_portfolio_no_positions():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await check_portfolio_alerts(1, mock_db)
        assert "error" in result

    asyncio.run(run())


if __name__ == "__main__":
    tests = [
        test_no_risk_score_no_alert,
        test_below_threshold_no_alert,
        test_above_threshold_triggers_alert,
        test_notification_sent_when_enabled,
        test_portfolio_check_structure,
        test_portfolio_no_positions,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
