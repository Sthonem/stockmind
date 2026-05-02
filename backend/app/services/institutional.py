import logging

import httpx
import yfinance as yf

from app.services.insider import HEADERS, get_cik_for_ticker

logger = logging.getLogger(__name__)

MAJOR_INSTITUTIONS = {
    "berkshire": "0001067983",
    "blackrock": "0001364742",
    "vanguard": "0000102909",
    "state_street": "0000093751",
    "fidelity": "0000315066",
}


def get_13f_filings(cik: str, limit: int = 5) -> list:
    try:
        normalized_cik = str(cik).zfill(10)
        url = f"https://data.sec.gov/submissions/CIK{normalized_cik}.json"
        with httpx.Client(timeout=15.0, headers=HEADERS) as client:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()

        filings = data.get("filings", {}).get("recent", {})
        forms = filings.get("form", [])
        dates = filings.get("filingDate", [])
        accessions = filings.get("accessionNumber", [])

        results = []
        for i, form in enumerate(forms):
            if form in ["13F-HR", "13F-HR/A"] and i < len(dates):
                results.append(
                    {
                        "form": form,
                        "filing_date": dates[i],
                        "accession": accessions[i] if i < len(accessions) else "",
                    }
                )
                if len(results) >= limit:
                    break

        return results

    except Exception as e:
        logger.error(f"13F filing fetch failed for CIK {cik}: {e}")
        return []


def get_institutional_ownership(ticker: str) -> dict:
    try:
        stock = yf.Ticker(ticker)
        info = stock.info

        institutional_pct = info.get("institutionalOwnershipPercent") or info.get(
            "heldPercentInstitutions"
        )
        insider_pct = info.get("heldPercentInsiders")
        float_shares = info.get("floatShares")
        shares_outstanding = info.get("sharesOutstanding")
        shares_short = info.get("sharesShort")
        short_ratio = info.get("shortRatio")
        short_pct_float = info.get("shortPercentOfFloat")

        if institutional_pct and institutional_pct > 1:
            institutional_pct = institutional_pct / 100

        sentiment = "neutral"
        if institutional_pct:
            if institutional_pct > 0.85:
                sentiment = "heavily_institutional"
                note = "Dominated by institutions — price moves can be large and fast"
            elif institutional_pct > 0.60:
                sentiment = "institutional_favored"
                note = "Strong institutional interest — generally positive signal"
            elif institutional_pct > 0.30:
                sentiment = "mixed_ownership"
                note = "Balanced institutional and retail ownership"
            else:
                sentiment = "retail_heavy"
                note = "Mostly retail owned — higher volatility risk"
        else:
            note = "Ownership data unavailable"

        short_signal = "neutral"
        if short_pct_float:
            if short_pct_float > 0.20:
                short_signal = "heavily_shorted"
            elif short_pct_float > 0.10:
                short_signal = "moderately_shorted"
            else:
                short_signal = "low_short_interest"

        cik = get_cik_for_ticker(ticker)

        return {
            "ticker": ticker,
            "cik": cik,
            "institutional_ownership_pct": (
                round(float(institutional_pct) * 100, 2)
                if institutional_pct
                else None
            ),
            "insider_ownership_pct": (
                round(float(insider_pct) * 100, 2) if insider_pct else None
            ),
            "shares_outstanding": shares_outstanding,
            "float_shares": float_shares,
            "shares_short": shares_short,
            "short_ratio": short_ratio,
            "short_pct_float": (
                round(float(short_pct_float) * 100, 2) if short_pct_float else None
            ),
            "institutional_sentiment": sentiment,
            "short_interest_signal": short_signal,
            "note": note,
        }

    except Exception as e:
        logger.error(f"Institutional ownership failed for {ticker}: {e}")
        return {
            "ticker": ticker,
            "error": str(e),
            "institutional_sentiment": "unknown",
        }


def get_major_holder_filings(limit: int = 3) -> dict:
    results = {}
    for name, cik in MAJOR_INSTITUTIONS.items():
        filings = get_13f_filings(cik, limit=limit)
        results[name] = {
            "cik": cik,
            "recent_13f_count": len(filings),
            "latest_filing": filings[0] if filings else None,
        }
    return results
