import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.ai_agent import ask_agent, build_portfolio_context


def test_no_api_key():
    with patch("app.services.ai_agent.settings") as mock_settings:
        mock_settings.GROQ_API_KEY = ""
        result = ask_agent("What is my portfolio risk?")
    assert "GROQ_API_KEY" in result["answer"]
    assert result["tokens_used"] == 0


def test_build_portfolio_context_empty():
    result = build_portfolio_context({})
    assert "No portfolio data" in result


def test_build_portfolio_context_with_positions():
    data = {
        "positions": [
            {
                "ticker": "AAPL",
                "risk_score": 45.0,
                "risk_level": "medium",
                "estimated_value": 1500.0,
            },
            {
                "ticker": "NVDA",
                "risk_score": 72.0,
                "risk_level": "high",
                "estimated_value": 2000.0,
            },
        ],
        "portfolio_risk_score": 61.0,
        "portfolio_risk_level": "medium",
        "high_risk_positions": ["NVDA"],
    }
    context = build_portfolio_context(data)
    assert "AAPL" in context
    assert "NVDA" in context
    assert "61.0" in context
    assert "high_risk_positions" in context.lower() or "High-risk" in context


def test_ask_agent_mock_response():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices[0].message.content = (
        "Your portfolio risk is moderate. Bottom line: Monitor NVDA closely."
    )
    mock_response.usage.total_tokens = 150
    mock_client.chat.completions.create.return_value = mock_response

    with patch("app.services.ai_agent.get_groq_client", return_value=mock_client):
        result = ask_agent(
            "What is my portfolio risk?",
            portfolio_context="NVDA: risk=72 (high)",
        )

    assert "Bottom line" in result["answer"]
    assert result["tokens_used"] == 150
    assert result["model"] == "llama3-70b-8192"


def test_ask_agent_with_history():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices[0].message.content = (
        "Based on Fed history, tech stocks may drop 5-10%. Bottom line: Reduce exposure."
    )
    mock_response.usage.total_tokens = 200
    mock_client.chat.completions.create.return_value = mock_response

    history = [
        {"role": "user", "content": "What stocks do I own?"},
        {"role": "assistant", "content": "You own AAPL and NVDA."},
    ]

    with patch("app.services.ai_agent.get_groq_client", return_value=mock_client):
        result = ask_agent(
            "If Fed raises rates, how will my portfolio be affected?",
            conversation_history=history,
        )

    call_args = mock_client.chat.completions.create.call_args
    messages = call_args[1]["messages"]
    roles = [m["role"] for m in messages]
    assert "system" in roles
    assert "user" in roles


def test_ask_agent_api_error_graceful():
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = Exception("API timeout")

    with patch("app.services.ai_agent.get_groq_client", return_value=mock_client):
        result = ask_agent("What is my risk?")

    assert "error" in result["answer"].lower()
    assert result["tokens_used"] == 0


if __name__ == "__main__":
    tests = [
        test_no_api_key,
        test_build_portfolio_context_empty,
        test_build_portfolio_context_with_positions,
        test_ask_agent_mock_response,
        test_ask_agent_with_history,
        test_ask_agent_api_error_graceful,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
