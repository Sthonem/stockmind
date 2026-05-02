from typing import Optional

import pandas as pd


def calculate_atr(df: pd.DataFrame, period: int = 14) -> pd.Series:
    high = df["high"]
    low = df["low"]
    close = df["close"]

    tr1 = high - low
    tr2 = (high - close.shift(1)).abs()
    tr3 = (low - close.shift(1)).abs()

    true_range = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = true_range.ewm(span=period, adjust=False).mean()
    return atr


def calculate_stop_loss(
    current_price: float,
    atr: float,
    risk_score: float,
    avg_buy_price: Optional[float] = None,
    atr_multiplier: float = 2.0,
) -> dict:
    if risk_score >= 70:
        multiplier = atr_multiplier * 0.75
    elif risk_score >= 40:
        multiplier = atr_multiplier
    else:
        multiplier = atr_multiplier * 1.25

    atr_stop = current_price - (atr * multiplier)

    pct_from_current = ((current_price - atr_stop) / current_price) * 100

    result = {
        "current_price": round(current_price, 2),
        "stop_loss_price": round(atr_stop, 2),
        "atr": round(atr, 2),
        "atr_multiplier": round(multiplier, 2),
        "pct_below_current": round(pct_from_current, 2),
        "method": "ATR-based",
    }

    if avg_buy_price:
        pct_from_buy = ((current_price - atr_stop) / avg_buy_price) * 100
        profit_at_stop = ((atr_stop - avg_buy_price) / avg_buy_price) * 100
        result["avg_buy_price"] = round(avg_buy_price, 2)
        result["pct_loss_from_buy"] = round(pct_from_buy, 2)
        result["profit_at_stop"] = round(profit_at_stop, 2)
        result["stop_protects_profit"] = atr_stop > avg_buy_price

    if risk_score >= 70:
        result["urgency"] = "high"
        result["note"] = "High risk detected — tight stop-loss recommended"
    elif risk_score >= 40:
        result["urgency"] = "medium"
        result["note"] = "Moderate risk — standard stop-loss applied"
    else:
        result["urgency"] = "low"
        result["note"] = "Low risk — wider stop-loss gives room to breathe"

    return result


def analyze_stop_loss_for_ticker(
    df: pd.DataFrame,
    risk_score: float,
    avg_buy_price: Optional[float] = None,
) -> dict:
    atr_series = calculate_atr(df)
    latest_atr = atr_series.dropna().iloc[-1]
    current_price = df["close"].iloc[-1]

    return calculate_stop_loss(
        current_price=float(current_price),
        atr=float(latest_atr),
        risk_score=risk_score,
        avg_buy_price=avg_buy_price,
    )
