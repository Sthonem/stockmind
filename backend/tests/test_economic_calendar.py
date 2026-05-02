import os
import sys
from unittest.mock import patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.economic_calendar import (
    fetch_economic_events,
    get_affected_sectors,
    get_fallback_events,
    get_upcoming_high_impact,
    is_high_impact,
)


def test_fomc_is_high_impact():
    assert is_high_impact("FOMC Meeting Minutes") is True


def test_cpi_is_high_impact():
    assert is_high_impact("CPI Report Release") is True


def test_low_impact_event():
    assert is_high_impact("Housing Starts Minor Report") is False


def test_fed_affected_sectors():
    sectors = get_affected_sectors("Federal Reserve Rate Decision")
    assert "Technology" in sectors
    assert "Real Estate" in sectors


def test_cpi_affected_sectors():
    sectors = get_affected_sectors("CPI Inflation Report")
    assert "Technology" in sectors


def test_unknown_event_sectors():
    sectors = get_affected_sectors("Random Economic Data")
    assert sectors == []


def test_fallback_events_structure():
    events = get_fallback_events()
    assert len(events) > 0
    for event in events:
        assert "title" in event
        assert "date" in event
        assert "impact" in event
        assert "is_high_impact" in event


def test_fallback_events_all_high_impact():
    events = get_fallback_events()
    assert all(e["is_high_impact"] for e in events)


def test_upcoming_uses_fallback_on_error():
    with patch(
        "app.services.economic_calendar.fetch_economic_events",
        return_value=get_fallback_events(),
    ):
        result = get_upcoming_high_impact(days_ahead=30)

    assert "high_impact_count" in result
    assert "events" in result
    assert isinstance(result["events"], list)


def test_fetch_events_fallback_on_network_error():
    with patch("httpx.Client") as mock_client:
        mock_client.return_value.__enter__.return_value.get.side_effect = Exception(
            "Timeout"
        )
        events = fetch_economic_events()

    assert isinstance(events, list)
    assert len(events) > 0


def test_upcoming_structure():
    result = get_upcoming_high_impact(days_ahead=30)
    assert "days_ahead" in result
    assert "high_impact_count" in result
    assert "events" in result


if __name__ == "__main__":
    tests = [
        test_fomc_is_high_impact,
        test_cpi_is_high_impact,
        test_low_impact_event,
        test_fed_affected_sectors,
        test_cpi_affected_sectors,
        test_unknown_event_sectors,
        test_fallback_events_structure,
        test_fallback_events_all_high_impact,
        test_upcoming_uses_fallback_on_error,
        test_fetch_events_fallback_on_network_error,
        test_upcoming_structure,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
