import os
import sys
from unittest.mock import patch

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.signal_validation import (
    evaluate_macd_signals,
    evaluate_rsi_signals,
    validate_signals_for_ticker,
)


def make_trending_df(n: int = 252) -> pd.DataFrame:
    np.random.seed(42)
    dates = pd.date_range("2024-01-01", periods=n, freq="B")
    prices = 100 * np.cumprod(1 + np.random.randn(n) * 0.015)
    return pd.DataFrame(
        {
            "open": prices * 0.999,
            "high": prices * 1.01,
            "low": prices * 0.99,
            "close": prices,
            "volume": [1000000.0] * n,
        },
        index=dates,
    )


def test_rsi_signals_structure():
    df = make_trending_df()
    result = evaluate_rsi_signals(df, forward_days=5)
    assert "overbought" in result
    assert "oversold" in result
    assert "forward_days" in result
    assert result["forward_days"] == 5


def test_rsi_signal_accuracy_range():
    df = make_trending_df()
    result = evaluate_rsi_signals(df, forward_days=5)
    for section in [result["overbought"], result["oversold"]]:
        if section["accuracy"] is not None:
            assert 0 <= section["accuracy"] <= 100


def test_macd_signals_structure():
    df = make_trending_df()
    result = evaluate_macd_signals(df, forward_days=5)
    assert "bullish_crossover" in result
    assert "bearish_crossover" in result


def test_macd_signal_accuracy_range():
    df = make_trending_df()
    result = evaluate_macd_signals(df, forward_days=5)
    for section in [result["bullish_crossover"], result["bearish_crossover"]]:
        if section["accuracy"] is not None:
            assert 0 <= section["accuracy"] <= 100


def test_validate_signals_structure():
    df = make_trending_df()
    with patch("app.services.signal_validation.get_ohlcv", return_value=df):
        result = validate_signals_for_ticker("AAPL", period="1y", forward_days=5)

    assert "ticker" in result
    assert "rsi_signals" in result
    assert "macd_signals" in result
    assert "overall_accuracy" in result
    assert "reliability" in result


def test_reliability_categories():
    df = make_trending_df()
    with patch("app.services.signal_validation.get_ohlcv", return_value=df):
        result = validate_signals_for_ticker("AAPL")

    assert result["reliability"] in ["reliable", "moderate", "unreliable", "unknown"]


def test_validate_error_graceful():
    with patch(
        "app.services.signal_validation.get_ohlcv",
        side_effect=Exception("Yahoo timeout"),
    ):
        result = validate_signals_for_ticker("AAPL")

    assert "error" in result
    assert result["ticker"] == "AAPL"


def test_data_points_recorded():
    df = make_trending_df(252)
    with patch("app.services.signal_validation.get_ohlcv", return_value=df):
        result = validate_signals_for_ticker("AAPL")

    assert result["data_points"] == 252


if __name__ == "__main__":
    tests = [
        test_rsi_signals_structure,
        test_rsi_signal_accuracy_range,
        test_macd_signals_structure,
        test_macd_signal_accuracy_range,
        test_validate_signals_structure,
        test_reliability_categories,
        test_validate_error_graceful,
        test_data_points_recorded,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
