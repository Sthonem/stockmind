import logging
from datetime import datetime, timedelta

import httpx

logger = logging.getLogger(__name__)

HIGH_IMPACT_EVENTS = [
    "Federal Reserve",
    "FOMC",
    "Fed Rate",
    "Interest Rate Decision",
    "CPI",
    "Consumer Price Index",
    "Inflation",
    "GDP",
    "Gross Domestic Product",
    "Non-Farm Payrolls",
    "NFP",
    "Jobs Report",
    "Unemployment",
    "PPI",
    "Producer Price Index",
    "Retail Sales",
    "ISM Manufacturing",
    "ISM Services",
    "PCE",
    "Personal Consumption",
]

SECTOR_SENSITIVITY = {
    "Federal Reserve": [
        "Technology",
        "Real Estate",
        "Utilities",
        "Consumer Discretionary",
    ],
    "FOMC": ["Technology", "Real Estate", "Utilities", "Consumer Discretionary"],
    "CPI": ["Technology", "Consumer Discretionary", "Real Estate"],
    "GDP": ["Consumer Discretionary", "Industrials", "Financials"],
    "Non-Farm Payrolls": ["Consumer Discretionary", "Financials", "Industrials"],
    "Retail Sales": ["Consumer Discretionary", "Consumer Staples"],
    "PPI": ["Industrials", "Materials", "Energy"],
}


def is_high_impact(event_name: str) -> bool:
    event_lower = event_name.lower()
    return any(keyword.lower() in event_lower for keyword in HIGH_IMPACT_EVENTS)


def get_affected_sectors(event_name: str) -> list:
    for keyword, sectors in SECTOR_SENSITIVITY.items():
        if keyword.lower() in event_name.lower():
            return sectors
    return []


def fetch_economic_events() -> list:
    try:
        url = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"
        with httpx.Client(timeout=10.0) as client:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()

        events = []
        for event in data:
            title = event.get("title", "")
            date_str = event.get("date", "")
            impact = event.get("impact", "Low")
            country = event.get("country", "")

            if country != "USD":
                continue

            try:
                event_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except Exception:
                event_date = None

            events.append(
                {
                    "title": title,
                    "date": event_date.isoformat() if event_date else date_str,
                    "impact": impact,
                    "country": country,
                    "is_high_impact": is_high_impact(title) or impact == "High",
                    "affected_sectors": get_affected_sectors(title),
                    "forecast": event.get("forecast", ""),
                    "previous": event.get("previous", ""),
                }
            )

        return sorted(events, key=lambda x: x["date"])

    except Exception as e:
        logger.warning(f"Economic calendar fetch failed: {e}")
        return get_fallback_events()


def get_fallback_events() -> list:
    # Use date-only (midnight) so both calendarUpcoming and calendarWeek
    # produce identical date strings — dedup on the frontend will work correctly.
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    events = []

    schedules = [
        {"title": "FOMC Meeting Minutes", "days_ahead": 7, "impact": "High"},
        {"title": "CPI Report", "days_ahead": 12, "impact": "High"},
        {"title": "Non-Farm Payrolls", "days_ahead": 5, "impact": "High"},
        {"title": "GDP Quarterly Release", "days_ahead": 20, "impact": "High"},
        {"title": "Federal Reserve Speech", "days_ahead": 3, "impact": "Medium"},
        {"title": "Retail Sales Report", "days_ahead": 9, "impact": "Medium"},
        {"title": "PPI Report", "days_ahead": 11, "impact": "Medium"},
    ]

    for item in schedules:
        event_date = today + timedelta(days=item["days_ahead"])
        events.append(
            {
                "title": item["title"],
                "date": event_date.isoformat(),
                "impact": item["impact"],
                "country": "USD",
                "is_high_impact": True,
                "affected_sectors": get_affected_sectors(item["title"]),
                "forecast": "N/A",
                "previous": "N/A",
                "note": "Approximate date — fetch live data for exact timing",
            }
        )

    return events


def get_upcoming_high_impact(days_ahead: int = 14) -> dict:
    events = fetch_economic_events()
    now = datetime.now()
    cutoff = now + timedelta(days=days_ahead)

    upcoming = []
    for event in events:
        if not event.get("is_high_impact"):
            continue
        try:
            event_date = datetime.fromisoformat(event["date"].replace("Z", ""))
            if now <= event_date <= cutoff:
                days_until = (event_date - now).days
                event["days_until"] = days_until
                upcoming.append(event)
        except Exception:
            continue

    return {
        "days_ahead": days_ahead,
        "high_impact_count": len(upcoming),
        "events": upcoming,
        "warning": (
            "High-impact events approaching — risk scores may be less reliable"
            if upcoming
            else None
        ),
    }


def get_events_for_portfolio(tickers_sectors: dict, days_ahead: int = 14) -> dict:
    calendar = get_upcoming_high_impact(days_ahead)
    relevant_events = []

    for event in calendar["events"]:
        affected = event.get("affected_sectors", [])
        impacted_tickers = []

        for ticker, sector in tickers_sectors.items():
            if sector in affected or not affected:
                impacted_tickers.append(ticker)

        if impacted_tickers:
            relevant_events.append(
                {
                    **event,
                    "impacted_tickers": impacted_tickers,
                }
            )

    return {
        "total_relevant_events": len(relevant_events),
        "events": relevant_events,
        "tickers_analyzed": list(tickers_sectors.keys()),
    }
