import numpy as np
import pandas as pd


def detect_market_regime(closes: pd.Series, volume: pd.Series = None) -> dict:
    if len(closes) < 50:
        return {"regime": "unknown", "reason": "Insufficient data"}

    ema_20 = closes.ewm(span=20, adjust=False).mean()
    ema_50 = closes.ewm(span=50, adjust=False).mean()

    returns = closes.pct_change().dropna()
    volatility_20 = returns.rolling(20).std().iloc[-1] * np.sqrt(252)
    volatility_5 = returns.rolling(5).std().iloc[-1] * np.sqrt(252)

    latest_close = closes.iloc[-1]
    latest_ema20 = ema_20.iloc[-1]
    latest_ema50 = ema_50.iloc[-1]

    price_above_ema20 = latest_close > latest_ema20
    price_above_ema50 = latest_close > latest_ema50
    ema20_above_ema50 = latest_ema20 > latest_ema50

    high_volatility = volatility_20 > 0.30
    vol_expanding = volatility_5 > volatility_20

    momentum_5 = (closes.iloc[-1] - closes.iloc[-6]) / closes.iloc[-6]
    momentum_20 = (closes.iloc[-1] - closes.iloc[-21]) / closes.iloc[-21]

    signals = []

    if price_above_ema20 and price_above_ema50 and ema20_above_ema50:
        if high_volatility:
            regime = "volatile_bullish"
            description = "Uptrend with high volatility — momentum strong but choppy"
        else:
            regime = "trending_bullish"
            description = "Clean uptrend — momentum favors longs"
        signals.append("price above both EMAs")
        signals.append("EMA20 above EMA50")

    elif not price_above_ema20 and not price_above_ema50 and not ema20_above_ema50:
        if high_volatility:
            regime = "volatile_bearish"
            description = "Downtrend with high volatility — elevated risk"
        else:
            regime = "trending_bearish"
            description = "Clean downtrend — caution advised"
        signals.append("price below both EMAs")
        signals.append("EMA20 below EMA50")

    elif high_volatility and vol_expanding:
        regime = "high_volatility"
        description = "No clear trend — volatility expanding, wait for direction"
        signals.append("volatility expanding")

    else:
        regime = "ranging"
        description = "Market consolidating — no strong trend signal"
        signals.append("mixed EMA signals")

    implication = {
        "trending_bullish": "Technical signals more reliable — trend-following works",
        "volatile_bullish": "Use wider stop-losses — momentum strong but volatile",
        "trending_bearish": "Risk scores elevated — reduce exposure",
        "volatile_bearish": "High risk environment — tight stops or stay out",
        "high_volatility": "Risk scores less reliable — reduce position sizes",
        "ranging": "Mean-reversion more effective than trend-following",
        "unknown": "Cannot determine regime",
    }.get(regime, "")

    return {
        "regime": regime,
        "description": description,
        "implication_for_signals": implication,
        "signals_detected": signals,
        "metrics": {
            "volatility_20d_annualized": round(float(volatility_20), 3),
            "volatility_5d_annualized": round(float(volatility_5), 3),
            "momentum_5d_pct": round(float(momentum_5) * 100, 2),
            "momentum_20d_pct": round(float(momentum_20) * 100, 2),
            "price_vs_ema20": "above" if price_above_ema20 else "below",
            "price_vs_ema50": "above" if price_above_ema50 else "below",
            "ema20_vs_ema50": "above" if ema20_above_ema50 else "below",
        },
    }
