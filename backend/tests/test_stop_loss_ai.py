import os
import sys
from unittest.mock import patch

import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.stop_loss_ai import build_stop_loss_prompt


def make_mock_indicators():
    return {
        "rsi": {
            "value": 68.0,
            "signal": "neutral",
            "direction": "neutral",
            "strength": 0.0,
        },
        "macd": {
            "value": -0.3,
            "signal": "bearish_crossover",
            "direction": "bearish",
            "strength": 0.4,
        },
        "bollinger_bands": {
            "percent_b": 0.82,
            "signal": "near_upper",
            "direction": "bearish",
            "strength": 0.3,
        },
        "ema": {
            "signal": "bullish_trend",
            "direction": "bullish",
            "strength": 0.2,
            "price_vs_ema_short": "above",
            "price_vs_ema_long": "above",
        },
    }


def test_prompt_contains_ticker():
    prompt = build_stop_loss_prompt(
        ticker="AAPL",
        current_price=180.0,
        avg_buy_price=160.0,
        stop_loss_price=168.0,
        risk_score=55.0,
        risk_level="medium",
        atr=3.5,
        indicators=make_mock_indicators(),
        pct_below_current=6.7,
        profit_at_stop=5.0,
    )
    assert "AAPL" in prompt
    assert "180.00" in prompt
    assert "168.00" in prompt
    assert "55.0/100" in prompt


def test_prompt_profit_positive():
    prompt = build_stop_loss_prompt(
        ticker="AAPL",
        current_price=180.0,
        avg_buy_price=160.0,
        stop_loss_price=168.0,
        risk_score=55.0,
        risk_level="medium",
        atr=3.5,
        indicators=make_mock_indicators(),
        pct_below_current=6.7,
        profit_at_stop=5.0,
    )
    assert "+5.0% profit" in prompt


def test_prompt_profit_negative():
    prompt = build_stop_loss_prompt(
        ticker="TSLA",
        current_price=200.0,
        avg_buy_price=250.0,
        stop_loss_price=185.0,
        risk_score=72.0,
        risk_level="high",
        atr=8.0,
        indicators=make_mock_indicators(),
        pct_below_current=7.5,
        profit_at_stop=-26.0,
    )
    assert "-26.0% loss" in prompt


def test_prompt_structure():
    prompt = build_stop_loss_prompt(
        ticker="NVDA",
        current_price=500.0,
        avg_buy_price=450.0,
        stop_loss_price=470.0,
        risk_score=65.0,
        risk_level="medium",
        atr=12.0,
        indicators=make_mock_indicators(),
        pct_below_current=6.0,
        profit_at_stop=4.4,
    )
    assert "Bottom line" in prompt
    assert "Risk/reward" in prompt
    assert "5 trading days" in prompt


def test_get_ai_stop_loss_data_error_graceful():
    with patch(
        "app.services.stop_loss_ai.get_ohlcv",
        side_effect=Exception("Yahoo timeout"),
    ):
        from app.services.stop_loss_ai import get_ai_stop_loss_justification

        result = get_ai_stop_loss_justification("AAPL", avg_buy_price=160.0)

    assert "error" in result
    assert result["ticker"] == "AAPL"


def test_get_ai_stop_loss_full_mock():
    mock_df = pd.DataFrame(
        {
            "open": [float(i) for i in range(100, 160)],
            "high": [float(i) + 2 for i in range(100, 160)],
            "low": [float(i) - 2 for i in range(100, 160)],
            "close": [float(i) for i in range(100, 160)],
            "volume": [1000000.0] * 60,
        }
    )

    mock_risk = {
        "risk": {"score": 55.0, "level": "medium", "recommendation": "Monitor closely"},
        "indicators": make_mock_indicators(),
        "latest_price": 159.0,
        "overall_signal": "neutral",
        "composite_score": -0.1,
        "sentiment_score": None,
        "sentiment_included": False,
    }

    mock_ai = {
        "answer": "Stop-loss at $150 makes sense given bearish MACD. Bottom line: Hold with tight stop.",
        "model": "llama3-70b-8192",
        "tokens_used": 250,
    }

    with patch("app.services.stop_loss_ai.get_ohlcv", return_value=mock_df):
        with patch(
            "app.services.stop_loss_ai.calculate_risk_for_ticker",
            return_value=mock_risk,
        ):
            with patch("app.services.stop_loss_ai.ask_agent", return_value=mock_ai):
                from app.services.stop_loss_ai import get_ai_stop_loss_justification

                result = get_ai_stop_loss_justification("AAPL", avg_buy_price=140.0)

    assert result["ticker"] == "AAPL"
    assert result["risk_score"] == 55.0
    assert "Bottom line" in result["ai_justification"]
    assert result["tokens_used"] == 250


if __name__ == "__main__":
    tests = [
        test_prompt_contains_ticker,
        test_prompt_profit_positive,
        test_prompt_profit_negative,
        test_prompt_structure,
        test_get_ai_stop_loss_data_error_graceful,
        test_get_ai_stop_loss_full_mock,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
