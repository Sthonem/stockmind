import pandas as pd

from app.services.indicators import (
    analyze_bollinger_bands,
    analyze_ema,
    analyze_macd,
    analyze_rsi,
)
from app.services.market_data import get_ohlcv


def direction_to_score(direction: str, strength: float) -> float:
    if direction == "bullish":
        return strength
    elif direction == "bearish":
        return -strength
    return 0.0


def analyze_ticker(ticker: str, period: str = "6mo") -> dict:
    df = get_ohlcv(ticker, period=period)
    closes = df["close"]

    rsi = analyze_rsi(closes)
    macd = analyze_macd(closes)
    bb = analyze_bollinger_bands(closes)
    ema = analyze_ema(closes)

    rsi_score = direction_to_score(rsi["direction"], rsi["strength"])
    macd_score = direction_to_score(macd["direction"], macd["strength"])
    bb_score = direction_to_score(bb["direction"], bb["strength"])
    ema_score = direction_to_score(ema["direction"], ema["strength"])

    weights = {"rsi": 0.30, "macd": 0.30, "bb": 0.20, "ema": 0.20}
    composite_score = (
        rsi_score * weights["rsi"]
        + macd_score * weights["macd"]
        + bb_score * weights["bb"]
        + ema_score * weights["ema"]
    )

    if composite_score > 0.3:
        overall_signal = "bullish"
    elif composite_score < -0.3:
        overall_signal = "bearish"
    else:
        overall_signal = "neutral"

    bullish_count = sum(
        1
        for d in [
            rsi["direction"],
            macd["direction"],
            bb["direction"],
            ema["direction"],
        ]
        if d == "bullish"
    )

    bearish_count = sum(
        1
        for d in [
            rsi["direction"],
            macd["direction"],
            bb["direction"],
            ema["direction"],
        ]
        if d == "bearish"
    )

    return {
        "ticker": ticker,
        "overall_signal": overall_signal,
        "composite_score": round(composite_score, 3),
        "bullish_indicators": bullish_count,
        "bearish_indicators": bearish_count,
        "neutral_indicators": 4 - bullish_count - bearish_count,
        "indicators": {
            "rsi": {
                "value": rsi["rsi"],
                "signal": rsi["signal"],
                "direction": rsi["direction"],
                "strength": rsi["strength"],
            },
            "macd": {
                "value": macd["macd"],
                "signal": macd["signal"],
                "direction": macd["direction"],
                "strength": macd["strength"],
            },
            "bollinger_bands": {
                "percent_b": bb["percent_b"],
                "signal": bb["signal"],
                "direction": bb["direction"],
                "strength": bb["strength"],
            },
            "ema": {
                "signal": ema["signal"],
                "direction": ema["direction"],
                "strength": ema["strength"],
                "price_vs_ema_short": ema["price_vs_ema_short"],
                "price_vs_ema_long": ema["price_vs_ema_long"],
            },
        },
        "latest_price": round(float(closes.iloc[-1]), 2),
        "data_points": len(closes),
    }
