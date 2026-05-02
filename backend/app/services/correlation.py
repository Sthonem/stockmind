import logging

import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.portfolio import Position
from app.services.market_data import get_ohlcv

logger = logging.getLogger(__name__)


def calculate_correlation_matrix(prices_dict: dict[str, pd.Series]) -> dict:
    if len(prices_dict) < 2:
        return {"error": "Need at least 2 tickers for correlation"}

    df = pd.DataFrame(prices_dict)
    df = df.dropna()

    if len(df) < 20:
        return {"error": "Insufficient price history for correlation"}

    returns = df.pct_change().dropna()
    corr_matrix = returns.corr()

    pairs = []
    tickers = list(prices_dict.keys())
    for i in range(len(tickers)):
        for j in range(i + 1, len(tickers)):
            t1, t2 = tickers[i], tickers[j]
            corr_value = corr_matrix.loc[t1, t2]
            if pd.isna(corr_value):
                continue

            if corr_value >= 0.8:
                relationship = "highly_correlated"
                risk_note = "High overlap — these positions move together, reducing diversification benefit"
            elif corr_value >= 0.5:
                relationship = "moderately_correlated"
                risk_note = "Moderate overlap — some diversification benefit"
            elif corr_value >= 0.2:
                relationship = "weakly_correlated"
                risk_note = "Good diversification — positions are mostly independent"
            elif corr_value >= -0.2:
                relationship = "uncorrelated"
                risk_note = "Excellent diversification — positions are independent"
            else:
                relationship = "negatively_correlated"
                risk_note = "Natural hedge — positions tend to move in opposite directions"

            pairs.append(
                {
                    "ticker_1": t1,
                    "ticker_2": t2,
                    "correlation": round(float(corr_value), 3),
                    "relationship": relationship,
                    "risk_note": risk_note,
                }
            )

    pairs_sorted = sorted(pairs, key=lambda x: abs(x["correlation"]), reverse=True)

    matrix_dict = {}
    for ticker in tickers:
        matrix_dict[ticker] = {
            other: round(float(corr_matrix.loc[ticker, other]), 3)
            for other in tickers
        }

    high_corr_pairs = [p for p in pairs if p["correlation"] >= 0.8]
    avg_correlation = np.mean([p["correlation"] for p in pairs]) if pairs else 0.0

    return {
        "tickers": tickers,
        "matrix": matrix_dict,
        "pairs": pairs_sorted,
        "high_correlation_pairs": high_corr_pairs,
        "average_correlation": round(float(avg_correlation), 3),
        "data_points": len(returns),
        "warning": "High correlation detected between some positions"
        if high_corr_pairs
        else None,
    }


async def get_portfolio_correlation(
    portfolio_id: int,
    db: AsyncSession,
    period: str = "6mo",
) -> dict:
    result = await db.execute(
        select(Position).where(Position.portfolio_id == portfolio_id)
    )
    positions = result.scalars().all()

    if len(positions) < 2:
        return {
            "portfolio_id": portfolio_id,
            "error": "Need at least 2 positions for correlation analysis",
        }

    prices_dict = {}
    failed = []

    for position in positions:
        try:
            df = get_ohlcv(position.ticker, period=period)
            prices_dict[position.ticker] = df["close"]
        except Exception as e:
            logger.warning(f"Could not fetch data for {position.ticker}: {e}")
            failed.append(position.ticker)

    if len(prices_dict) < 2:
        return {
            "portfolio_id": portfolio_id,
            "error": "Insufficient price data for correlation",
            "failed_tickers": failed,
        }

    corr_result = calculate_correlation_matrix(prices_dict)
    corr_result["portfolio_id"] = portfolio_id
    corr_result["failed_tickers"] = failed

    return corr_result
