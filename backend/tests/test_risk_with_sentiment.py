import os
import sys
from unittest.mock import patch

import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def make_mock_analysis():
    return {
        "indicators": {
            "rsi": {
                "value": 65.0,
                "signal": "neutral",
                "direction": "neutral",
                "strength": 0.0,
            },
            "macd": {
                "value": -0.3,
                "signal": "bearish_crossover",
                "direction": "bearish",
                "strength": 0.4,
            },
            "bollinger_bands": {
                "percent_b": 0.75,
                "signal": "near_upper",
                "direction": "bearish",
                "strength": 0.3,
            },
            "ema": {
                "signal": "bullish_trend",
                "direction": "bullish",
                "strength": 0.2,
                "price_vs_ema_short": "above",
                "price_vs_ema_long": "above",
            },
        },
        "latest_price": 150.0,
        "overall_signal": "neutral",
        "composite_score": -0.1,
    }


def test_risk_without_sentiment():
    with patch(
        "app.services.risk_service.analyze_ticker",
        return_value=make_mock_analysis(),
    ):
        from app.services.risk_service import calculate_risk_for_ticker

        result = calculate_risk_for_ticker("AAPL", include_sentiment=False)

    assert result["sentiment_included"] is False
    assert result["sentiment_score"] is None
    assert "risk" in result
    assert 0 <= result["risk"]["score"] <= 100


def test_risk_with_sentiment_positive():
    with patch(
        "app.services.risk_service.analyze_ticker",
        return_value=make_mock_analysis(),
    ):
        with patch(
            "app.services.risk_service.fetch_news",
            return_value=[{"title": "Apple surges", "description": ""}],
        ):
            with patch(
                "app.services.risk_service.analyze_batch_sentiment",
                return_value={"overall_score": 0.7},
            ):
                from app.services.risk_service import calculate_risk_for_ticker

                result = calculate_risk_for_ticker("AAPL", include_sentiment=True)

    assert result["sentiment_included"] is True
    assert result["sentiment_score"] == 0.7


def test_risk_with_sentiment_negative():
    with patch(
        "app.services.risk_service.analyze_ticker",
        return_value=make_mock_analysis(),
    ):
        with patch(
            "app.services.risk_service.fetch_news",
            return_value=[{"title": "Apple crashes", "description": ""}],
        ):
            with patch(
                "app.services.risk_service.analyze_batch_sentiment",
                return_value={"overall_score": -0.8},
            ):
                from app.services.risk_service import calculate_risk_for_ticker

                result = calculate_risk_for_ticker("AAPL", include_sentiment=True)

    assert result["sentiment_included"] is True
    negative_score = result["risk"]["score"]

    with patch(
        "app.services.risk_service.analyze_ticker",
        return_value=make_mock_analysis(),
    ):
        with patch(
            "app.services.risk_service.fetch_news",
            return_value=[{"title": "Apple surges", "description": ""}],
        ):
            with patch(
                "app.services.risk_service.analyze_batch_sentiment",
                return_value={"overall_score": 0.8},
            ):
                result_positive = calculate_risk_for_ticker(
                    "AAPL",
                    include_sentiment=True,
                )

    assert negative_score >= result_positive["risk"]["score"]


def test_risk_sentiment_fetch_failure_graceful():
    with patch(
        "app.services.risk_service.analyze_ticker",
        return_value=make_mock_analysis(),
    ):
        with patch(
            "app.services.risk_service.fetch_news",
            side_effect=Exception("Network error"),
        ):
            from app.services.risk_service import calculate_risk_for_ticker

            result = calculate_risk_for_ticker("AAPL", include_sentiment=True)

    assert result["sentiment_included"] is False
    assert "risk" in result


if __name__ == "__main__":
    tests = [
        test_risk_without_sentiment,
        test_risk_with_sentiment_positive,
        test_risk_with_sentiment_negative,
        test_risk_sentiment_fetch_failure_graceful,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
