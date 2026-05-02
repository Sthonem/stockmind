import asyncio
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.portfolio_risk import calculate_portfolio_risk_summary


def make_mock_position(id, ticker, shares, avg_buy_price):
    p = MagicMock()
    p.id = id
    p.ticker = ticker
    p.shares = shares
    p.avg_buy_price = avg_buy_price
    return p


async def mock_get_latest_risk(position_id, db):
    scores = {1: 75.0, 2: 45.0, 3: 20.0}
    score = scores.get(position_id)
    if score is None:
        return None
    return {
        "score": score,
        "rsi": 65.0,
        "macd": -0.5,
        "bb_percent_b": 0.8,
        "sentiment": None,
        "notes": "test",
        "created_at": "2025-01-01T00:00:00",
    }


def test_portfolio_risk_summary_structure():
    async def run():
        mock_db = AsyncMock()
        mock_positions = [
            make_mock_position(1, "AAPL", 10, 150.0),
            make_mock_position(2, "NVDA", 5, 400.0),
            make_mock_position(3, "TSLA", 8, 200.0),
        ]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_positions
        mock_db.execute = AsyncMock(return_value=mock_result)

        with patch(
            "app.services.portfolio_risk.get_latest_risk_score",
            side_effect=mock_get_latest_risk,
        ):
            result = await calculate_portfolio_risk_summary(1, mock_db)

        assert "portfolio_risk_score" in result
        assert "portfolio_risk_level" in result
        assert "total_positions" in result
        assert "positions" in result
        assert result["total_positions"] == 3
        assert result["scored_positions"] == 3

    asyncio.run(run())


def test_portfolio_risk_levels_assigned():
    async def run():
        mock_db = AsyncMock()
        mock_positions = [
            make_mock_position(1, "AAPL", 10, 150.0),
            make_mock_position(2, "NVDA", 5, 400.0),
            make_mock_position(3, "TSLA", 8, 200.0),
        ]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_positions
        mock_db.execute = AsyncMock(return_value=mock_result)

        with patch(
            "app.services.portfolio_risk.get_latest_risk_score",
            side_effect=mock_get_latest_risk,
        ):
            result = await calculate_portfolio_risk_summary(1, mock_db)

        assert "AAPL" in result["high_risk_positions"]
        assert "NVDA" in result["medium_risk_positions"]
        assert "TSLA" in result["low_risk_positions"]

    asyncio.run(run())


def test_portfolio_no_positions():
    async def run():
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await calculate_portfolio_risk_summary(1, mock_db)
        assert "error" in result

    asyncio.run(run())


if __name__ == "__main__":
    tests = [
        test_portfolio_risk_summary_structure,
        test_portfolio_risk_levels_assigned,
        test_portfolio_no_positions,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
