import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd

from app.services.position_sizing import (
    calculate_position_size,
    calculate_win_rate_and_avg,
    kelly_criterion,
)


def test_kelly_positive():
    kelly = kelly_criterion(win_rate=0.6, win_loss_ratio=1.5)
    assert kelly > 0


def test_kelly_zero_edge():
    kelly = kelly_criterion(win_rate=0.4, win_loss_ratio=1.0)
    assert kelly >= 0


def test_kelly_never_negative():
    kelly = kelly_criterion(win_rate=0.3, win_loss_ratio=0.5)
    assert kelly >= 0.0


def test_win_rate_calculation():
    returns = pd.Series([0.01, -0.02, 0.03, -0.01, 0.02, 0.01, -0.01, 0.02])
    stats = calculate_win_rate_and_avg(returns)
    assert 0 < stats["win_rate"] < 1
    assert stats["avg_win"] > 0
    assert stats["avg_loss"] > 0


def test_position_size_high_risk_smaller():
    high_risk = calculate_position_size("AAPL", 10000, risk_score=75.0)
    low_risk = calculate_position_size("AAPL", 10000, risk_score=20.0)
    assert high_risk["recommended_pct"] <= low_risk["recommended_pct"]


def test_position_size_capped():
    result = calculate_position_size(
        "AAPL",
        10000,
        risk_score=10.0,
        win_rate=0.9,
        win_loss_ratio=5.0,
        max_position_pct=0.25,
    )
    assert result["recommended_pct"] <= 25.0


def test_position_size_value_correct():
    result = calculate_position_size(
        "AAPL",
        10000,
        risk_score=50.0,
        win_rate=0.55,
        win_loss_ratio=1.2,
    )
    expected = 10000 * (result["recommended_pct"] / 100)
    assert abs(result["recommended_value"] - expected) < 0.01


def test_position_size_structure():
    result = calculate_position_size("AAPL", 10000, risk_score=50.0)
    required_keys = [
        "ticker",
        "portfolio_value",
        "win_rate",
        "win_loss_ratio",
        "full_kelly_pct",
        "half_kelly_pct",
        "recommended_pct",
        "recommended_value",
        "risk_note",
    ]
    for key in required_keys:
        assert key in result, f"Missing key: {key}"


def test_position_size_minimum():
    result = calculate_position_size(
        "AAPL",
        10000,
        risk_score=80.0,
        win_rate=0.3,
        win_loss_ratio=0.5,
    )
    assert result["recommended_pct"] >= 1.0


if __name__ == "__main__":
    tests = [
        test_kelly_positive,
        test_kelly_zero_edge,
        test_kelly_never_negative,
        test_win_rate_calculation,
        test_position_size_high_risk_smaller,
        test_position_size_capped,
        test_position_size_value_correct,
        test_position_size_structure,
        test_position_size_minimum,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
