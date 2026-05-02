import logging

import numpy as np
import pandas as pd

from app.services.market_data import get_ohlcv

logger = logging.getLogger(__name__)


def calculate_win_rate_and_avg(returns: pd.Series) -> dict:
    positive = returns[returns > 0]
    negative = returns[returns < 0]

    win_rate = len(positive) / len(returns) if len(returns) > 0 else 0.5
    avg_win = float(positive.mean()) if len(positive) > 0 else 0.01
    avg_loss = float(abs(negative.mean())) if len(negative) > 0 else 0.01

    return {
        "win_rate": round(win_rate, 3),
        "avg_win": round(avg_win, 4),
        "avg_loss": round(avg_loss, 4),
        "win_loss_ratio": round(avg_win / avg_loss, 3) if avg_loss > 0 else 1.0,
    }


def kelly_criterion(win_rate: float, win_loss_ratio: float) -> float:
    if win_loss_ratio <= 0:
        return 0.0
    kelly = win_rate - ((1 - win_rate) / win_loss_ratio)
    return max(0.0, kelly)


def calculate_position_size(
    ticker: str,
    portfolio_value: float,
    risk_score: float,
    win_rate: float = None,
    win_loss_ratio: float = None,
    max_position_pct: float = 0.25,
) -> dict:
    if win_rate is None:
        win_rate = 0.52
    if win_loss_ratio is None:
        win_loss_ratio = 1.2

    full_kelly = kelly_criterion(win_rate, win_loss_ratio)
    half_kelly = full_kelly * 0.5

    if risk_score >= 70:
        risk_adjustment = 0.4
        risk_note = "High risk — Kelly reduced to 40%"
    elif risk_score >= 40:
        risk_adjustment = 0.7
        risk_note = "Medium risk — Kelly reduced to 70%"
    else:
        risk_adjustment = 1.0
        risk_note = "Low risk — full adjusted Kelly applied"

    adjusted_kelly = half_kelly * risk_adjustment
    final_pct = min(adjusted_kelly, max_position_pct)
    final_pct = max(final_pct, 0.01)

    recommended_pct = round(final_pct * 100, 2)
    recommended_value = portfolio_value * (recommended_pct / 100)
    recommended_value = round(recommended_value, 2)

    return {
        "ticker": ticker,
        "portfolio_value": round(portfolio_value, 2),
        "win_rate": round(win_rate, 3),
        "win_loss_ratio": round(win_loss_ratio, 3),
        "full_kelly_pct": round(full_kelly * 100, 2),
        "half_kelly_pct": round(half_kelly * 100, 2),
        "risk_adjustment": risk_adjustment,
        "risk_note": risk_note,
        "recommended_pct": recommended_pct,
        "recommended_value": recommended_value,
        "max_position_pct": max_position_pct * 100,
        "capped": final_pct == max_position_pct,
    }


def calculate_position_size_from_history(
    ticker: str,
    portfolio_value: float,
    risk_score: float,
    period: str = "1y",
    max_position_pct: float = 0.25,
) -> dict:
    try:
        df = get_ohlcv(ticker, period=period)
        returns = df["close"].pct_change().dropna()

        stats = calculate_win_rate_and_avg(returns)
        result = calculate_position_size(
            ticker=ticker,
            portfolio_value=portfolio_value,
            risk_score=risk_score,
            win_rate=stats["win_rate"],
            win_loss_ratio=stats["win_loss_ratio"],
            max_position_pct=max_position_pct,
        )
        result["data_source"] = "historical"
        result["data_points"] = len(returns)
        result["historical_stats"] = stats
        return result

    except Exception as e:
        logger.warning(f"Could not fetch history for {ticker}: {e} — using defaults")
        result = calculate_position_size(
            ticker=ticker,
            portfolio_value=portfolio_value,
            risk_score=risk_score,
            max_position_pct=max_position_pct,
        )
        result["data_source"] = "default_assumptions"
        result["data_points"] = 0
        return result
