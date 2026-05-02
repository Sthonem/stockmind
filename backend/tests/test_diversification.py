import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.diversification import (
    calculate_diversification_score,
    calculate_herfindahl_index,
)


def test_hhi_single_position():
    hhi = calculate_herfindahl_index([1.0])
    assert hhi == 1.0


def test_hhi_equal_weights():
    weights = [0.25, 0.25, 0.25, 0.25]
    hhi = calculate_herfindahl_index(weights)
    assert abs(hhi - 0.25) < 0.001


def test_hhi_concentrated():
    weights = [0.9, 0.05, 0.05]
    hhi = calculate_herfindahl_index(weights)
    assert hhi > 0.5


def test_diversification_well_diversified():
    sector_weights = {
        "Technology": 0.2,
        "Healthcare": 0.2,
        "Financials": 0.2,
        "Energy": 0.2,
        "Consumer": 0.2,
    }
    position_weights = {
        "AAPL": 0.1,
        "NVDA": 0.1,
        "JNJ": 0.1,
        "PFE": 0.1,
        "JPM": 0.1,
        "BAC": 0.1,
        "XOM": 0.1,
        "CVX": 0.1,
        "WMT": 0.1,
        "COST": 0.1,
    }
    result = calculate_diversification_score(sector_weights, position_weights, 10)
    assert result["overall_score"] > 50
    assert result["level"] in ["well_diversified", "moderately_diversified"]


def test_diversification_concentrated():
    sector_weights = {"Technology": 1.0}
    position_weights = {"AAPL": 1.0}
    result = calculate_diversification_score(sector_weights, position_weights, 1)
    assert result["level"] == "concentrated"
    assert result["overall_score"] < 20


def test_diversification_score_range():
    sector_weights = {"Technology": 0.6, "Healthcare": 0.4}
    position_weights = {"AAPL": 0.6, "JNJ": 0.4}
    result = calculate_diversification_score(sector_weights, position_weights, 2)
    assert 0 <= result["overall_score"] <= 100
    assert 0 <= result["sector_score"] <= 100
    assert 0 <= result["position_score"] <= 100


def test_diversification_structure():
    sector_weights = {"Technology": 0.5, "Healthcare": 0.5}
    position_weights = {"AAPL": 0.5, "JNJ": 0.5}
    result = calculate_diversification_score(sector_weights, position_weights, 2)
    assert "overall_score" in result
    assert "sector_score" in result
    assert "position_score" in result
    assert "level" in result
    assert "note" in result
    assert "dominant_sector" in result
    assert "dominant_position" in result


def test_dominant_sector_identified():
    sector_weights = {"Technology": 0.7, "Healthcare": 0.3}
    position_weights = {"AAPL": 0.7, "JNJ": 0.3}
    result = calculate_diversification_score(sector_weights, position_weights, 2)
    assert result["dominant_sector"] == "Technology"
    assert result["dominant_position"] == "AAPL"


if __name__ == "__main__":
    tests = [
        test_hhi_single_position,
        test_hhi_equal_weights,
        test_hhi_concentrated,
        test_diversification_well_diversified,
        test_diversification_concentrated,
        test_diversification_score_range,
        test_diversification_structure,
        test_dominant_sector_identified,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
