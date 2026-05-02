import re
from typing import Optional

CATEGORY_KEYWORDS = {
    "earnings": [
        "earnings",
        "revenue",
        "profit",
        "EPS",
        "beat",
        "miss",
        "quarterly",
        "guidance",
        "forecast",
        "results",
        "income",
    ],
    "macro": [
        "fed",
        "federal reserve",
        "interest rate",
        "inflation",
        "CPI",
        "GDP",
        "unemployment",
        "recession",
        "rate hike",
        "rate cut",
        "powell",
        "monetary policy",
        "treasury",
        "yield",
    ],
    "merger_acquisition": [
        "acquisition",
        "merger",
        "buyout",
        "takeover",
        "deal",
        "acquire",
        "purchase",
        "bid",
        "offer",
        "transaction",
    ],
    "insider": [
        "insider",
        "CEO sold",
        "CEO bought",
        "executive",
        "director sold",
        "form 4",
        "SEC filing",
        "stake",
        "ownership",
    ],
    "analyst": [
        "upgrade",
        "downgrade",
        "price target",
        "buy rating",
        "sell rating",
        "analyst",
        "outperform",
        "underperform",
        "overweight",
        "underweight",
        "initiated",
        "coverage",
    ],
    "product": [
        "launch",
        "product",
        "release",
        "new model",
        "unveiled",
        "announced",
        "partnership",
        "contract",
        "deal",
        "collaboration",
    ],
    "legal_regulatory": [
        "lawsuit",
        "SEC",
        "investigation",
        "fine",
        "penalty",
        "antitrust",
        "regulatory",
        "compliance",
        "court",
        "settlement",
        "probe",
    ],
    "sector": [
        "industry",
        "sector",
        "market share",
        "competition",
        "competitor",
        "supply chain",
        "tariff",
        "trade",
    ],
}

IMPACT_WEIGHTS = {
    "earnings": 1.0,
    "macro": 0.9,
    "merger_acquisition": 1.0,
    "insider": 0.8,
    "analyst": 0.7,
    "legal_regulatory": 0.9,
    "product": 0.6,
    "sector": 0.5,
    "other": 0.3,
}


def categorize_article(title: str, description: str = "") -> dict:
    text = f"{title} {description}".lower()
    category_scores = {}

    for category, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text)
        if score > 0:
            category_scores[category] = score

    if not category_scores:
        primary_category = "other"
        confidence = 0.5
    else:
        primary_category = max(category_scores, key=category_scores.get)
        max_score = category_scores[primary_category]
        confidence = min(max_score / 3.0, 1.0)

    secondary_categories = [
        cat
        for cat, score in sorted(
            category_scores.items(),
            key=lambda x: x[1],
            reverse=True,
        )
        if cat != primary_category
    ][:2]

    impact_weight = IMPACT_WEIGHTS.get(primary_category, 0.3)

    is_urgent = any(
        word in text
        for word in [
            "breaking",
            "alert",
            "urgent",
            "just in",
            "developing",
            "crash",
            "surge",
            "soar",
            "plunge",
            "halt",
            "suspend",
        ]
    )

    return {
        "primary_category": primary_category,
        "secondary_categories": secondary_categories,
        "confidence": round(confidence, 2),
        "impact_weight": impact_weight,
        "is_urgent": is_urgent,
        "category_scores": category_scores,
    }


def categorize_articles(articles: list) -> list:
    categorized = []
    for article in articles:
        category_info = categorize_article(
            title=article.get("title", ""),
            description=article.get("description", ""),
        )
        categorized.append({**article, "category": category_info})
    return categorized


def get_category_summary(articles: list) -> dict:
    categorized = categorize_articles(articles)
    category_counts = {}
    urgent_articles = []

    for article in categorized:
        cat = article["category"]["primary_category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1
        if article["category"]["is_urgent"]:
            urgent_articles.append(article.get("title", ""))

    dominant_category = (
        max(category_counts, key=category_counts.get) if category_counts else "other"
    )

    return {
        "total_articles": len(articles),
        "category_distribution": category_counts,
        "dominant_category": dominant_category,
        "urgent_articles": urgent_articles,
        "urgent_count": len(urgent_articles),
        "articles": categorized,
    }
