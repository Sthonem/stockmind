import os
import sys
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.news import build_ticker_query, fetch_market_news, fetch_news


def test_build_query_with_company():
    q = build_ticker_query("AAPL", "Apple")
    assert "AAPL" in q
    assert "Apple" in q


def test_build_query_ticker_only():
    q = build_ticker_query("NVDA")
    assert "NVDA" in q


def test_fetch_news_no_api_key():
    with patch("app.services.news.settings") as mock_settings:
        mock_settings.NEWS_API_KEY = ""
        result = fetch_news("AAPL")
    assert result == []


def test_fetch_news_filters_removed():
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "articles": [
            {
                "title": "[Removed]",
                "description": "",
                "source": {"name": "Test"},
                "url": "",
                "publishedAt": "2025-01-01T00:00:00Z",
                "content": "",
            },
            {
                "title": "Apple hits record high",
                "description": "Apple stock surged today",
                "source": {"name": "Reuters"},
                "url": "https://reuters.com/test",
                "publishedAt": "2025-01-01T00:00:00Z",
                "content": "Apple stock surged...",
            },
        ]
    }
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.news.settings") as mock_settings:
        mock_settings.NEWS_API_KEY = "test_key"
        with patch("httpx.Client") as mock_client:
            mock_client.return_value.__enter__.return_value.get.return_value = mock_response
            result = fetch_news("AAPL")

    assert len(result) == 1
    assert result[0]["title"] == "Apple hits record high"


def test_fetch_news_structure():
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "articles": [
            {
                "title": "NVDA earnings beat",
                "description": "Nvidia reports strong earnings",
                "source": {"name": "Bloomberg"},
                "url": "https://bloomberg.com/test",
                "publishedAt": "2025-01-01T00:00:00Z",
                "content": "Full content here...",
            }
        ]
    }
    mock_response.raise_for_status = MagicMock()

    with patch("app.services.news.settings") as mock_settings:
        mock_settings.NEWS_API_KEY = "test_key"
        with patch("httpx.Client") as mock_client:
            mock_client.return_value.__enter__.return_value.get.return_value = mock_response
            result = fetch_news("NVDA")

    assert len(result) == 1
    article = result[0]
    assert "title" in article
    assert "source" in article
    assert "published_at" in article
    assert "url" in article


def test_fetch_market_news_no_api_key():
    with patch("app.services.news.settings") as mock_settings:
        mock_settings.NEWS_API_KEY = ""
        result = fetch_market_news()
    assert result == []


if __name__ == "__main__":
    tests = [
        test_build_query_with_company,
        test_build_query_ticker_only,
        test_fetch_news_no_api_key,
        test_fetch_news_filters_removed,
        test_fetch_news_structure,
        test_fetch_market_news_no_api_key,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
