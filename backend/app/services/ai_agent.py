import json
import logging

from groq import Groq

from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are StockMind AI, a personal financial analysis assistant.
You help the user understand their stock portfolio risk, market conditions, and investment decisions.

Your role:
- Analyze portfolio data and market signals provided to you
- Give clear, concise insights about risk and market conditions
- Answer scenario questions about how events might affect specific stocks
- Suggest stop-loss levels and risk management strategies
- Always clarify you are not a licensed financial advisor
- Be direct and specific — avoid vague generalities
- Use data provided in context, not assumptions

Response style:
- Concise and structured
- Use bullet points for clarity when listing multiple points
- Always end with a one-line summary starting with "Bottom line:"
- Flag high-risk situations clearly
"""


def get_groq_client():
    if not settings.GROQ_API_KEY:
        return None
    return Groq(api_key=settings.GROQ_API_KEY)


def build_portfolio_context(portfolio_data: dict) -> str:
    if not portfolio_data:
        return "No portfolio data available."

    lines = ["PORTFOLIO CONTEXT:"]
    positions = portfolio_data.get("positions", [])

    for pos in positions:
        ticker = pos.get("ticker", "")
        risk_score = pos.get("risk_score")
        risk_level = pos.get("risk_level", "unknown")
        value = pos.get("estimated_value", 0)
        lines.append(
            f"- {ticker}: risk={risk_score} ({risk_level}), "
            f"estimated value=${value:,.2f}"
        )

    overall = portfolio_data.get("portfolio_risk_score")
    if overall:
        lines.append(f"\nOverall portfolio risk score: {overall}/100")
        lines.append(f"Risk level: {portfolio_data.get('portfolio_risk_level', 'unknown')}")

    high_risk = portfolio_data.get("high_risk_positions", [])
    if high_risk:
        lines.append(f"High-risk positions: {', '.join(high_risk)}")

    return "\n".join(lines)


def ask_agent(
    question: str,
    portfolio_context: str = "",
    market_context: str = "",
    conversation_history: list = None,
) -> dict:
    client = get_groq_client()
    if not client:
        return {
            "answer": "GROQ_API_KEY not configured. Please add it to your .env file.",
            "model": None,
            "tokens_used": 0,
        }

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if conversation_history:
        messages.extend(conversation_history[-6:])

    context_block = ""
    if portfolio_context:
        context_block += f"\n{portfolio_context}\n"
    if market_context:
        context_block += f"\nMARKET CONTEXT:\n{market_context}\n"

    full_question = question
    if context_block:
        full_question = f"{context_block}\nUser question: {question}"

    messages.append({"role": "user", "content": full_question})

    try:
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=messages,
            temperature=0.3,
            max_tokens=1000,
        )

        answer = response.choices[0].message.content
        tokens = response.usage.total_tokens

        return {
            "answer": answer,
            "model": "llama3-70b-8192",
            "tokens_used": tokens,
        }

    except Exception as e:
        logger.error(f"AI agent error: {e}")
        return {
            "answer": f"AI agent error: {str(e)}",
            "model": None,
            "tokens_used": 0,
        }
