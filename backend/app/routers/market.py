from fastapi import APIRouter, HTTPException

from app.services.indicators import (
    analyze_bollinger_bands,
    analyze_ema,
    analyze_macd,
    analyze_rsi,
)
from app.services.earnings import get_earnings_history, get_earnings_info
from app.services.economic_calendar import fetch_economic_events, get_upcoming_high_impact
from app.services.insider import get_insider_filings
from app.services.institutional import get_institutional_ownership
from app.services.market_data import get_current_price, get_ohlcv, get_stock_info
from app.services.market_regime import detect_market_regime
from app.services.backtest import run_backtest
from app.services.position_sizing import calculate_position_size_from_history
from app.services.risk_service import calculate_risk_for_ticker
from app.services.signal_validation import validate_signals_for_ticker
from app.services.stop_loss import analyze_stop_loss_for_ticker
from app.services.technical_analysis import analyze_ticker

router = APIRouter(prefix="/api/v1/market", tags=["market"])


@router.get("/info/{ticker}")
def stock_info(ticker: str):
    try:
        return get_stock_info(ticker.upper())
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/price/{ticker}")
def current_price(ticker: str):
    price = get_current_price(ticker.upper())
    if price is None:
        raise HTTPException(status_code=404, detail=f"Price not found for {ticker}")
    return {"ticker": ticker.upper(), "price": price}


@router.get("/ohlcv/{ticker}")
def ohlcv(ticker: str, period: str = "6mo"):
    try:
        df = get_ohlcv(ticker.upper(), period=period)
        records = df.reset_index().rename(columns={"Date": "date", "Datetime": "date"})
        records["date"] = records["date"].astype(str)
        return {"ticker": ticker.upper(), "data": records.to_dict(orient="records")}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/rsi/{ticker}")
def rsi_analysis(ticker: str, period: int = 14):
    try:
        df = get_ohlcv(ticker.upper(), period="6mo")
        result = analyze_rsi(df["close"], period=period)
        return {"ticker": ticker.upper(), **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/macd/{ticker}")
def macd_analysis(ticker: str):
    try:
        df = get_ohlcv(ticker.upper(), period="6mo")
        result = analyze_macd(df["close"])
        return {"ticker": ticker.upper(), **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/bollinger/{ticker}")
def bollinger_analysis(ticker: str, period: int = 20):
    try:
        df = get_ohlcv(ticker.upper(), period="6mo")
        result = analyze_bollinger_bands(df["close"], period=period)
        return {"ticker": ticker.upper(), **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/ema/{ticker}")
def ema_analysis(ticker: str, short: int = 20, long: int = 50):
    try:
        df = get_ohlcv(ticker.upper(), period="6mo")
        result = analyze_ema(df["close"], short=short, long=long)
        return {"ticker": ticker.upper(), **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/analyze/{ticker}")
def full_analysis(ticker: str):
    try:
        result = analyze_ticker(ticker.upper())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/risk/{ticker}")
def risk_score(ticker: str, include_sentiment: bool = False):
    try:
        result = calculate_risk_for_ticker(
            ticker.upper(),
            include_sentiment=include_sentiment,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stoploss/{ticker}")
def stop_loss(ticker: str, avg_buy_price: float = None):
    try:
        df = get_ohlcv(ticker.upper(), period="6mo")
        risk_result = calculate_risk_for_ticker(ticker.upper())
        risk_score = risk_result["risk"]["score"]

        result = analyze_stop_loss_for_ticker(
            df=df,
            risk_score=risk_score,
            avg_buy_price=avg_buy_price,
        )
        return {"ticker": ticker.upper(), "risk_score": risk_score, **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/regime/{ticker}")
def market_regime(ticker: str):
    try:
        df = get_ohlcv(ticker.upper(), period="1y")
        result = detect_market_regime(df["close"], df["volume"])
        return {"ticker": ticker.upper(), **result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sizing/{ticker}")
def position_sizing(
    ticker: str,
    portfolio_value: float = 10000.0,
    risk_score: float = 50.0,
    max_position_pct: float = 0.25,
):
    try:
        result = calculate_position_size_from_history(
            ticker=ticker.upper(),
            portfolio_value=portfolio_value,
            risk_score=risk_score,
            max_position_pct=max_position_pct,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/backtest/{ticker}")
def backtest(
    ticker: str,
    period: str = "1y",
    initial_capital: float = 10000.0,
):
    try:
        result = run_backtest(
            ticker=ticker.upper(),
            period=period,
            initial_capital=initial_capital,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/earnings/{ticker}")
def earnings_info(ticker: str):
    try:
        result = get_earnings_info(ticker.upper())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/earnings/{ticker}/history")
def earnings_history(ticker: str):
    try:
        history = get_earnings_history(ticker.upper())
        return {"ticker": ticker.upper(), "history": history}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/insider/{ticker}")
def insider_activity(ticker: str, days_back: int = 90):
    try:
        result = get_insider_filings(ticker.upper(), days_back=days_back)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/institutional/{ticker}")
def institutional_ownership(ticker: str):
    try:
        result = get_institutional_ownership(ticker.upper())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/calendar/upcoming")
def economic_calendar_upcoming(days_ahead: int = 14):
    try:
        result = get_upcoming_high_impact(days_ahead=days_ahead)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/calendar/week")
def economic_calendar_week():
    try:
        events = fetch_economic_events()
        return {"total": len(events), "events": events}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/validate/{ticker}")
def signal_validation(
    ticker: str,
    period: str = "1y",
    forward_days: int = 5,
):
    try:
        result = validate_signals_for_ticker(
            ticker=ticker.upper(),
            period=period,
            forward_days=forward_days,
        )
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
