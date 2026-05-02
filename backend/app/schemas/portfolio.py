from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PositionCreate(BaseModel):
    ticker: str
    shares: float
    avg_buy_price: float
    currency: str = "USD"
    notes: Optional[str] = None


class PositionUpdate(BaseModel):
    shares: Optional[float] = None
    avg_buy_price: Optional[float] = None
    notes: Optional[str] = None


class PositionResponse(BaseModel):
    id: int
    portfolio_id: int
    ticker: str
    shares: float
    avg_buy_price: float
    currency: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PortfolioCreate(BaseModel):
    name: str = "My Portfolio"


class PortfolioResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    positions: list[PositionResponse] = []

    class Config:
        from_attributes = True
