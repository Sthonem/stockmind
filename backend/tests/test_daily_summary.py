import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.daily_summary import build_daily_summary_prompt, generate_daily_summary


def test_prompt_contains_date():
    from datetime import datetime

    today = datetime.now().strftime("%A, %B %d %Y")
    prompt = build_daily_summary_prompt(
        indices_summary="SPY: $500 (+0.5%)",
        regime_summary="Regime: trending_bullish",
        news_summary="Dominant theme: macro",
    )
    assert today in prompt


def test_prompt_contains_indices():
    prompt = build_daily_summary_prompt(
        indices_summary="SPY: $500 (+0.5%)\nQQQ: $420 (+1.2%)",
        regime_summary="trending_bullish",
        news_summary="macro news",
    )
    assert "SPY" in prompt
    assert "QQQ" in prompt


def test_prompt_contains_tickers():
    prompt = build_daily_summary_prompt(
        indices_summary="SPY: $500",
        regime_summary="ranging",
        news_summary="no news",
        portfolio_tickers=["AAPL", "NVDA", "TSLA"],
    )
    assert "AAPL" in prompt
    assert "NVDA" in prompt
    assert "TSLA" in prompt


def test_prompt_structure():
    prompt = build_daily_summary_prompt(
        indices_summary="SPY: $500",
        regime_summary="trending_bullish",
        news_summary="earnings dominant",
    )
    assert "Bottom line" in prompt
    assert "Market overview" in prompt
    assert "What to watch" in prompt


def test_generate_daily_summary_mock():
    mock_ai = {
        "answer": "Market is bullish today. Indices up. Bottom line: Risk-on environment.",
        "model": "llama3-70b-8192",
        "tokens_used": 180,
    }

    with patch(
        "app.services.daily_summary.get_indices_summary",
        return_value="SPY: $500 (+0.5%)",
    ):
        with patch(
            "app.services.daily_summary.get_market_regime_summary",
            return_value="Regime: trending_bullish",
        ):
            with patch("app.services.daily_summary.fetch_market_news", return_value=[]):
                with patch(
                    "app.services.daily_summary.ask_agent",
                    return_value=mock_ai,
                ):
                    result = generate_daily_summary(["AAPL", "NVDA"])

    assert "summary" in result
    assert "date" in result
    assert "generated_at" in result
    assert "Bottom line" in result["summary"]
    assert result["tokens_used"] == 180


def test_generate_daily_summary_structure():
    mock_ai = {
        "answer": "Daily briefing here. Bottom line: Neutral day.",
        "model": "llama3-70b-8192",
        "tokens_used": 150,
    }

    with patch("app.services.daily_summary.get_indices_summary", return_value="SPY: $500"):
        with patch(
            "app.services.daily_summary.get_market_regime_summary",
            return_value="ranging",
        ):
            with patch("app.services.daily_summary.fetch_market_news", return_value=[]):
                with patch(
                    "app.services.daily_summary.ask_agent",
                    return_value=mock_ai,
                ):
                    result = generate_daily_summary()

    required_keys = [
        "date",
        "generated_at",
        "indices_data",
        "market_regime",
        "news_theme",
        "summary",
        "tokens_used",
    ]
    for key in required_keys:
        assert key in result, f"Missing key: {key}"


if __name__ == "__main__":
    tests = [
        test_prompt_contains_date,
        test_prompt_contains_indices,
        test_prompt_contains_tickers,
        test_prompt_structure,
        test_generate_daily_summary_mock,
        test_generate_daily_summary_structure,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
