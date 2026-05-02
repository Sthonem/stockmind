import logging
from datetime import datetime

from app.services.ai_agent import ask_agent
from app.services.market_data import get_ohlcv
from app.services.market_regime import detect_market_regime
from app.services.news import fetch_market_news
from app.services.news_categorizer import get_category_summary

logger = logging.getLogger(__name__)

MARKET_INDICES = ["SPY", "QQQ", "IWM"]


def get_indices_summary() -> str:
    lines = []
    for index in MARKET_INDICES:
        try:
            df = get_ohlcv(index, period="5d", interval="1d")
            if len(df) >= 2:
                latest = df["close"].iloc[-1]
                prev = df["close"].iloc[-2]
                change_pct = ((latest - prev) / prev) * 100
                direction = "+" if change_pct >= 0 else ""
                lines.append(f"{index}: ${latest:.2f} ({direction}{change_pct:.2f}%)")
        except Exception as e:
            lines.append(f"{index}: data unavailable")
    return "\n".join(lines) if lines else "Index data unavailable"


def get_market_regime_summary() -> str:
    try:
        df = get_ohlcv("SPY", period="3mo")
        regime = detect_market_regime(df["close"])
        return (
            f"Regime: {regime['regime']}\n"
            f"Description: {regime['description']}\n"
            f"Implication: {regime['implication_for_signals']}"
        )
    except Exception:
        return "Market regime data unavailable"


def build_daily_summary_prompt(
    indices_summary: str,
    regime_summary: str,
    news_summary: str,
    portfolio_tickers: list = None,
) -> str:
    today = datetime.now().strftime("%A, %B %d %Y")
    ticker_line = ""
    if portfolio_tickers:
        ticker_line = f"User holds: {', '.join(portfolio_tickers)}\n"

    prompt = f"""Generate a concise daily market briefing for {today}.

MARKET INDICES:
{indices_summary}

MARKET REGIME:
{regime_summary}

RECENT NEWS THEMES:
{news_summary}

{ticker_line}
Structure the briefing as:
1. Market overview (2-3 sentences)
2. Key themes driving the market today
3. What to watch (2-3 upcoming catalysts or risks)
4. Portfolio relevance (if holdings provided, one sentence per ticker)

Keep the entire briefing under 300 words.
Bottom line: [one sentence on overall market sentiment today]
"""
    return prompt


def generate_daily_summary(portfolio_tickers: list = None) -> dict:
    indices_summary = get_indices_summary()
    regime_summary = get_market_regime_summary()

    market_news = fetch_market_news(days_back=1)
    if market_news:
        category_summary = get_category_summary(market_news)
        dominant = category_summary.get("dominant_category", "general")
        urgent_count = category_summary.get("urgent_count", 0)
        news_summary = (
            f"Dominant theme: {dominant}, {len(market_news)} articles, "
            f"{urgent_count} urgent"
        )
    else:
        news_summary = "No market news available (NEWS_API_KEY not configured)"

    prompt = build_daily_summary_prompt(
        indices_summary=indices_summary,
        regime_summary=regime_summary,
        news_summary=news_summary,
        portfolio_tickers=portfolio_tickers,
    )

    result = ask_agent(question=prompt)

    return {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "generated_at": datetime.now().isoformat(),
        "indices_data": indices_summary,
        "market_regime": regime_summary,
        "news_theme": news_summary,
        "summary": result["answer"],
        "model": result["model"],
        "tokens_used": result["tokens_used"],
    }
