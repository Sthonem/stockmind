from typing import Optional

import pandas as pd


def normalize_rsi_risk(rsi_value: float) -> float:
    if rsi_value >= 70:
        return min((rsi_value - 70) / 30, 1.0)
    elif rsi_value <= 30:
        return min((30 - rsi_value) / 30, 1.0) * 0.5
    else:
        return 0.0


def normalize_macd_risk(histogram: float, macd_value: float) -> float:
    if macd_value == 0:
        return 0.0
    ratio = abs(histogram) / (abs(macd_value) + 1e-9)
    if histogram < 0:
        return min(ratio, 1.0)
    else:
        return min(ratio, 1.0) * 0.3


def normalize_bb_risk(percent_b: float) -> float:
    if percent_b > 1.0:
        return min((percent_b - 1.0) * 5 + 0.8, 1.0)
    elif percent_b > 0.8:
        return 0.4 + (percent_b - 0.8) * 2.0
    elif percent_b < 0.0:
        return min(abs(percent_b) * 5 + 0.8, 1.0) * 0.5
    elif percent_b < 0.2:
        return (0.2 - percent_b) * 2.0 * 0.5
    else:
        return 0.0


def normalize_ema_risk(direction: str, strength: float) -> float:
    if direction == "bearish":
        return min(strength, 1.0)
    elif direction == "bullish":
        return min(strength, 1.0) * 0.2
    return 0.0


def normalize_sentiment_risk(sentiment_score: Optional[float]) -> float:
    if sentiment_score is None:
        return 0.0
    if sentiment_score < 0:
        return min(abs(sentiment_score), 1.0)
    return min(sentiment_score, 1.0) * 0.2


def compute_risk_score(
    rsi_value: float,
    macd_histogram: float,
    macd_value: float,
    bb_percent_b: float,
    ema_direction: str,
    ema_strength: float,
    sentiment_score: Optional[float] = None,
) -> dict:
    rsi_risk = normalize_rsi_risk(rsi_value)
    macd_risk = normalize_macd_risk(macd_histogram, macd_value)
    bb_risk = normalize_bb_risk(bb_percent_b)
    ema_risk = normalize_ema_risk(ema_direction, ema_strength)
    sentiment_risk = normalize_sentiment_risk(sentiment_score)

    weights = {
        "rsi": 0.25,
        "macd": 0.25,
        "bb": 0.20,
        "ema": 0.15,
        "sentiment": 0.15,
    }

    raw_score = (
        rsi_risk * weights["rsi"]
        + macd_risk * weights["macd"]
        + bb_risk * weights["bb"]
        + ema_risk * weights["ema"]
        + sentiment_risk * weights["sentiment"]
    )

    score = round(raw_score * 100, 1)

    if score >= 70:
        level = "high"
        recommendation = "Consider reducing position or setting tight stop-loss"
    elif score >= 40:
        level = "medium"
        recommendation = "Monitor closely, volatility likely"
    else:
        level = "low"
        recommendation = "Position looks stable"

    return {
        "score": score,
        "level": level,
        "recommendation": recommendation,
        "components": {
            "rsi_risk": round(rsi_risk, 3),
            "macd_risk": round(macd_risk, 3),
            "bb_risk": round(bb_risk, 3),
            "ema_risk": round(ema_risk, 3),
            "sentiment_risk": round(sentiment_risk, 3),
        },
        "weights": weights,
    }
