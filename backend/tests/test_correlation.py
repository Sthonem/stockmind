import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import numpy as np
import pandas as pd

from app.services.correlation import calculate_correlation_matrix


def make_prices(n: int = 100, seed: int = 42) -> pd.Series:
    np.random.seed(seed)
    returns = np.random.randn(n) * 0.01
    prices = 100 * np.cumprod(1 + returns)
    return pd.Series(prices)


def test_correlation_basic_structure():
    prices = {
        "AAPL": make_prices(100, seed=1),
        "NVDA": make_prices(100, seed=2),
        "TSLA": make_prices(100, seed=3),
    }
    result = calculate_correlation_matrix(prices)
    assert "matrix" in result
    assert "pairs" in result
    assert "tickers" in result
    assert len(result["tickers"]) == 3


def test_correlation_single_ticker_error():
    prices = {"AAPL": make_prices(100)}
    result = calculate_correlation_matrix(prices)
    assert "error" in result


def test_perfect_correlation():
    base = make_prices(100, seed=42)
    prices = {"A": base, "B": base * 1.1}
    result = calculate_correlation_matrix(prices)
    assert result["pairs"][0]["correlation"] > 0.99
    assert result["pairs"][0]["relationship"] == "highly_correlated"


def test_negative_correlation():
    base = make_prices(100, seed=42)
    prices = {"A": base, "B": base.iloc[::-1].reset_index(drop=True)}
    result = calculate_correlation_matrix(prices)
    pair = result["pairs"][0]
    assert pair["correlation"] < 0


def test_correlation_matrix_diagonal():
    prices = {
        "AAPL": make_prices(100, seed=1),
        "NVDA": make_prices(100, seed=2),
    }
    result = calculate_correlation_matrix(prices)
    assert result["matrix"]["AAPL"]["AAPL"] == 1.0
    assert result["matrix"]["NVDA"]["NVDA"] == 1.0


def test_correlation_pair_count():
    prices = {
        "A": make_prices(100, seed=1),
        "B": make_prices(100, seed=2),
        "C": make_prices(100, seed=3),
        "D": make_prices(100, seed=4),
    }
    result = calculate_correlation_matrix(prices)
    assert len(result["pairs"]) == 6


def test_correlation_range():
    prices = {
        "AAPL": make_prices(100, seed=1),
        "NVDA": make_prices(100, seed=2),
        "TSLA": make_prices(100, seed=3),
    }
    result = calculate_correlation_matrix(prices)
    for pair in result["pairs"]:
        assert -1.0 <= pair["correlation"] <= 1.0


def test_high_correlation_warning():
    base = make_prices(100, seed=42)
    prices = {"A": base, "B": base * 1.001}
    result = calculate_correlation_matrix(prices)
    assert result["warning"] is not None
    assert len(result["high_correlation_pairs"]) > 0


if __name__ == "__main__":
    tests = [
        test_correlation_basic_structure,
        test_correlation_single_ticker_error,
        test_perfect_correlation,
        test_negative_correlation,
        test_correlation_matrix_diagonal,
        test_correlation_pair_count,
        test_correlation_range,
        test_high_correlation_warning,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
