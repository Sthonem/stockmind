import logging

import numpy as np
import pandas as pd

from app.services.indicators import calculate_macd, calculate_rsi
from app.services.market_data import get_ohlcv

logger = logging.getLogger(__name__)


def evaluate_rsi_signals(df: pd.DataFrame, forward_days: int = 5) -> dict:
    closes = df["close"]
    rsi = calculate_rsi(closes)

    overbought_signals = []
    oversold_signals = []

    for i in range(len(rsi) - forward_days):
        rsi_val = rsi.iloc[i]
        if pd.isna(rsi_val):
            continue

        future_return = (closes.iloc[i + forward_days] - closes.iloc[i]) / closes.iloc[
            i
        ]

        if rsi_val >= 70:
            overbought_signals.append(
                {
                    "rsi": float(rsi_val),
                    "future_return": float(future_return),
                    "correct": future_return < 0,
                }
            )
        elif rsi_val <= 30:
            oversold_signals.append(
                {
                    "rsi": float(rsi_val),
                    "future_return": float(future_return),
                    "correct": future_return > 0,
                }
            )

    def summarize(signals: list, signal_type: str) -> dict:
        if not signals:
            return {
                "count": 0,
                "accuracy": None,
                "avg_return": None,
                "signal_type": signal_type,
            }
        correct = sum(1 for s in signals if s["correct"])
        avg_return = np.mean([s["future_return"] for s in signals]) * 100
        return {
            "count": len(signals),
            "accuracy": round(correct / len(signals) * 100, 1),
            "avg_return_pct": round(float(avg_return), 2),
            "signal_type": signal_type,
        }

    return {
        "overbought": summarize(overbought_signals, "sell"),
        "oversold": summarize(oversold_signals, "buy"),
        "forward_days": forward_days,
    }


def evaluate_macd_signals(df: pd.DataFrame, forward_days: int = 5) -> dict:
    closes = df["close"]
    macd_result = calculate_macd(closes)
    histogram = macd_result["histogram"]

    bullish_crossovers = []
    bearish_crossovers = []

    for i in range(1, len(histogram) - forward_days):
        if pd.isna(histogram.iloc[i]) or pd.isna(histogram.iloc[i - 1]):
            continue

        future_return = (closes.iloc[i + forward_days] - closes.iloc[i]) / closes.iloc[
            i
        ]

        if histogram.iloc[i] > 0 and histogram.iloc[i - 1] <= 0:
            bullish_crossovers.append(
                {
                    "histogram": float(histogram.iloc[i]),
                    "future_return": float(future_return),
                    "correct": future_return > 0,
                }
            )
        elif histogram.iloc[i] < 0 and histogram.iloc[i - 1] >= 0:
            bearish_crossovers.append(
                {
                    "histogram": float(histogram.iloc[i]),
                    "future_return": float(future_return),
                    "correct": future_return < 0,
                }
            )

    def summarize(signals: list, signal_type: str) -> dict:
        if not signals:
            return {
                "count": 0,
                "accuracy": None,
                "avg_return": None,
                "signal_type": signal_type,
            }
        correct = sum(1 for s in signals if s["correct"])
        avg_return = np.mean([s["future_return"] for s in signals]) * 100
        return {
            "count": len(signals),
            "accuracy": round(correct / len(signals) * 100, 1),
            "avg_return_pct": round(float(avg_return), 2),
            "signal_type": signal_type,
        }

    return {
        "bullish_crossover": summarize(bullish_crossovers, "buy"),
        "bearish_crossover": summarize(bearish_crossovers, "sell"),
        "forward_days": forward_days,
    }


def validate_signals_for_ticker(
    ticker: str,
    period: str = "1y",
    forward_days: int = 5,
) -> dict:
    try:
        df = get_ohlcv(ticker, period=period)

        rsi_validation = evaluate_rsi_signals(df, forward_days)
        macd_validation = evaluate_macd_signals(df, forward_days)

        all_accuracies = []
        for section in [
            rsi_validation["overbought"],
            rsi_validation["oversold"],
            macd_validation["bullish_crossover"],
            macd_validation["bearish_crossover"],
        ]:
            if section.get("accuracy") is not None:
                all_accuracies.append(section["accuracy"])

        avg_accuracy = round(np.mean(all_accuracies), 1) if all_accuracies else None

        reliability = "unknown"
        if avg_accuracy is not None:
            if avg_accuracy >= 60:
                reliability = "reliable"
            elif avg_accuracy >= 50:
                reliability = "moderate"
            else:
                reliability = "unreliable"

        return {
            "ticker": ticker,
            "period": period,
            "forward_days": forward_days,
            "data_points": len(df),
            "rsi_signals": rsi_validation,
            "macd_signals": macd_validation,
            "overall_accuracy": avg_accuracy,
            "reliability": reliability,
            "note": f"Signals evaluated on {forward_days}-day forward returns",
        }

    except Exception as e:
        logger.error(f"Signal validation failed for {ticker}: {e}")
        return {"ticker": ticker, "error": str(e)}
