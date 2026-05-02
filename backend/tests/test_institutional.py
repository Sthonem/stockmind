import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.institutional import (
    MAJOR_INSTITUTIONS,
    get_13f_filings,
    get_institutional_ownership,
)


def test_major_institutions_defined():
    assert "berkshire" in MAJOR_INSTITUTIONS
    assert "blackrock" in MAJOR_INSTITUTIONS
    assert "vanguard" in MAJOR_INSTITUTIONS
    assert len(MAJOR_INSTITUTIONS) >= 3


def test_institutional_ownership_mock():
    mock_stock = MagicMock()
    mock_stock.info = {
        "institutionalOwnershipPercent": 0.72,
        "heldPercentInsiders": 0.05,
        "floatShares": 15000000000,
        "sharesOutstanding": 15500000000,
        "sharesShort": 100000000,
        "shortRatio": 2.5,
        "shortPercentOfFloat": 0.08,
    }

    with patch("app.services.institutional.yf.Ticker", return_value=mock_stock):
        with patch("app.services.institutional.get_cik_for_ticker", return_value=None):
            result = get_institutional_ownership("AAPL")

    assert result["ticker"] == "AAPL"
    assert result["institutional_ownership_pct"] == 72.0
    assert result["institutional_sentiment"] == "institutional_favored"
    assert result["short_interest_signal"] == "low_short_interest"


def test_heavily_institutional():
    mock_stock = MagicMock()
    mock_stock.info = {
        "institutionalOwnershipPercent": 0.92,
        "heldPercentInsiders": 0.01,
        "floatShares": 1000000000,
        "sharesOutstanding": 1000000000,
        "sharesShort": 10000000,
        "shortRatio": 1.0,
        "shortPercentOfFloat": 0.02,
    }

    with patch("app.services.institutional.yf.Ticker", return_value=mock_stock):
        with patch("app.services.institutional.get_cik_for_ticker", return_value=None):
            result = get_institutional_ownership("TEST")

    assert result["institutional_sentiment"] == "heavily_institutional"


def test_heavily_shorted():
    mock_stock = MagicMock()
    mock_stock.info = {
        "institutionalOwnershipPercent": 0.5,
        "heldPercentInsiders": 0.05,
        "floatShares": 100000000,
        "sharesOutstanding": 100000000,
        "sharesShort": 25000000,
        "shortRatio": 5.0,
        "shortPercentOfFloat": 0.25,
    }

    with patch("app.services.institutional.yf.Ticker", return_value=mock_stock):
        with patch("app.services.institutional.get_cik_for_ticker", return_value=None):
            result = get_institutional_ownership("SHORT")

    assert result["short_interest_signal"] == "heavily_shorted"


def test_institutional_structure():
    mock_stock = MagicMock()
    mock_stock.info = {
        "institutionalOwnershipPercent": 0.65,
        "heldPercentInsiders": 0.03,
        "floatShares": 5000000000,
        "sharesOutstanding": 5000000000,
        "sharesShort": 50000000,
        "shortRatio": 2.0,
        "shortPercentOfFloat": 0.05,
    }

    with patch("app.services.institutional.yf.Ticker", return_value=mock_stock):
        with patch("app.services.institutional.get_cik_for_ticker", return_value=None):
            result = get_institutional_ownership("NVDA")

    required_keys = [
        "ticker",
        "institutional_ownership_pct",
        "institutional_sentiment",
        "short_interest_signal",
        "note",
    ]
    for key in required_keys:
        assert key in result, f"Missing key: {key}"


def test_institutional_error_graceful():
    with patch(
        "app.services.institutional.yf.Ticker",
        side_effect=Exception("API error"),
    ):
        result = get_institutional_ownership("AAPL")

    assert "error" in result
    assert result["institutional_sentiment"] == "unknown"


def test_13f_api_error_graceful():
    with patch("httpx.Client") as mock_client:
        mock_client.return_value.__enter__.return_value.get.side_effect = Exception(
            "Timeout"
        )
        result = get_13f_filings("0001067983")

    assert result == []


if __name__ == "__main__":
    tests = [
        test_major_institutions_defined,
        test_institutional_ownership_mock,
        test_heavily_institutional,
        test_heavily_shorted,
        test_institutional_structure,
        test_institutional_error_graceful,
        test_13f_api_error_graceful,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
