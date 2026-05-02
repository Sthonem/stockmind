from typing import Optional

from pydantic import BaseModel


class ScenarioRequest(BaseModel):
    scenario: str
    tickers: list[str]
    portfolio_id: Optional[int] = None
    scenario_type: Optional[str] = None


class ScenarioResponse(BaseModel):
    scenario: str
    scenario_type: Optional[str]
    tickers_analyzed: list[str]
    analysis: str
    model: Optional[str]
    tokens_used: int
    template_used: Optional[str]
