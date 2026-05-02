import numpy as np
import pandas as pd


def calculate_rsi(closes: pd.Series, period: int = 14) -> pd.Series:
    delta = closes.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.ewm(com=period - 1, min_periods=period).mean()
    avg_loss = loss.ewm(com=period - 1, min_periods=period).mean()

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def get_rsi_signal(rsi_value: float) -> dict:
    if rsi_value >= 70:
        signal = "overbought"
        score = (rsi_value - 70) / 30
        direction = "bearish"
    elif rsi_value <= 30:
        signal = "oversold"
        score = (30 - rsi_value) / 30
        direction = "bullish"
    else:
        signal = "neutral"
        score = 0.0
        direction = "neutral"

    return {
        "rsi": round(rsi_value, 2),
        "signal": signal,
        "direction": direction,
        "strength": round(min(score, 1.0), 2),
    }


def _format_history_date(date) -> str:
    if hasattr(date, "date"):
        return str(date.date())
    return str(date)


def analyze_rsi(closes: pd.Series, period: int = 14) -> dict:
    rsi_series = calculate_rsi(closes, period)
    latest_rsi = rsi_series.dropna().iloc[-1]
    signal = get_rsi_signal(latest_rsi)

    return {
        **signal,
        "period": period,
        "history": [
            {"date": _format_history_date(date), "rsi": round(val, 2)}
            for date, val in rsi_series.dropna().tail(30).items()
        ],
    }


