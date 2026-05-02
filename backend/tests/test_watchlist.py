import asyncio
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.watchlist import check_watchlist_alerts


def make_mock_watchlist_item(
    id=1,
    ticker="AAPL",
    alert_above=200.0,
    alert_below=150.0,
    target_price=180.0,
):
    item = MagicMock()
    item.id = id
    item.ticker = ticker
    item.alert_above = alert_above
    item.alert_below = alert_below
    item.target_price = target_price
    item.is_active = 1
    return item


def test_price_above_triggers_alert():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_watchlist_item(
                alert_above=200.0,
                alert_below=None,
                target_price=None,
            )
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()

        with patch("app.services.watchlist.get_current_price", return_value=205.0):
            triggered = await check_watchlist_alerts(mock_db, send_notifications=False)

        assert len(triggered) == 1
        assert triggered[0]["alert_type"] == "price_above"

    asyncio.run(run())


def test_price_below_triggers_alert():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_watchlist_item(
                alert_above=None,
                alert_below=150.0,
                target_price=None,
            )
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()

        with patch("app.services.watchlist.get_current_price", return_value=145.0):
            triggered = await check_watchlist_alerts(mock_db, send_notifications=False)

        assert len(triggered) == 1
        assert triggered[0]["alert_type"] == "price_below"

    asyncio.run(run())


def test_no_alert_when_price_in_range():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_watchlist_item(
                alert_above=200.0,
                alert_below=150.0,
                target_price=None,
            )
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()

        with patch("app.services.watchlist.get_current_price", return_value=175.0):
            triggered = await check_watchlist_alerts(mock_db, send_notifications=False)

        assert len(triggered) == 0

    asyncio.run(run())


def test_near_target_triggers_alert():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_watchlist_item(
                alert_above=None,
                alert_below=None,
                target_price=180.0,
            )
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()

        with patch("app.services.watchlist.get_current_price", return_value=181.0):
            triggered = await check_watchlist_alerts(mock_db, send_notifications=False)

        assert len(triggered) == 1
        assert triggered[0]["alert_type"] == "near_target"

    asyncio.run(run())


def test_no_price_data_skipped():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_watchlist_item()
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        with patch("app.services.watchlist.get_current_price", return_value=None):
            triggered = await check_watchlist_alerts(mock_db, send_notifications=False)

        assert len(triggered) == 0

    asyncio.run(run())


if __name__ == "__main__":
    tests = [
        test_price_above_triggers_alert,
        test_price_below_triggers_alert,
        test_no_alert_when_price_in_range,
        test_near_target_triggers_alert,
        test_no_price_data_skipped,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
