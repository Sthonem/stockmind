import asyncio
import os
import sys
from unittest.mock import AsyncMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def make_mock_portfolio():
    return {
        "portfolio_id": 1,
        "portfolio_risk_score": 55.0,
        "portfolio_risk_level": "medium",
        "portfolio_note": "Monitor closely",
        "high_risk_positions": ["NVDA"],
        "medium_risk_positions": ["AAPL"],
        "low_risk_positions": [],
        "total_positions": 2,
        "scored_positions": 2,
        "positions": [
            {
                "ticker": "AAPL",
                "risk_score": 45.0,
                "risk_level": "medium",
                "avg_buy_price": 175.0,
                "estimated_value": 1750.0,
            },
            {
                "ticker": "NVDA",
                "risk_score": 72.0,
                "risk_level": "high",
                "avg_buy_price": 400.0,
                "estimated_value": 2000.0,
            },
        ],
    }


def test_full_portfolio_context_contains_tickers():
    async def run():
        mock_db = AsyncMock()
        with patch(
            "app.services.context_builder.calculate_portfolio_risk_summary",
            return_value=make_mock_portfolio(),
        ):
            with patch(
                "app.services.context_builder.get_latest_sentiment",
                return_value=None,
            ):
                with patch(
                    "app.services.context_builder.get_ohlcv",
                    side_effect=Exception("no data"),
                ):
                    from app.services.context_builder import build_full_portfolio_context

                    context = await build_full_portfolio_context(1, mock_db)

        assert "AAPL" in context
        assert "NVDA" in context
        assert "55.0" in context

    asyncio.run(run())


def test_full_portfolio_context_high_risk_flagged():
    async def run():
        mock_db = AsyncMock()
        with patch(
            "app.services.context_builder.calculate_portfolio_risk_summary",
            return_value=make_mock_portfolio(),
        ):
            with patch(
                "app.services.context_builder.get_latest_sentiment",
                return_value=None,
            ):
                with patch(
                    "app.services.context_builder.get_ohlcv",
                    side_effect=Exception("no data"),
                ):
                    from app.services.context_builder import build_full_portfolio_context

                    context = await build_full_portfolio_context(1, mock_db)

        assert "HIGH RISK" in context
        assert "NVDA" in context

    asyncio.run(run())


def test_full_portfolio_context_with_sentiment():
    async def run():
        mock_db = AsyncMock()
        mock_sentiment = {
            "overall_sentiment": "negative",
            "overall_score": -0.6,
            "urgent_count": 2,
            "created_at": "2025-01-01T00:00:00",
        }
        with patch(
            "app.services.context_builder.calculate_portfolio_risk_summary",
            return_value=make_mock_portfolio(),
        ):
            with patch(
                "app.services.context_builder.get_latest_sentiment",
                return_value=mock_sentiment,
            ):
                with patch(
                    "app.services.context_builder.get_ohlcv",
                    side_effect=Exception("no data"),
                ):
                    from app.services.context_builder import build_full_portfolio_context

                    context = await build_full_portfolio_context(1, mock_db)

        assert "negative" in context
        assert "URGENT" in context

    asyncio.run(run())


def test_portfolio_context_error_handling():
    async def run():
        mock_db = AsyncMock()
        with patch(
            "app.services.context_builder.calculate_portfolio_risk_summary",
            side_effect=Exception("DB error"),
        ):
            from app.services.context_builder import build_full_portfolio_context

            context = await build_full_portfolio_context(1, mock_db)

        assert "unavailable" in context.lower()

    asyncio.run(run())


if __name__ == "__main__":
    tests = [
        test_full_portfolio_context_contains_tickers,
        test_full_portfolio_context_high_risk_flagged,
        test_full_portfolio_context_with_sentiment,
        test_portfolio_context_error_handling,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
