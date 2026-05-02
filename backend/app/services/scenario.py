import logging

from app.services.ai_agent import ask_agent
from app.services.market_data import get_ohlcv
from app.services.market_regime import detect_market_regime

logger = logging.getLogger(__name__)

SCENARIO_TEMPLATES = {
    "fed_rate_hike": {
        "name": "Fed Rate Hike",
        "description": "Federal Reserve raises interest rates",
        "affected_sectors": ["technology", "real estate", "utilities", "financials"],
        "historical_context": "Rate hikes typically pressure growth stocks and benefit financials short-term",
    },
    "fed_rate_cut": {
        "name": "Fed Rate Cut",
        "description": "Federal Reserve cuts interest rates",
        "affected_sectors": [
            "technology",
            "real estate",
            "utilities",
            "consumer discretionary",
        ],
        "historical_context": "Rate cuts typically boost growth stocks and real estate",
    },
    "recession": {
        "name": "Recession",
        "description": "Economic recession or significant GDP contraction",
        "affected_sectors": ["all sectors negatively", "defensive sectors less impacted"],
        "historical_context": "Recessions hit cyclical stocks hardest, defensives outperform relatively",
    },
    "inflation_spike": {
        "name": "Inflation Spike",
        "description": "Inflation rises significantly above expectations",
        "affected_sectors": [
            "technology",
            "consumer discretionary",
            "commodities benefit",
        ],
        "historical_context": "High inflation erodes real returns, value stocks tend to outperform growth",
    },
    "market_crash": {
        "name": "Market Crash",
        "description": "Broad market selloff of 20%+ in short period",
        "affected_sectors": ["all sectors"],
        "historical_context": "Correlations rise toward 1.0 in crashes — diversification fails temporarily",
    },
    "sector_rotation": {
        "name": "Sector Rotation",
        "description": "Institutional money rotates between sectors",
        "affected_sectors": ["depends on rotation direction"],
        "historical_context": "Sector rotation can create significant divergence between holdings",
    },
}


def build_scenario_prompt(
    scenario_description: str,
    tickers: list,
    portfolio_context: str = "",
    template: dict = None,
) -> str:
    ticker_list = ", ".join(tickers) if tickers else "the portfolio"

    prompt = f"""Analyze the following market scenario and its potential impact on specific stocks.

SCENARIO: {scenario_description}
"""

    if template:
        prompt += f"""
HISTORICAL CONTEXT: {template['historical_context']}
TYPICALLY AFFECTED SECTORS: {', '.join(template['affected_sectors'])}
"""

    if portfolio_context:
        prompt += f"\n{portfolio_context}\n"

    prompt += f"""
STOCKS TO ANALYZE: {ticker_list}

For each stock, provide:
1. Expected direction (bullish/bearish/neutral) and magnitude (low/medium/high impact)
2. Key reason in one sentence
3. Suggested action (hold/reduce/exit/opportunity)

Then provide an overall portfolio impact assessment.
Bottom line: [one sentence summary of the scenario impact]
"""
    return prompt


def analyze_scenario(
    scenario: str,
    tickers: list,
    portfolio_context: str = "",
    scenario_type: str = None,
) -> dict:
    template = SCENARIO_TEMPLATES.get(scenario_type) if scenario_type else None

    prompt = build_scenario_prompt(
        scenario_description=scenario,
        tickers=tickers,
        portfolio_context=portfolio_context,
        template=template,
    )

    result = ask_agent(
        question=prompt,
        portfolio_context="",
    )

    return {
        "scenario": scenario,
        "scenario_type": scenario_type,
        "tickers_analyzed": tickers,
        "analysis": result["answer"],
        "model": result["model"],
        "tokens_used": result["tokens_used"],
        "template_used": template["name"] if template else None,
    }
