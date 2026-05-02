import logging

import numpy as np
import pandas as pd

from app.services.indicators import (
    calculate_bollinger_bands,
    calculate_macd,
    calculate_rsi,
)
from app.services.market_data import get_ohlcv

logger = logging.getLogger(__name__)


def generate_signals(df: pd.DataFrame) -> pd.Series:
    closes = df["close"]
    rsi = calculate_rsi(closes)
    macd_result = calculate_macd(closes)
    bb_result = calculate_bollinger_bands(closes)

    signals = pd.Series(0, index=df.index)

    buy_condition = (
        (rsi < 35)
        | (macd_result["histogram"] > 0)
        & (macd_result["histogram"].shift(1) <= 0)
        | (closes < bb_result["lower"])
    )

    sell_condition = (
        (rsi > 65)
        | (macd_result["histogram"] < 0)
        & (macd_result["histogram"].shift(1) >= 0)
        | (closes > bb_result["upper"])
    )

    signals[buy_condition] = 1
    signals[sell_condition] = -1
    return signals


def run_backtest(
    ticker: str,
    period: str = "1y",
    initial_capital: float = 10000.0,
    commission_pct: float = 0.001,
) -> dict:
    df = get_ohlcv(ticker, period=period)
    signals = generate_signals(df)

    capital = initial_capital
    position = 0.0
    shares = 0.0
    trades = []
    portfolio_values = []
    entry_price = 0.0

    for i in range(1, len(df)):
        date = df.index[i]
        price = float(df["close"].iloc[i])
        signal = signals.iloc[i]

        if signal == 1 and position == 0:
            commission = capital * commission_pct
            shares = (capital - commission) / price
            entry_price = price
            position = 1
            capital = 0.0
            trades.append(
                {
                    "type": "buy",
                    "date": str(date.date()),
                    "price": round(price, 2),
                    "shares": round(shares, 4),
                }
            )

        elif signal == -1 and position == 1:
            gross = shares * price
            commission = gross * commission_pct
            capital = gross - commission
            pnl = capital - (shares * entry_price)
            pnl_pct = (pnl / (shares * entry_price)) * 100
            trades[-1]["exit_date"] = str(date.date())
            trades[-1]["exit_price"] = round(price, 2)
            trades[-1]["pnl"] = round(pnl, 2)
            trades[-1]["pnl_pct"] = round(pnl_pct, 2)
            position = 0
            shares = 0.0

        current_value = capital + (shares * price if position == 1 else 0)
        portfolio_values.append(
            {
                "date": str(date.date()),
                "value": round(current_value, 2),
            }
        )

    if position == 1:
        final_price = float(df["close"].iloc[-1])
        final_value = shares * final_price
        capital = final_value

    final_value = capital
    total_return = ((final_value - initial_capital) / initial_capital) * 100

    completed_trades = [t for t in trades if "pnl" in t]
    winning_trades = [t for t in completed_trades if t["pnl"] > 0]
    losing_trades = [t for t in completed_trades if t["pnl"] <= 0]

    win_rate = len(winning_trades) / len(completed_trades) if completed_trades else 0
    avg_win = np.mean([t["pnl_pct"] for t in winning_trades]) if winning_trades else 0
    avg_loss = np.mean([t["pnl_pct"] for t in losing_trades]) if losing_trades else 0

    values = [p["value"] for p in portfolio_values]
    if values:
        peak = values[0]
        max_drawdown = 0.0
        for v in values:
            if v > peak:
                peak = v
            drawdown = (peak - v) / peak * 100
            if drawdown > max_drawdown:
                max_drawdown = drawdown
    else:
        max_drawdown = 0.0

    buy_hold_return = (
        (float(df["close"].iloc[-1]) - float(df["close"].iloc[0]))
        / float(df["close"].iloc[0])
    ) * 100

    returns_series = pd.Series([p["value"] for p in portfolio_values]).pct_change().dropna()
    sharpe = (
        returns_series.mean() / returns_series.std() * np.sqrt(252)
        if len(returns_series) > 1 and returns_series.std() > 0
        else 0.0
    )

    return {
        "ticker": ticker,
        "period": period,
        "initial_capital": initial_capital,
        "final_value": round(final_value, 2),
        "total_return_pct": round(total_return, 2),
        "buy_hold_return_pct": round(buy_hold_return, 2),
        "outperformed_buy_hold": total_return > buy_hold_return,
        "total_trades": len(completed_trades),
        "winning_trades": len(winning_trades),
        "losing_trades": len(losing_trades),
        "win_rate_pct": round(win_rate * 100, 2),
        "avg_win_pct": round(float(avg_win), 2),
        "avg_loss_pct": round(float(avg_loss), 2),
        "max_drawdown_pct": round(max_drawdown, 2),
        "sharpe_ratio": round(float(sharpe), 3),
        "trades": trades[-20:],
        "portfolio_values": portfolio_values[-60:],
    }
