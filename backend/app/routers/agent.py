from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select as sa_select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.portfolio import Position
from app.schemas.agent import AgentRequest, AgentResponse
from app.schemas.scenario import ScenarioRequest, ScenarioResponse
from app.services.ai_agent import ask_agent
from app.services.context_builder import (
    build_full_portfolio_context,
    build_ticker_context,
)
from app.services.daily_notification import send_daily_portfolio_notification
from app.services.daily_summary import generate_daily_summary
from app.services.scenario import SCENARIO_TEMPLATES, analyze_scenario
from app.services.stop_loss_ai import get_ai_stop_loss_justification
from app.services.telegram import send_telegram_message

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])


@router.post("/ask", response_model=AgentResponse)
async def ask(request: AgentRequest, db: AsyncSession = Depends(get_db)):
    portfolio_context = ""

    if request.portfolio_id:
        try:
            portfolio_context = await build_full_portfolio_context(
                request.portfolio_id,
                db,
            )
        except Exception as e:
            portfolio_context = f"Portfolio context error: {e}"

    history = None
    if request.conversation_history:
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]

    result = ask_agent(
        question=request.question,
        portfolio_context=portfolio_context,
        conversation_history=history,
    )

    return AgentResponse(
        question=request.question,
        answer=result["answer"],
        model=result["model"],
        tokens_used=result["tokens_used"],
        portfolio_context_included=bool(portfolio_context),
    )


@router.get("/context/{portfolio_id}")
async def get_portfolio_context(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
):
    context = await build_full_portfolio_context(portfolio_id, db)
    return {"portfolio_id": portfolio_id, "context": context}


@router.get("/context/ticker/{ticker}")
async def get_ticker_context(ticker: str, db: AsyncSession = Depends(get_db)):
    context = await build_ticker_context(ticker.upper(), db)
    return {"ticker": ticker.upper(), "context": context}


@router.get("/health")
def agent_health():
    from app.config import settings

    return {
        "groq_configured": bool(settings.GROQ_API_KEY),
        "model": "llama-3.3-70b-versatile",
    }


@router.post("/scenario", response_model=ScenarioResponse)
async def run_scenario(
    request: ScenarioRequest,
    db: AsyncSession = Depends(get_db),
):
    portfolio_context = ""
    if request.portfolio_id:
        try:
            portfolio_context = await build_full_portfolio_context(
                request.portfolio_id,
                db,
            )
        except Exception as e:
            portfolio_context = f"Portfolio context error: {e}"

    tickers = [t.upper() for t in request.tickers]

    result = analyze_scenario(
        scenario=request.scenario,
        tickers=tickers,
        portfolio_context=portfolio_context,
        scenario_type=request.scenario_type,
    )

    return ScenarioResponse(**result)


@router.get("/scenario/templates")
def scenario_templates():
    return {
        "templates": [
            {
                "key": key,
                "name": val["name"],
                "description": val["description"],
            }
            for key, val in SCENARIO_TEMPLATES.items()
        ]
    }


@router.get("/stoploss/{ticker}")
def ai_stop_loss(ticker: str, avg_buy_price: float = 0.0):
    if avg_buy_price <= 0:
        raise HTTPException(
            status_code=400,
            detail="avg_buy_price must be provided and greater than 0",
        )
    result = get_ai_stop_loss_justification(
        ticker=ticker.upper(),
        avg_buy_price=avg_buy_price,
    )
    if "error" in result and not result.get("ai_justification"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/daily-summary")
async def daily_summary(
    portfolio_id: int = None,
    db: AsyncSession = Depends(get_db),
):
    portfolio_tickers = []
    if portfolio_id:
        try:
            result = await db.execute(
                sa_select(Position).where(Position.portfolio_id == portfolio_id)
            )
            positions = result.scalars().all()
            portfolio_tickers = [p.ticker for p in positions]
        except Exception:
            pass

    summary = generate_daily_summary(portfolio_tickers=portfolio_tickers)
    return summary


@router.post("/notify/test")
def test_notification(message: str = "StockMind is working correctly!"):
    result = send_telegram_message(f"🧪 <b>Test Notification</b>\n\n{message}")
    return result


@router.post("/notify/daily/{portfolio_id}")
async def send_daily_notification(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await send_daily_portfolio_notification(portfolio_id, db)
    return result
