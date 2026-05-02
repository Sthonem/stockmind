import json
import logging

from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)


def get_groq_client():
    if not settings.GROQ_API_KEY:
        return None
    return Groq(api_key=settings.GROQ_API_KEY)


def analyze_article_sentiment(title: str, description: str = "") -> dict:
    client = get_groq_client()
    if not client:
        return _neutral_sentiment("No GROQ_API_KEY configured")

    text = f"Title: {title}"
    if description:
        text += f"\nDescription: {description}"

    prompt = f"""Analyze the sentiment of this financial news for stock market impact.

{text}

Respond ONLY with a JSON object, no other text:
{{
  "sentiment": "positive" | "negative" | "neutral",
  "score": <float between -1.0 and 1.0>,
  "confidence": <float between 0.0 and 1.0>,
  "impact": "high" | "medium" | "low",
  "category": "earnings" | "macro" | "sector" | "company" | "regulation" | "other",
  "reasoning": "<one sentence>"
}}"""

    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            max_tokens=200,
        )
        raw = response.choices[0].message.content.strip()
        clean = raw.replace("```json", "").replace("```", "").strip()
        result = json.loads(clean)

        return {
            "sentiment": result.get("sentiment", "neutral"),
            "score": float(result.get("score", 0.0)),
            "confidence": float(result.get("confidence", 0.5)),
            "impact": result.get("impact", "low"),
            "category": result.get("category", "other"),
            "reasoning": result.get("reasoning", ""),
        }

    except json.JSONDecodeError as e:
        logger.error(f"Sentiment JSON parse error: {e} — raw: {raw}")
        return _neutral_sentiment("Parse error")
    except Exception as e:
        logger.error(f"Sentiment analysis failed: {e}")
        return _neutral_sentiment(str(e))


def analyze_batch_sentiment(articles: list) -> dict:
    if not articles:
        return {
            "overall_score": 0.0,
            "overall_sentiment": "neutral",
            "article_count": 0,
            "analyzed_count": 0,
            "positive_count": 0,
            "negative_count": 0,
            "neutral_count": 0,
            "articles": [],
        }

    analyzed = []
    scores = []

    for article in articles[:10]:
        sentiment = analyze_article_sentiment(
            title=article.get("title", ""),
            description=article.get("description", ""),
        )
        analyzed.append(
            {
                **article,
                "sentiment_analysis": sentiment,
            }
        )
        scores.append(sentiment["score"] * sentiment["confidence"])

    overall_score = sum(scores) / len(scores) if scores else 0.0

    positive = sum(
        1 for a in analyzed if a["sentiment_analysis"]["sentiment"] == "positive"
    )
    negative = sum(
        1 for a in analyzed if a["sentiment_analysis"]["sentiment"] == "negative"
    )
    neutral = len(analyzed) - positive - negative

    if overall_score > 0.15:
        overall_sentiment = "positive"
    elif overall_score < -0.15:
        overall_sentiment = "negative"
    else:
        overall_sentiment = "neutral"

    return {
        "overall_score": round(overall_score, 3),
        "overall_sentiment": overall_sentiment,
        "article_count": len(articles),
        "analyzed_count": len(analyzed),
        "positive_count": positive,
        "negative_count": negative,
        "neutral_count": neutral,
        "articles": analyzed,
    }


def _neutral_sentiment(reason: str = "") -> dict:
    return {
        "sentiment": "neutral",
        "score": 0.0,
        "confidence": 0.0,
        "impact": "low",
        "category": "other",
        "reasoning": reason,
    }
