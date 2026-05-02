from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy import select as sa_select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.portfolio import Portfolio, Position
from app.services.risk_history import (
    get_risk_history,
    save_risk_score,
    save_risk_scores_for_portfolio,
)
from app.services.portfolio_risk import calculate_portfolio_risk_summary
from app.services.performance import get_portfolio_performance
from app.services.diversification import get_portfolio_diversification
from app.services.correlation import get_portfolio_correlation
from app.services.earnings import get_portfolio_earnings_calendar
from app.services.earnings_alert import check_earnings_alerts_for_portfolio
from app.services.alerts import check_portfolio_alerts
from app.scheduler import run_daily_sync
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioResponse,
    PositionCreate,
    PositionResponse,
    PositionUpdate,
)

router = APIRouter(prefix="/api/v1/portfolio", tags=["portfolio"])


@router.post("/sync/manual")
async def manual_sync():
    await run_daily_sync()
    return {"message": "Manual sync triggered successfully"}


@router.post("/{portfolio_id}/risk/calculate")
async def calculate_portfolio_risk(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
):
    results = await save_risk_scores_for_portfolio(portfolio_id, db)
    return {"portfolio_id": portfolio_id, "results": results}


@router.get("/positions/{position_id}/risk/history")
async def position_risk_history(
    position_id: int,
    db: AsyncSession = Depends(get_db),
):
    history = await get_risk_history(position_id, db)
    if not history:
        raise HTTPException(status_code=404, detail="No risk history found")
    return {"position_id": position_id, "history": history}


@router.get("/{portfolio_id}/risk/summary")
async def portfolio_risk_summary(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await calculate_portfolio_risk_summary(portfolio_id, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/{portfolio_id}/performance")
async def portfolio_performance(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await get_portfolio_performance(portfolio_id, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/{portfolio_id}/diversification")
async def portfolio_diversification(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await get_portfolio_diversification(portfolio_id, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/{portfolio_id}/correlation")
async def portfolio_correlation(
    portfolio_id: int,
    period: str = "6mo",
    db: AsyncSession = Depends(get_db),
):
    result = await get_portfolio_correlation(portfolio_id, db, period=period)
    if "error" in result and "matrix" not in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/{portfolio_id}/earnings")
async def portfolio_earnings(
    portfolio_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await get_portfolio_earnings_calendar(portfolio_id, db)
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.get("/{portfolio_id}/earnings/alerts")
async def earnings_alerts(
    portfolio_id: int,
    send_notifications: bool = False,
    db: AsyncSession = Depends(get_db),
):
    alerts = await check_earnings_alerts_for_portfolio(
        portfolio_id=portfolio_id,
        db=db,
        send_notifications=send_notifications,
    )
    return {
        "portfolio_id": portfolio_id,
        "alerts_count": len(alerts),
        "alerts": alerts,
    }


@router.post("/{portfolio_id}/alerts/check")
async def check_alerts(
    portfolio_id: int,
    risk_threshold: float = 70.0,
    send_notifications: bool = False,
    db: AsyncSession = Depends(get_db),
):
    result = await check_portfolio_alerts(
        portfolio_id=portfolio_id,
        db=db,
        risk_threshold=risk_threshold,
        send_notifications=send_notifications,
    )
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/", response_model=PortfolioResponse)
async def create_portfolio(data: PortfolioCreate, db: AsyncSession = Depends(get_db)):
    portfolio = Portfolio(name=data.name)
    db.add(portfolio)
    await db.commit()
    await db.refresh(portfolio)
    result = await db.execute(
        select(Portfolio)
        .options(selectinload(Portfolio.positions))
        .where(Portfolio.id == portfolio.id)
    )
    return result.scalar_one()


@router.get("/", response_model=list[PortfolioResponse])
async def list_portfolios(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Portfolio).options(selectinload(Portfolio.positions))
    )
    return result.scalars().all()


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(portfolio_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Portfolio)
        .options(selectinload(Portfolio.positions))
        .where(Portfolio.id == portfolio_id)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio


@router.post("/{portfolio_id}/positions", response_model=PositionResponse)
async def add_position(
    portfolio_id: int,
    data: PositionCreate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Portfolio).where(Portfolio.id == portfolio_id))
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    position = Position(
        portfolio_id=portfolio_id,
        ticker=data.ticker.upper(),
        shares=data.shares,
        avg_buy_price=data.avg_buy_price,
        currency=data.currency,
        notes=data.notes,
    )
    db.add(position)
    await db.commit()
    await db.refresh(position)
    return position


@router.put("/positions/{position_id}", response_model=PositionResponse)
async def update_position(
    position_id: int,
    data: PositionUpdate,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Position).where(Position.id == position_id))
    position = result.scalar_one_or_none()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")

    if data.shares is not None:
        position.shares = data.shares
    if data.avg_buy_price is not None:
        position.avg_buy_price = data.avg_buy_price
    if data.notes is not None:
        position.notes = data.notes

    await db.commit()
    await db.refresh(position)
    return position


@router.delete("/positions/{position_id}")
async def delete_position(position_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Position).where(Position.id == position_id))
    position = result.scalar_one_or_none()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    await db.delete(position)
    await db.commit()
    return {"message": f"Position {position_id} deleted"}
