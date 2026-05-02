import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.market_data import get_ohlcv
from app.services.market_regime import detect_market_regime
from app.services.portfolio_risk import calculate_portfolio_risk_summary
from app.services.sentiment_history import get_latest_sentiment

logger = logging.getLogger(__name__)


async def build_full_portfolio_context(
    portfolio_id: int,
    db: AsyncSession,
) -> str:
    lines = []

    try:
        portfolio_data = await calculate_portfolio_risk_summary(portfolio_id, db)
    except Exception as e:
        return f"Portfolio data unavailable: {e}"

    lines.append("=== PORTFOLIO SUMMARY ===")
    lines.append(
        f"Overall risk score: {portfolio_data.get('portfolio_risk_score', 'N/A')}/100"
    )
    lines.append(
        f"Risk level: {portfolio_data.get('portfolio_risk_level', 'unknown').upper()}"
    )
    lines.append(f"Note: {portfolio_data.get('portfolio_note', '')}")

    high_risk = portfolio_data.get("high_risk_positions", [])
    medium_risk = portfolio_data.get("medium_risk_positions", [])
    if high_risk:
        lines.append(f"HIGH RISK positions: {', '.join(high_risk)}")
    if medium_risk:
        lines.append(f"MEDIUM RISK positions: {', '.join(medium_risk)}")

    lines.append("\n=== POSITION DETAILS ===")
    for pos in portfolio_data.get("positions", []):
        ticker = pos.get("ticker", "")
        risk_score = pos.get("risk_score")
        risk_level = pos.get("risk_level", "unknown")
        value = pos.get("estimated_value", 0)
        avg_buy = pos.get("avg_buy_price", 0)

        lines.append(f"\n{ticker}:")
        lines.append(f"  Risk score: {risk_score}/100 ({risk_level})")
        lines.append(f"  Avg buy price: ${avg_buy:.2f}")
        lines.append(f"  Estimated value: ${value:,.2f}")

        sentiment = await get_latest_sentiment(ticker, db)
        if sentiment:
            lines.append(
                f"  Sentiment: {sentiment['overall_sentiment']} "
                f"(score: {sentiment['overall_score']:.2f})"
            )
            if sentiment.get("urgent_count", 0) > 0:
                lines.append(
                    f"  URGENT NEWS: {sentiment['urgent_count']} urgent articles detected"
                )

        try:
            df = get_ohlcv(ticker, period="3mo")
            regime = detect_market_regime(df["close"])
            lines.append(
                f"  Market regime: {regime['regime']} — {regime['description']}"
            )
        except Exception:
            pass

    lines.append("\n=== DISCLAIMER ===")
    lines.append("This data is for informational purposes only. Not financial advice.")

    return "\n".join(lines)


async def build_ticker_context(ticker: str, db: AsyncSession) -> str:
    lines = [f"=== {ticker} ANALYSIS CONTEXT ==="]

    try:
        from app.services.risk_service import calculate_risk_for_ticker

        risk = calculate_risk_for_ticker(ticker)
        lines.append(f"Risk score: {risk['risk']['score']}/100 ({risk['risk']['level']})")
        lines.append(f"Overall signal: {risk['overall_signal']}")
        lines.append(f"Latest price: ${risk['latest_price']}")

        indicators = risk["indicators"]
        lines.append(f"RSI: {indicators['rsi']['value']} ({indicators['rsi']['signal']})")
        lines.append(f"MACD: {indicators['macd']['signal']}")
        lines.append(f"Bollinger Bands: {indicators['bollinger_bands']['signal']}")
        lines.append(f"EMA trend: {indicators['ema']['signal']}")
        lines.append(f"Stop-loss recommendation: {risk['risk']['recommendation']}")
    except Exception as e:
        lines.append(f"Technical data unavailable: {e}")

    try:
        sentiment = await get_latest_sentiment(ticker, db)
        if sentiment:
            lines.append(
                f"Sentiment: {sentiment['overall_sentiment']} "
                f"({sentiment['overall_score']:.2f})"
            )
    except Exception:
        pass

    try:
        df = get_ohlcv(ticker, period="3mo")
        regime = detect_market_regime(df["close"])
        lines.append(f"Market regime: {regime['regime']}")
        lines.append(f"Regime implication: {regime['implication_for_signals']}")
    except Exception:
        pass

    return "\n".join(lines)
