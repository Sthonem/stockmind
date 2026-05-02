import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.indicators import (
    analyze_bollinger_bands,
    analyze_ema,
    analyze_macd,
    analyze_rsi,
    calculate_bollinger_bands,
    calculate_ema,
    calculate_macd,
    calculate_rsi,
    get_bb_signal,
    get_macd_signal,
    get_rsi_signal,
)
from app.services.technical_analysis import analyze_ticker, direction_to_score


def test_rsi_overbought():
    closes = pd.Series([float(i) for i in range(50, 100)])
    rsi = calculate_rsi(closes)
    latest = rsi.dropna().iloc[-1]
    assert latest > 70, f"Expected overbought RSI, got {latest}"


def test_rsi_oversold():
    closes = pd.Series([float(i) for i in range(100, 50, -1)])
    rsi = calculate_rsi(closes)
    latest = rsi.dropna().iloc[-1]
    assert latest < 30, f"Expected oversold RSI, got {latest}"


def test_rsi_signal_overbought():
    result = get_rsi_signal(75.0)
    assert result["signal"] == "overbought"
    assert result["direction"] == "bearish"


def test_rsi_signal_oversold():
    result = get_rsi_signal(25.0)
    assert result["signal"] == "oversold"
    assert result["direction"] == "bullish"


def test_rsi_signal_neutral():
    result = get_rsi_signal(50.0)
    assert result["signal"] == "neutral"


def test_analyze_rsi_structure():
    closes = pd.Series([float(i) for i in range(50, 120)])
    result = analyze_rsi(closes)
    assert "rsi" in result
    assert "signal" in result
    assert "direction" in result
    assert "history" in result
    assert len(result["history"]) > 0


def test_macd_bullish():
    closes = pd.Series([float(i) for i in range(50, 150)])
    result = calculate_macd(closes)
    hist = result["histogram"].dropna().iloc[-1]
    assert hist > 0, f"Expected positive histogram, got {hist}"


def test_macd_bearish():
    closes = pd.Series([float(i) for i in range(150, 50, -1)])
    result = calculate_macd(closes)
    hist = result["histogram"].dropna().iloc[-1]
    assert hist < 0, f"Expected negative histogram, got {hist}"


def test_macd_signal_bullish():
    result = get_macd_signal(1.5, 0.8, 0.7)
    assert result["signal"] == "bullish_crossover"
    assert result["direction"] == "bullish"


def test_macd_signal_bearish():
    result = get_macd_signal(-1.5, -0.8, -0.7)
    assert result["signal"] == "bearish_crossover"
    assert result["direction"] == "bearish"


def test_analyze_macd_structure():
    closes = pd.Series([float(i) for i in range(50, 150)])
    result = analyze_macd(closes)
    assert "macd" in result
    assert "signal" in result
    assert "histogram" in result
    assert "history" in result
    assert len(result["history"]) > 0


def test_bb_bands_structure():
    closes = pd.Series([float(i) for i in range(50, 150)])
    result = calculate_bollinger_bands(closes)
    assert "upper" in result
    assert "middle" in result
    assert "lower" in result
    upper = result["upper"].dropna()
    lower = result["lower"].dropna()
    assert (upper > lower).all(), "Upper band should always be above lower band"


def test_bb_signal_above_upper():
    result = get_bb_signal(price=110.0, upper=105.0, lower=90.0, middle=97.5)
    assert result["signal"] == "above_upper"
    assert result["direction"] == "bearish"


def test_bb_signal_below_lower():
    result = get_bb_signal(price=85.0, upper=105.0, lower=90.0, middle=97.5)
    assert result["signal"] == "below_lower"
    assert result["direction"] == "bullish"


def test_bb_signal_neutral():
    result = get_bb_signal(price=97.5, upper=105.0, lower=90.0, middle=97.5)
    assert result["signal"] == "within_bands"
    assert result["direction"] == "neutral"


def test_analyze_bb_structure():
    closes = pd.Series([float(i) for i in range(50, 150)])
    result = analyze_bollinger_bands(closes)
    assert "upper" in result
    assert "lower" in result
    assert "percent_b" in result
    assert "history" in result
    assert len(result["history"]) > 0


