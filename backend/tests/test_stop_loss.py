import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pandas as pd

from app.services.stop_loss import (
    analyze_stop_loss_for_ticker,
    calculate_atr,
    calculate_stop_loss,
)


def make_mock_df(n: int = 60) -> pd.DataFrame:
    prices = [float(100 + i * 0.5) for i in range(n)]
    return pd.DataFrame(
        {
            "open": prices,
            "high": [p + 1.5 for p in prices],
            "low": [p - 1.5 for p in prices],
            "close": prices,
            "volume": [1000000.0] * n,
        }
    )


def test_atr_length():
    df = make_mock_df()
    atr = calculate_atr(df)
    assert len(atr) == len(df)


def test_atr_positive():
    df = make_mock_df()
    atr = calculate_atr(df).dropna()
    assert (atr > 0).all()


def test_stop_loss_below_price():
    result = calculate_stop_loss(
        current_price=100.0,
        atr=2.0,
        risk_score=50.0,
    )
    assert result["stop_loss_price"] < result["current_price"]


def test_stop_loss_high_risk_tighter():
    high_risk = calculate_stop_loss(100.0, atr=2.0, risk_score=75.0)
    low_risk = calculate_stop_loss(100.0, atr=2.0, risk_score=20.0)
    assert high_risk["stop_loss_price"] > low_risk["stop_loss_price"]


def test_stop_loss_with_buy_price():
    result = calculate_stop_loss(
        current_price=120.0,
        atr=2.0,
        risk_score=50.0,
        avg_buy_price=100.0,
    )
    assert "avg_buy_price" in result
    assert "profit_at_stop" in result
    assert "stop_protects_profit" in result


def test_stop_loss_protects_profit():
    result = calculate_stop_loss(
        current_price=150.0,
        atr=1.0,
        risk_score=50.0,
        avg_buy_price=100.0,
    )
    assert result["stop_protects_profit"] is True


def test_stop_loss_urgency_levels():
    high = calculate_stop_loss(100.0, 2.0, risk_score=75.0)
    medium = calculate_stop_loss(100.0, 2.0, risk_score=50.0)
    low = calculate_stop_loss(100.0, 2.0, risk_score=20.0)
    assert high["urgency"] == "high"
    assert medium["urgency"] == "medium"
    assert low["urgency"] == "low"


def test_analyze_stop_loss_structure():
    df = make_mock_df()
    result = analyze_stop_loss_for_ticker(df=df, risk_score=55.0, avg_buy_price=95.0)
    assert "stop_loss_price" in result
    assert "atr" in result
    assert "pct_below_current" in result
    assert "urgency" in result


if __name__ == "__main__":
    tests = [
        test_atr_length,
        test_atr_positive,
        test_stop_loss_below_price,
        test_stop_loss_high_risk_tighter,
        test_stop_loss_with_buy_price,
        test_stop_loss_protects_profit,
        test_stop_loss_urgency_levels,
        test_analyze_stop_loss_structure,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
