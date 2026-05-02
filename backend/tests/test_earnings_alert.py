import asyncio
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.earnings_alert import (
    calculate_earnings_risk_adjustment,
    check_earnings_alerts_for_portfolio,
)


def make_mock_position(ticker: str, portfolio_id: int = 1):
    p = MagicMock()
    p.ticker = ticker
    p.portfolio_id = portfolio_id
    p.shares = 10.0
    p.avg_buy_price = 150.0
    return p


def make_earnings_history(surprises: list) -> list:
    history = []
    for i, surprise in enumerate(surprises):
        beat = surprise > 0
        history.append(
            {
                "date": f"2024-0{i + 1}-01",
                "eps_estimate": 2.0,
                "eps_actual": 2.0 * (1 + surprise / 100),
                "beat_estimate": beat,
                "surprise_pct": surprise,
            }
        )
    return history


def test_high_surprise_history():
    history = make_earnings_history([15.0, -12.0, 18.0, -10.0])
    result = calculate_earnings_risk_adjustment(
        days_until=10,
        earnings_history=history,
    )
    assert result["adjustment"] >= 1.3
    assert result["avg_surprise_pct"] > 10


def test_low_surprise_history():
    history = make_earnings_history([2.0, -1.5, 3.0, 1.0])
    result = calculate_earnings_risk_adjustment(
        days_until=10,
        earnings_history=history,
    )
    assert result["adjustment"] <= 1.2


def test_imminent_earnings_amplifies():
    history = make_earnings_history([5.0, -4.0, 6.0])
    normal = calculate_earnings_risk_adjustment(
        days_until=10,
        earnings_history=history,
    )
    imminent = calculate_earnings_risk_adjustment(
        days_until=2,
        earnings_history=history,
    )
    assert imminent["adjustment"] >= normal["adjustment"]


def test_no_history_default():
    result = calculate_earnings_risk_adjustment(days_until=5, earnings_history=[])
    assert result["adjustment"] == 1.2
    assert "default" in result["reason"].lower()


def test_beat_rate_calculated():
    history = make_earnings_history([5.0, 3.0, -2.0, 4.0])
    result = calculate_earnings_risk_adjustment(
        days_until=10,
        earnings_history=history,
    )
    assert "beat_rate" in result
    assert result["beat_rate"] == 75.0


def test_check_earnings_no_upcoming():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_position("AAPL")
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        with patch(
            "app.services.earnings_alert.get_earnings_info",
            return_value={"urgency": "none"},
        ):
            alerts = await check_earnings_alerts_for_portfolio(1, mock_db, False)

        assert len(alerts) == 0

    asyncio.run(run())


def test_check_earnings_critical_included():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_position("AAPL")
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        mock_earnings = {
            "urgency": "critical",
            "company_name": "Apple Inc",
            "days_until_earnings": 2,
            "eps_estimate": 2.5,
        }

        with patch(
            "app.services.earnings_alert.get_earnings_info",
            return_value=mock_earnings,
        ):
            with patch(
                "app.services.earnings_alert.get_earnings_history",
                return_value=[],
            ):
                alerts = await check_earnings_alerts_for_portfolio(
                    1,
                    mock_db,
                    send_notifications=False,
                )

        assert len(alerts) == 1
        assert alerts[0]["ticker"] == "AAPL"
        assert alerts[0]["urgency"] == "critical"

    asyncio.run(run())


def test_alert_structure():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            make_mock_position("NVDA")
        ]
        mock_db.execute = AsyncMock(return_value=mock_result)

        mock_earnings = {
            "urgency": "high",
            "company_name": "NVIDIA Corp",
            "days_until_earnings": 6,
            "eps_estimate": 5.0,
        }
        mock_history = make_earnings_history([8.0, -5.0, 10.0])

        with patch(
            "app.services.earnings_alert.get_earnings_info",
            return_value=mock_earnings,
        ):
            with patch(
                "app.services.earnings_alert.get_earnings_history",
                return_value=mock_history,
            ):
                alerts = await check_earnings_alerts_for_portfolio(
                    1,
                    mock_db,
                    send_notifications=False,
                )

        assert len(alerts) == 1
        alert = alerts[0]
        assert "ticker" in alert
        assert "days_until_earnings" in alert
        assert "risk_adjustment" in alert
        assert "beat_rate" in alert

    asyncio.run(run())


if __name__ == "__main__":
    tests = [
        test_high_surprise_history,
        test_low_surprise_history,
        test_imminent_earnings_amplifies,
        test_no_history_default,
        test_beat_rate_calculated,
        test_check_earnings_no_upcoming,
        test_check_earnings_critical_included,
        test_alert_structure,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