def test_ema_length():
    closes = pd.Series([float(i) for i in range(1, 101)])
    ema = calculate_ema(closes, period=20)
    assert len(ema) == len(closes), "EMA length should match input length"


def test_ema_bullish_trend():
    closes = pd.Series([float(i) for i in range(50, 150)])
    result = analyze_ema(closes, short=20, long=50)
    assert result["direction"] == "bullish"


def test_ema_bearish_trend():
    closes = pd.Series([float(i) for i in range(150, 50, -1)])
    result = analyze_ema(closes, short=20, long=50)
    assert result["direction"] == "bearish"


def test_ema_structure():
    closes = pd.Series([float(i) for i in range(50, 150)])
    result = analyze_ema(closes)
    assert "ema_short" in result
    assert "ema_long" in result
    assert "signal" in result
    assert "direction" in result
    assert "history" in result
    assert len(result["history"]) > 0


def test_ema_price_position():
    closes = pd.Series([float(i) for i in range(50, 150)])
    result = analyze_ema(closes)
    assert result["price_vs_ema_short"] in ["above", "below"]
    assert result["price_vs_ema_long"] in ["above", "below"]


def test_direction_to_score_bullish():
    assert direction_to_score("bullish", 0.8) == 0.8


def test_direction_to_score_bearish():
    assert direction_to_score("bearish", 0.8) == -0.8


def test_direction_to_score_neutral():
    assert direction_to_score("neutral", 0.0) == 0.0


def test_analyze_ticker_structure():
    import unittest.mock as mock

    mock_df = pd.DataFrame(
        {
            "close": [float(i) for i in range(50, 150)],
            "open": [float(i) for i in range(50, 150)],
            "high": [float(i) + 1 for i in range(50, 150)],
            "low": [float(i) - 1 for i in range(50, 150)],
            "volume": [1000000.0] * 100,
        }
    )

    with mock.patch("app.services.technical_analysis.get_ohlcv", return_value=mock_df):
        result = analyze_ticker("AAPL")

    assert "overall_signal" in result
    assert "composite_score" in result
    assert "bullish_indicators" in result
    assert "bearish_indicators" in result
    assert "indicators" in result
    assert "rsi" in result["indicators"]
    assert "macd" in result["indicators"]
    assert "bollinger_bands" in result["indicators"]
    assert "ema" in result["indicators"]
    assert result["overall_signal"] in ["bullish", "bearish", "neutral"]
    assert -1.0 <= result["composite_score"] <= 1.0


def test_indicator_counts_sum_to_four():
    import unittest.mock as mock

    mock_df = pd.DataFrame(
        {
            "close": [float(i) for i in range(50, 150)],
            "open": [float(i) for i in range(50, 150)],
            "high": [float(i) + 1 for i in range(50, 150)],
            "low": [float(i) - 1 for i in range(50, 150)],
            "volume": [1000000.0] * 100,
        }
    )

    with mock.patch("app.services.technical_analysis.get_ohlcv", return_value=mock_df):
        result = analyze_ticker("AAPL")

    total = (
        result["bullish_indicators"]
        + result["bearish_indicators"]
        + result["neutral_indicators"]
    )
    assert total == 4, f"Expected 4 total indicators, got {total}"


if __name__ == "__main__":
    tests = [
        test_rsi_overbought,
        test_rsi_oversold,
        test_rsi_signal_overbought,
        test_rsi_signal_oversold,
        test_rsi_signal_neutral,
        test_analyze_rsi_structure,
        test_macd_bullish,
        test_macd_bearish,
        test_macd_signal_bullish,
        test_macd_signal_bearish,
        test_analyze_macd_structure,
        test_bb_bands_structure,
        test_bb_signal_above_upper,
        test_bb_signal_below_lower,
        test_bb_signal_neutral,
        test_analyze_bb_structure,
        test_ema_length,
        test_ema_bullish_trend,
        test_ema_bearish_trend,
        test_ema_structure,
        test_ema_price_position,
        test_direction_to_score_bullish,
        test_direction_to_score_bearish,
        test_direction_to_score_neutral,
        test_analyze_ticker_structure,
        test_indicator_counts_sum_to_four,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
