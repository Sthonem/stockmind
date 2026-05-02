from typing import Optional

from pydantic import BaseModel


class AgentMessage(BaseModel):
    role: str
    content: str


class AgentRequest(BaseModel):
    question: str
    portfolio_id: Optional[int] = None
    conversation_history: Optional[list[AgentMessage]] = None


class AgentResponse(BaseModel):
    question: str
    answer: str
    model: Optional[str]
    tokens_used: int
    portfolio_context_included: bool
