from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class WatchlistCreate(BaseModel):
    ticker: str
    notes: Optional[str] = None
    target_price: Optional[float] = None
    alert_above: Optional[float] = None
    alert_below: Optional[float] = None


class WatchlistUpdate(BaseModel):
    notes: Optional[str] = None
    target_price: Optional[float] = None
    alert_above: Optional[float] = None
    alert_below: Optional[float] = None
    is_active: Optional[int] = None


class WatchlistResponse(BaseModel):
    id: int
    ticker: str
    notes: Optional[str]
    target_price: Optional[float]
    alert_above: Optional[float]
    alert_below: Optional[float]
    is_active: int
    created_at: datetime

    class Config:
        from_attributes = True
