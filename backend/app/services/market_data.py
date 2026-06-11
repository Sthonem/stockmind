from typing import Optional

import pandas as pd
import yfinance as yf


def get_stock_info(ticker: str) -> dict:
    stock = yf.Ticker(ticker)
    info = stock.info
    return {
        "ticker": ticker.upper(),
        "name": info.get("longName", ticker),
        "sector": info.get("sector", "Unknown"),
        "industry": info.get("industry", "Unknown"),
        "currency": info.get("currency", "USD"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
        "previous_close": info.get("previousClose"),
        "market_cap": info.get("marketCap"),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        "avg_volume": info.get("averageVolume"),
    }


def get_ohlcv(ticker: str, period: str = "6mo", interval: str = "1d") -> pd.DataFrame:
    stock = yf.Ticker(ticker)
    df = stock.history(period=period, interval=interval)
    if df.empty:
        raise ValueError(f"No data found for ticker: {ticker}")
    df.index = pd.to_datetime(df.index)
    df = df[["Open", "High", "Low", "Close", "Volume"]]
    df.columns = ["open", "high", "low", "close", "volume"]
    df = df.dropna()
    return df


def get_current_price(ticker: str) -> Optional[float]:
    try:
        stock = yf.Ticker(ticker)
        info = stock.info
        return info.get("currentPrice") or info.get("regularMarketPrice")
    except Exception:
        return None


def get_multiple_prices(tickers: list[str]) -> dict[str, Optional[float]]:
    result = {}
    for ticker in tickers:
        result[ticker] = get_current_price(ticker)
    return result


MARKET_INDICES = [
    {"symbol": "^GSPC", "name": "S&P 500"},
    {"symbol": "^IXIC", "name": "NASDAQ"},
    {"symbol": "^DJI", "name": "DOW"},
    {"symbol": "^VIX", "name": "VIX"},
]


def get_market_indices() -> list[dict]:
    """Live snapshot of the major US indices with a 7-day sparkline."""
    results = []
    for index in MARKET_INDICES:
        try:
            df = get_ohlcv(index["symbol"], period="1mo")
            closes = df["close"].tolist()
            if len(closes) < 2:
                continue
            last = closes[-1]
            prev = closes[-2]
            change_pct = ((last - prev) / prev) * 100 if prev else 0.0
            results.append(
                {
                    "symbol": index["symbol"],
                    "name": index["name"],
                    "value": round(last, 2),
                    "change_pct": round(change_pct, 2),
                    "sparkline": [round(c, 2) for c in closes[-7:]],
                }
            )
        except Exception:
            continue
    return results
