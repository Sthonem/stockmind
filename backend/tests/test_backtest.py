import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd

from app.services.backtest import generate_signals, run_backtest


def make_mock_df(n: int = 252) -> pd.DataFrame:
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


def test_generate_signals_returns_series():
    df = make_mock_df()
    signals = generate_signals(df)
    assert isinstance(signals, pd.Series)
    assert len(signals) == len(df)


def test_signals_only_valid_values():
    df = make_mock_df()
    signals = generate_signals(df)
    assert set(signals.unique()).issubset({-1, 0, 1})


def test_backtest_structure():
    df = make_mock_df()
    with patch("app.services.backtest.get_ohlcv", return_value=df):
        result = run_backtest("AAPL", period="1y", initial_capital=10000.0)

    required_keys = [
        "ticker",
        "period",
        "initial_capital",
        "final_value",
        "total_return_pct",
        "buy_hold_return_pct",
        "outperformed_buy_hold",
        "total_trades",
        "winning_trades",
        "losing_trades",
        "win_rate_pct",
        "max_drawdown_pct",
        "sharpe_ratio",
    ]
    for key in required_keys:
        assert key in result, f"Missing key: {key}"


def test_backtest_initial_capital_preserved():
    df = make_mock_df()
    with patch("app.services.backtest.get_ohlcv", return_value=df):
        result = run_backtest("AAPL", initial_capital=10000.0)
    assert result["initial_capital"] == 10000.0


def test_backtest_win_rate_range():
    df = make_mock_df()
    with patch("app.services.backtest.get_ohlcv", return_value=df):
        result = run_backtest("AAPL")
    assert 0 <= result["win_rate_pct"] <= 100


def test_backtest_max_drawdown_non_negative():
    df = make_mock_df()
    with patch("app.services.backtest.get_ohlcv", return_value=df):
        result = run_backtest("AAPL")
    assert result["max_drawdown_pct"] >= 0


def test_backtest_trade_count_consistent():
    df = make_mock_df()
    with patch("app.services.backtest.get_ohlcv", return_value=df):
        result = run_backtest("AAPL")
    assert result["winning_trades"] + result["losing_trades"] == result["total_trades"]


def test_backtest_portfolio_values_list():
    df = make_mock_df()
    with patch("app.services.backtest.get_ohlcv", return_value=df):
        result = run_backtest("AAPL")
    assert isinstance(result["portfolio_values"], list)
    assert len(result["portfolio_values"]) > 0
    assert "date" in result["portfolio_values"][0]
    assert "value" in result["portfolio_values"][0]


if __name__ == "__main__":
    tests = [
        test_generate_signals_returns_series,
        test_signals_only_valid_values,
        test_backtest_structure,
        test_backtest_initial_capital_preserved,
        test_backtest_win_rate_range,
        test_backtest_max_drawdown_non_negative,
        test_backtest_trade_count_consistent,
        test_backtest_portfolio_values_list,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
