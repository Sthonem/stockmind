import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.sentiment import (
    _neutral_sentiment,
    analyze_article_sentiment,
    analyze_batch_sentiment,
)


def test_neutral_sentiment_structure():
    result = _neutral_sentiment("test reason")
    assert result["sentiment"] == "neutral"
    assert result["score"] == 0.0
    assert result["confidence"] == 0.0


def test_no_api_key_returns_neutral():
    with patch("app.services.sentiment.settings") as mock_settings:
        mock_settings.GROQ_API_KEY = ""
        result = analyze_article_sentiment("Apple hits record high")
    assert result["sentiment"] == "neutral"
    assert result["score"] == 0.0


def test_analyze_article_mock_positive():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"sentiment": "positive", "score": 0.8, "confidence": 0.9, "impact": "high", "category": "earnings", "reasoning": "Strong earnings beat"}'
    mock_client.chat.completions.create.return_value = mock_response

    with patch("app.services.sentiment.get_groq_client", return_value=mock_client):
        result = analyze_article_sentiment("Apple beats earnings estimates by 20%")

    assert result["sentiment"] == "positive"
    assert result["score"] == 0.8
    assert result["confidence"] == 0.9


def test_analyze_article_mock_negative():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"sentiment": "negative", "score": -0.7, "confidence": 0.85, "impact": "high", "category": "macro", "reasoning": "Fed rate hike fears"}'
    mock_client.chat.completions.create.return_value = mock_response

    with patch("app.services.sentiment.get_groq_client", return_value=mock_client):
        result = analyze_article_sentiment("Fed signals more rate hikes ahead")

    assert result["sentiment"] == "negative"
    assert result["score"] == -0.7


def test_batch_empty_articles():
    result = analyze_batch_sentiment([])
    assert result["overall_score"] == 0.0
    assert result["article_count"] == 0
    assert result["analyzed_count"] == 0


def test_batch_sentiment_structure():
    articles = [
        {"title": "Apple surges", "description": "Strong earnings"},
        {"title": "Market falls", "description": "Rate fears"},
    ]

    mock_positive = {
        "sentiment": "positive",
        "score": 0.8,
        "confidence": 0.9,
        "impact": "high",
        "category": "earnings",
        "reasoning": "Good",
    }
    mock_negative = {
        "sentiment": "negative",
        "score": -0.6,
        "confidence": 0.8,
        "impact": "medium",
        "category": "macro",
        "reasoning": "Bad",
    }

    with patch(
        "app.services.sentiment.analyze_article_sentiment",
        side_effect=[mock_positive, mock_negative],
    ):
        result = analyze_batch_sentiment(articles)

    assert "overall_score" in result
    assert "overall_sentiment" in result
    assert "positive_count" in result
    assert "negative_count" in result
    assert result["positive_count"] == 1
    assert result["negative_count"] == 1


def test_batch_limits_to_ten():
    articles = [{"title": f"Article {i}", "description": ""} for i in range(15)]
    mock_sentiment = {
        "sentiment": "neutral",
        "score": 0.0,
        "confidence": 0.5,
        "impact": "low",
        "category": "other",
        "reasoning": "",
    }

    with patch(
        "app.services.sentiment.analyze_article_sentiment",
        return_value=mock_sentiment,
    ) as mock_fn:
        result = analyze_batch_sentiment(articles)

    assert mock_fn.call_count <= 10
    assert result["analyzed_count"] <= 10


if __name__ == "__main__":
    tests = [
        test_neutral_sentiment_structure,
        test_no_api_key_returns_neutral,
        test_analyze_article_mock_positive,
        test_analyze_article_mock_negative,
        test_batch_empty_articles,
        test_batch_sentiment_structure,
        test_batch_limits_to_ten,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
