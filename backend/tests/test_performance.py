import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.performance import calculate_position_performance


def test_profitable_position():
    result = calculate_position_performance(
        ticker="AAPL",
        shares=10,
        avg_buy_price=150.0,
        current_price=180.0,
    )
    assert result["unrealized_pnl"] == 300.0
    assert result["unrealized_pnl_pct"] == 20.0
    assert result["is_profitable"] is True
    assert result["cost_basis"] == 1500.0
    assert result["current_value"] == 1800.0


def test_losing_position():
    result = calculate_position_performance(
        ticker="TSLA",
        shares=5,
        avg_buy_price=300.0,
        current_price=240.0,
    )
    assert result["unrealized_pnl"] == -300.0
    assert result["unrealized_pnl_pct"] == -20.0
    assert result["is_profitable"] is False


def test_breakeven_position():
    result = calculate_position_performance(
        ticker="NVDA",
        shares=2,
        avg_buy_price=500.0,
        current_price=500.0,
    )
    assert result["unrealized_pnl"] == 0.0
    assert result["unrealized_pnl_pct"] == 0.0


def test_position_values():
    result = calculate_position_performance(
        ticker="MSFT",
        shares=8,
        avg_buy_price=400.0,
        current_price=440.0,
    )
    assert result["cost_basis"] == 3200.0
    assert result["current_value"] == 3520.0
    assert result["shares"] == 8


def test_fractional_shares():
    result = calculate_position_performance(
        ticker="GOOGL",
        shares=2.5,
        avg_buy_price=200.0,
        current_price=220.0,
    )
    assert result["cost_basis"] == 500.0
    assert result["current_value"] == 550.0
    assert result["unrealized_pnl"] == 50.0


def test_pnl_percentage_accuracy():
    result = calculate_position_performance(
        ticker="AAPL",
        shares=1,
        avg_buy_price=100.0,
        current_price=115.0,
    )
    assert result["unrealized_pnl_pct"] == 15.0


if __name__ == "__main__":
    tests = [
        test_profitable_position,
        test_losing_position,
        test_breakeven_position,
        test_position_values,
        test_fractional_shares,
        test_pnl_percentage_accuracy,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
