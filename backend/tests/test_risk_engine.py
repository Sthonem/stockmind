import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.risk_engine import (
    compute_risk_score,
    normalize_bb_risk,
    normalize_ema_risk,
    normalize_macd_risk,
    normalize_rsi_risk,
    normalize_sentiment_risk,
)


def test_rsi_high_risk():
    assert normalize_rsi_risk(80) > 0.3


def test_rsi_low_risk():
    assert normalize_rsi_risk(50) == 0.0


def test_rsi_oversold_moderate_risk():
    assert 0 < normalize_rsi_risk(20) <= 0.5


def test_macd_negative_high_risk():
    assert normalize_macd_risk(-0.5, -0.3) > 0.0


def test_macd_positive_low_risk():
    risk = normalize_macd_risk(0.5, 0.8)
    assert risk < 0.5


def test_bb_above_upper_high_risk():
    assert normalize_bb_risk(1.1) > 0.8


def test_bb_within_bands_zero_risk():
    assert normalize_bb_risk(0.5) == 0.0


def test_ema_bearish_risk():
    assert normalize_ema_risk("bearish", 0.8) > 0.5


def test_ema_bullish_low_risk():
    assert normalize_ema_risk("bullish", 0.8) < 0.3


def test_sentiment_negative_risk():
    assert normalize_sentiment_risk(-0.8) > 0.5


def test_sentiment_none_zero_risk():
    assert normalize_sentiment_risk(None) == 0.0


def test_compute_risk_score_structure():
    result = compute_risk_score(
        rsi_value=75.0,
        macd_histogram=-0.5,
        macd_value=-0.3,
        bb_percent_b=0.9,
        ema_direction="bearish",
        ema_strength=0.6,
        sentiment_score=-0.5,
    )
    assert "score" in result
    assert "level" in result
    assert "recommendation" in result
    assert "components" in result
    assert 0 <= result["score"] <= 100


def test_compute_risk_score_high():
    result = compute_risk_score(
        rsi_value=80.0,
        macd_histogram=-1.0,
        macd_value=-0.5,
        bb_percent_b=1.2,
        ema_direction="bearish",
        ema_strength=1.0,
        sentiment_score=-1.0,
    )
    assert result["level"] == "high"


def test_compute_risk_score_low():
    result = compute_risk_score(
        rsi_value=50.0,
        macd_histogram=0.5,
        macd_value=0.8,
        bb_percent_b=0.5,
        ema_direction="bullish",
        ema_strength=0.3,
        sentiment_score=0.5,
    )
    assert result["level"] == "low"


if __name__ == "__main__":
    tests = [
        test_rsi_high_risk,
        test_rsi_low_risk,
        test_rsi_oversold_moderate_risk,
        test_macd_negative_high_risk,
        test_macd_positive_low_risk,
        test_bb_above_upper_high_risk,
        test_bb_within_bands_zero_risk,
        test_ema_bearish_risk,
        test_ema_bullish_low_risk,
        test_sentiment_negative_risk,
        test_sentiment_none_zero_risk,
        test_compute_risk_score_structure,
        test_compute_risk_score_high,
        test_compute_risk_score_low,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
