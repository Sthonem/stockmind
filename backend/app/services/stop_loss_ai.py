import logging

from app.services.ai_agent import ask_agent
from app.services.market_data import get_ohlcv
from app.services.risk_service import calculate_risk_for_ticker
from app.services.stop_loss import analyze_stop_loss_for_ticker, calculate_atr

logger = logging.getLogger(__name__)


def build_stop_loss_prompt(
    ticker: str,
    current_price: float,
    avg_buy_price: float,
    stop_loss_price: float,
    risk_score: float,
    risk_level: str,
    atr: float,
    indicators: dict,
    pct_below_current: float,
    profit_at_stop: float = None,
) -> str:
    profit_line = ""
    if profit_at_stop is not None:
        if profit_at_stop >= 0:
            profit_line = f"If stopped out: +{profit_at_stop:.1f}% profit locked in"
        else:
            profit_line = f"If stopped out: {profit_at_stop:.1f}% loss from buy price"

    prompt = f"""Generate a clear stop-loss justification for this position.

POSITION: {ticker}
Current price: ${current_price:.2f}
Average buy price: ${avg_buy_price:.2f}
Recommended stop-loss: ${stop_loss_price:.2f} ({pct_below_current:.1f}% below current)
{profit_line}

RISK DATA:
Risk score: {risk_score}/100 ({risk_level} risk)
ATR (14-day): ${atr:.2f}
RSI: {indicators['rsi']['value']} ({indicators['rsi']['signal']})
MACD: {indicators['macd']['signal']}
Bollinger Bands: {indicators['bollinger_bands']['signal']}
EMA trend: {indicators['ema']['signal']}

Provide:
1. Why this stop-loss level makes sense given the technical picture
2. What would invalidate this stop-loss (i.e., when to move it up or down)
3. What to watch for in the next 5 trading days
4. Risk/reward assessment

Keep it concise — 4 short paragraphs maximum.
Bottom line: [one sentence action summary]
"""
    return prompt


def get_ai_stop_loss_justification(
    ticker: str,
    avg_buy_price: float,
) -> dict:
    try:
        df = get_ohlcv(ticker, period="6mo")
        risk_result = calculate_risk_for_ticker(ticker)
        risk_score = risk_result["risk"]["score"]
        risk_level = risk_result["risk"]["level"]
        indicators = risk_result["indicators"]

        stop_loss_data = analyze_stop_loss_for_ticker(
            df=df,
            risk_score=risk_score,
            avg_buy_price=avg_buy_price,
        )

        current_price = stop_loss_data["current_price"]
        stop_loss_price = stop_loss_data["stop_loss_price"]
        atr = stop_loss_data["atr"]
        pct_below = stop_loss_data["pct_below_current"]
        profit_at_stop = stop_loss_data.get("profit_at_stop")

        prompt = build_stop_loss_prompt(
            ticker=ticker,
            current_price=current_price,
            avg_buy_price=avg_buy_price,
            stop_loss_price=stop_loss_price,
            risk_score=risk_score,
            risk_level=risk_level,
            atr=atr,
            indicators=indicators,
            pct_below_current=pct_below,
            profit_at_stop=profit_at_stop,
        )

        ai_result = ask_agent(question=prompt)

        return {
            "ticker": ticker,
            "current_price": current_price,
            "avg_buy_price": avg_buy_price,
            "stop_loss_price": stop_loss_price,
            "pct_below_current": pct_below,
            "profit_at_stop": profit_at_stop,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "atr": atr,
            "urgency": stop_loss_data["urgency"],
            "ai_justification": ai_result["answer"],
            "model": ai_result["model"],
            "tokens_used": ai_result["tokens_used"],
        }

    except Exception as e:
        logger.error(f"Stop-loss AI justification failed for {ticker}: {e}")
        return {
            "ticker": ticker,
            "error": str(e),
            "ai_justification": None,
        }