def calculate_macd(
    closes: pd.Series,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> dict[str, pd.Series]:
    ema_fast = closes.ewm(span=fast, adjust=False).mean()
    ema_slow = closes.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    histogram = macd_line - signal_line

    return {
        "macd": macd_line,
        "signal": signal_line,
        "histogram": histogram,
    }


def get_macd_signal(macd_value: float, signal_value: float, histogram: float) -> dict:
    if macd_value > signal_value and histogram > 0:
        signal = "bullish_crossover"
        direction = "bullish"
        strength = min(abs(histogram) / max(abs(macd_value), 0.001), 1.0)
    elif macd_value < signal_value and histogram < 0:
        signal = "bearish_crossover"
        direction = "bearish"
        strength = min(abs(histogram) / max(abs(macd_value), 0.001), 1.0)
    else:
        signal = "neutral"
        direction = "neutral"
        strength = 0.0

    return {
        "macd": round(macd_value, 4),
        "signal_line": round(signal_value, 4),
        "histogram": round(histogram, 4),
        "signal": signal,
        "direction": direction,
        "strength": round(min(strength, 1.0), 2),
    }


def analyze_macd(
    closes: pd.Series,
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> dict:
    result = calculate_macd(closes, fast, slow, signal)
    macd = result["macd"].dropna()
    sig = result["signal"].dropna()
    hist = result["histogram"].dropna()

    latest_macd = macd.iloc[-1]
    latest_signal = sig.iloc[-1]
    latest_hist = hist.iloc[-1]

    signal_result = get_macd_signal(latest_macd, latest_signal, latest_hist)

    history = []
    for date in hist.tail(30).index:
        history.append(
            {
                "date": _format_history_date(date),
                "macd": round(float(macd.get(date, 0)), 4),
                "signal": round(float(sig.get(date, 0)), 4),
                "histogram": round(float(hist.get(date, 0)), 4),
            }
        )

    return {
        **signal_result,
        "fast_period": fast,
        "slow_period": slow,
        "signal_period": signal,
        "history": history,
    }


def calculate_bollinger_bands(
    closes: pd.Series,
    period: int = 20,
    std_dev: float = 2.0,
) -> dict[str, pd.Series]:
    sma = closes.rolling(window=period).mean()
    std = closes.rolling(window=period).std()
    upper = sma + (std * std_dev)
    lower = sma - (std * std_dev)

    return {
        "upper": upper,
        "middle": sma,
        "lower": lower,
        "std": std,
    }


def get_bb_signal(price: float, upper: float, lower: float, middle: float) -> dict:
    band_width = upper - lower
    if band_width == 0:
        percent_b = 0.5
    else:
        percent_b = (price - lower) / band_width

    if price >= upper:
        signal = "above_upper"
        direction = "bearish"
        strength = min((price - upper) / (upper * 0.01), 1.0)
    elif price <= lower:
        signal = "below_lower"
        direction = "bullish"
        strength = min((lower - price) / (lower * 0.01), 1.0)
    elif percent_b > 0.8:
        signal = "near_upper"
        direction = "bearish"
        strength = (percent_b - 0.8) / 0.2
    elif percent_b < 0.2:
        signal = "near_lower"
        direction = "bullish"
        strength = (0.2 - percent_b) / 0.2
    else:
        signal = "within_bands"
        direction = "neutral"
        strength = 0.0

    return {
        "price": round(price, 2),
        "upper": round(upper, 2),
        "middle": round(middle, 2),
        "lower": round(lower, 2),
        "percent_b": round(percent_b, 2),
        "band_width": round(band_width, 2),
        "signal": signal,
        "direction": direction,
        "strength": round(min(strength, 1.0), 2),
    }


def analyze_bollinger_bands(
    closes: pd.Series,
    period: int = 20,
    std_dev: float = 2.0,
) -> dict:
    bands = calculate_bollinger_bands(closes, period, std_dev)

    upper = bands["upper"].dropna()
    middle = bands["middle"].dropna()
    lower = bands["lower"].dropna()

    latest_price = closes.iloc[-1]
    latest_upper = upper.iloc[-1]
    latest_middle = middle.iloc[-1]
    latest_lower = lower.iloc[-1]

    signal_result = get_bb_signal(
        latest_price,
        latest_upper,
        latest_lower,
        latest_middle,
    )

    history = []
    for date in upper.tail(30).index:
        history.append(
            {
                "date": _format_history_date(date),
                "price": round(float(closes.get(date, 0)), 2),
                "upper": round(float(upper.get(date, 0)), 2),
                "middle": round(float(middle.get(date, 0)), 2),
                "lower": round(float(lower.get(date, 0)), 2),
            }
        )

    return {
        **signal_result,
        "period": period,
        "std_dev": std_dev,
        "history": history,
    }


def calculate_ema(closes: pd.Series, period: int) -> pd.Series:
    return closes.ewm(span=period, adjust=False).mean()


def analyze_ema(closes: pd.Series, short: int = 20, long: int = 50) -> dict:
    ema_short = calculate_ema(closes, short)
    ema_long = calculate_ema(closes, long)

    latest_price = closes.iloc[-1]
    latest_short = ema_short.iloc[-1]
    latest_long = ema_long.iloc[-1]

    if ema_short.iloc[-1] > ema_long.iloc[-1] and ema_short.iloc[-2] <= ema_long.iloc[-2]:
        signal = "golden_cross"
        direction = "bullish"
        strength = 1.0
    elif ema_short.iloc[-1] < ema_long.iloc[-1] and ema_short.iloc[-2] >= ema_long.iloc[-2]:
        signal = "death_cross"
        direction = "bearish"
        strength = 1.0
    elif latest_short > latest_long:
        signal = "bullish_trend"
        direction = "bullish"
        diff_pct = (latest_short - latest_long) / latest_long
        strength = round(min(diff_pct * 10, 1.0), 2)
    elif latest_short < latest_long:
        signal = "bearish_trend"
        direction = "bearish"
        diff_pct = (latest_long - latest_short) / latest_long
        strength = round(min(diff_pct * 10, 1.0), 2)
    else:
        signal = "neutral"
        direction = "neutral"
        strength = 0.0

    price_vs_short = "above" if latest_price > latest_short else "below"
    price_vs_long = "above" if latest_price > latest_long else "below"

    history = []
    common_index = ema_long.dropna().tail(30).index
    for date in common_index:
        history.append(
            {
                "date": _format_history_date(date),
                "price": round(float(closes.get(date, 0)), 2),
                "ema_short": round(float(ema_short.get(date, 0)), 2),
                "ema_long": round(float(ema_long.get(date, 0)), 2),
            }
        )

    return {
        "ema_short": round(latest_short, 2),
        "ema_long": round(latest_long, 2),
        "short_period": short,
        "long_period": long,
        "signal": signal,
        "direction": direction,
        "strength": strength,
        "price_vs_ema_short": price_vs_short,
        "price_vs_ema_long": price_vs_long,
        "history": history,
    }
