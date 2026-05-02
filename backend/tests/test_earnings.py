import os
import sys
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.earnings import get_earnings_history, get_earnings_info


def make_mock_info(days_ahead: int = 10):
    future_ts = int((datetime.now() + timedelta(days=days_ahead)).timestamp())
    return {
        "earningsTimestamp": future_ts,
        "earningsTimestampStart": None,
        "earningsTimestampEnd": None,
        "forwardEps": 2.5,
        "revenueEstimate": None,
        "trailingEps": 2.1,
        "longName": "Apple Inc",
        "fiscalYearEnd": 9,
    }


def test_upcoming_earnings_detected():
    mock_stock = MagicMock()
    mock_stock.info = make_mock_info(days_ahead=5)

    with patch("app.services.earnings.yf.Ticker", return_value=mock_stock):
        result = get_earnings_info("AAPL")

    assert result["is_upcoming"] is True
    assert result["days_until_earnings"] is not None
    assert result["days_until_earnings"] <= 30


def test_urgency_critical():
    mock_stock = MagicMock()
    mock_stock.info = make_mock_info(days_ahead=2)

    with patch("app.services.earnings.yf.Ticker", return_value=mock_stock):
        result = get_earnings_info("AAPL")

    assert result["urgency"] == "critical"


def test_urgency_high():
    mock_stock = MagicMock()
    mock_stock.info = make_mock_info(days_ahead=5)

    with patch("app.services.earnings.yf.Ticker", return_value=mock_stock):
        result = get_earnings_info("AAPL")

    assert result["urgency"] == "high"


def test_no_earnings_date():
    mock_stock = MagicMock()
    mock_stock.info = {
        "earningsTimestamp": None,
        "earningsTimestampStart": None,
        "earningsTimestampEnd": None,
        "longName": "Test Corp",
    }

    with patch("app.services.earnings.yf.Ticker", return_value=mock_stock):
        result = get_earnings_info("TEST")

    assert result["is_upcoming"] is False
    assert result["earnings_date"] is None
    assert result["urgency"] == "none"


def test_earnings_structure():
    mock_stock = MagicMock()
    mock_stock.info = make_mock_info(days_ahead=10)

    with patch("app.services.earnings.yf.Ticker", return_value=mock_stock):
        result = get_earnings_info("AAPL")

    required_keys = [
        "ticker",
        "earnings_date",
        "days_until_earnings",
        "is_upcoming",
        "urgency",
    ]
    for key in required_keys:
        assert key in result, f"Missing key: {key}"


def test_earnings_error_graceful():
    with patch("app.services.earnings.yf.Ticker", side_effect=Exception("API error")):
        result = get_earnings_info("AAPL")

    assert result["is_upcoming"] is False
    assert "error" in result


def test_earnings_history_empty():
    mock_stock = MagicMock()
    mock_stock.earnings_dates = None

    with patch("app.services.earnings.yf.Ticker", return_value=mock_stock):
        result = get_earnings_history("AAPL")

    assert result == []


if __name__ == "__main__":
    tests = [
        test_upcoming_earnings_detected,
        test_urgency_critical,
        test_urgency_high,
        test_no_earnings_date,
        test_earnings_structure,
        test_earnings_error_graceful,
        test_earnings_history_empty,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
