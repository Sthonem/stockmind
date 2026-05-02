import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.scenario import (
    SCENARIO_TEMPLATES,
    analyze_scenario,
    build_scenario_prompt,
)


def test_scenario_templates_exist():
    assert "fed_rate_hike" in SCENARIO_TEMPLATES
    assert "fed_rate_cut" in SCENARIO_TEMPLATES
    assert "recession" in SCENARIO_TEMPLATES
    assert "inflation_spike" in SCENARIO_TEMPLATES
    assert "market_crash" in SCENARIO_TEMPLATES


def test_build_scenario_prompt_contains_tickers():
    prompt = build_scenario_prompt(
        scenario_description="Fed raises rates by 50bps",
        tickers=["AAPL", "NVDA", "TSLA"],
    )
    assert "AAPL" in prompt
    assert "NVDA" in prompt
    assert "TSLA" in prompt
    assert "Fed raises rates by 50bps" in prompt


def test_build_scenario_prompt_with_template():
    template = SCENARIO_TEMPLATES["fed_rate_hike"]
    prompt = build_scenario_prompt(
        scenario_description="Fed raises rates",
        tickers=["AAPL"],
        template=template,
    )
    assert "HISTORICAL CONTEXT" in prompt
    assert template["historical_context"] in prompt


def test_build_scenario_prompt_structure():
    prompt = build_scenario_prompt(
        scenario_description="Market crashes 30%",
        tickers=["AAPL"],
    )
    assert "Expected direction" in prompt
    assert "Suggested action" in prompt
    assert "Bottom line" in prompt


def test_analyze_scenario_mock():
    mock_result = {
        "answer": "AAPL: bearish, high impact. NVDA: bearish, high impact. Bottom line: Reduce exposure immediately.",
        "model": "llama3-70b-8192",
        "tokens_used": 300,
    }

    with patch("app.services.scenario.ask_agent", return_value=mock_result):
        result = analyze_scenario(
            scenario="Fed raises rates by 75bps",
            tickers=["AAPL", "NVDA"],
            scenario_type="fed_rate_hike",
        )

    assert result["scenario"] == "Fed raises rates by 75bps"
    assert result["tickers_analyzed"] == ["AAPL", "NVDA"]
    assert result["template_used"] == "Fed Rate Hike"
    assert "Bottom line" in result["analysis"]
    assert result["tokens_used"] == 300


def test_analyze_scenario_no_template():
    mock_result = {
        "answer": "Custom scenario analysis. Bottom line: Monitor carefully.",
        "model": "llama3-70b-8192",
        "tokens_used": 200,
    }

    with patch("app.services.scenario.ask_agent", return_value=mock_result):
        result = analyze_scenario(
            scenario="Geopolitical crisis in Middle East",
            tickers=["XOM"],
            scenario_type=None,
        )

    assert result["template_used"] is None
    assert result["scenario_type"] is None


def test_analyze_scenario_structure():
    mock_result = {
        "answer": "Analysis here. Bottom line: Stay cautious.",
        "model": "llama3-70b-8192",
        "tokens_used": 150,
    }

    with patch("app.services.scenario.ask_agent", return_value=mock_result):
        result = analyze_scenario(
            scenario="Inflation hits 8%",
            tickers=["AAPL", "GLD"],
        )

    assert "scenario" in result
    assert "tickers_analyzed" in result
    assert "analysis" in result
    assert "tokens_used" in result


if __name__ == "__main__":
    tests = [
        test_scenario_templates_exist,
        test_build_scenario_prompt_contains_tickers,
        test_build_scenario_prompt_with_template,
        test_build_scenario_prompt_structure,
        test_analyze_scenario_mock,
        test_analyze_scenario_no_template,
        test_analyze_scenario_structure,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
