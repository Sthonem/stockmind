import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.news_categorizer import (
    IMPACT_WEIGHTS,
    categorize_article,
    categorize_articles,
    get_category_summary,
)


def test_earnings_category():
    result = categorize_article(
        "Apple beats earnings estimates by 20%",
        "Revenue exceeded expectations",
    )
    assert result["primary_category"] == "earnings"


def test_macro_category():
    result = categorize_article("Federal Reserve raises interest rates by 25 basis points")
    assert result["primary_category"] == "macro"


def test_merger_category():
    result = categorize_article("Microsoft acquires gaming company in $10B deal")
    assert result["primary_category"] == "merger_acquisition"


def test_analyst_category():
    result = categorize_article(
        "Goldman Sachs upgrades Apple with new price target of $200"
    )
    assert result["primary_category"] == "analyst"


def test_legal_category():
    result = categorize_article(
        "SEC investigation launched into company accounting practices"
    )
    assert result["primary_category"] == "legal_regulatory"


def test_other_category():
    result = categorize_article("Random article with no financial keywords xyz")
    assert result["primary_category"] == "other"


def test_urgent_detection():
    result = categorize_article("BREAKING: Stock market crash sends indexes plunging")
    assert result["is_urgent"] is True


def test_not_urgent():
    result = categorize_article("Apple reports steady quarterly earnings growth")
    assert result["is_urgent"] is False


def test_confidence_range():
    result = categorize_article("Apple beats earnings", "Strong revenue growth")
    assert 0.0 <= result["confidence"] <= 1.0


def test_impact_weight_assigned():
    result = categorize_article("Apple beats earnings estimates")
    assert result["impact_weight"] == IMPACT_WEIGHTS["earnings"]


def test_categorize_articles_batch():
    articles = [
        {"title": "Apple earnings beat", "description": "Revenue up"},
        {"title": "Fed raises rates", "description": "Inflation concern"},
        {"title": "Tesla acquires startup", "description": "Deal announced"},
    ]
    result = categorize_articles(articles)
    assert len(result) == 3
    for article in result:
        assert "category" in article
        assert "primary_category" in article["category"]


def test_category_summary_structure():
    articles = [
        {"title": "Apple earnings beat", "description": ""},
        {"title": "Fed raises rates", "description": ""},
        {"title": "BREAKING: Market crash", "description": ""},
    ]
    summary = get_category_summary(articles)
    assert "total_articles" in summary
    assert "category_distribution" in summary
    assert "dominant_category" in summary
    assert "urgent_count" in summary
    assert summary["total_articles"] == 3
    assert summary["urgent_count"] >= 1


if __name__ == "__main__":
    tests = [
        test_earnings_category,
        test_macro_category,
        test_merger_category,
        test_analyst_category,
        test_legal_category,
        test_other_category,
        test_urgent_detection,
        test_not_urgent,
        test_confidence_range,
        test_impact_weight_assigned,
        test_categorize_articles_batch,
        test_category_summary_structure,
    ]
    for test in tests:
        try:
            test()
            print(f"PASS — {test.__name__}")
        except AssertionError as e:
            print(f"FAIL — {test.__name__}: {e}")
