import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd

from app.services.market_regime import detect_market_regime


def make_trending_up(n: int = 100) -> pd.Series:
    return pd.Series([100.0 + i * 0.5 for i in range(n)])


def make_trending_down(n: int = 100) -> pd.Series:
    return pd.Series([200.0 - i * 0.5 for i in range(n)])


def make_ranging(n: int = 100) -> pd.Series:
    np.random.seed(42)
    return pd.Series(100.0 + np.random.randn(n) * 0.3)


def test_bullish_regime():
    closes = make_trending_up()
    result = detect_market_regime(closes)
    assert "bullish" in result["regime"]


def test_bearish_regime():
    closes = make_trending_down()
    result = detect_market_regime(closes)
    assert "bearish" in result["regime"]


def test_ranging_regime():
    closes = make_ranging()
    result = detect_market_regime(closes)
    assert result["regime"] in [
        "ranging",
        "high_volatility",
        "trending_bullish",
        "trending_bearish",
    ]


def test_insufficient_data():
    closes = pd.Series([100.0, 101.0, 99.0])
    result = detect_market_regime(closes)
    assert result["regime"] == "unknown"


def test_regime_structure():
    closes = make_trending_up()
    result = detect_market_regime(closes)
    assert "regime" in result
    assert "description" in result
    assert "implication_for_signals" in result
    assert "metrics" in result
    assert "volatility_20d_annualized" in result["metrics"]
    assert "momentum_5d_pct" in result["metrics"]


def test_regime_metrics_types():
    closes = make_trending_up()
    result = detect_market_regime(closes)
    metrics = result["metrics"]
    assert isinstance(metrics["volatility_20d_annualized"], float)
    assert isinstance(metrics["momentum_5d_pct"], float)
    assert metrics["price_vs_ema20"] in ["above", "below"]
    assert metrics["price_vs_ema50"] in ["above", "below"]


if __name__ == "__main__":
    tests = [
        test_bullish_regime,
        test_bearish_regime,
        test_ranging_regime,
        test_insufficient_data,
        test_regime_structure,
        test_regime_metrics_types,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
