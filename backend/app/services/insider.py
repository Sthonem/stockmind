import logging
from datetime import datetime, timedelta

import httpx

logger = logging.getLogger(__name__)

# SEC requires a User-Agent identifying the requester.
# Never set Host manually — httpx derives it from the URL, and a wrong
# Host header makes data.sec.gov reject the request.
HEADERS = {
    "User-Agent": "StockMind contact@example.com",
    "Accept-Encoding": "gzip, deflate",
}

DATA_HEADERS = HEADERS


def get_cik_for_ticker(ticker: str) -> str | None:
    try:
        url = "https://www.sec.gov/files/company_tickers.json"
        with httpx.Client(timeout=15.0, headers=HEADERS) as client:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()

        ticker_upper = ticker.upper()
        for company in data.values():
            if company.get("ticker", "").upper() == ticker_upper:
                return str(company.get("cik_str", "")).zfill(10)

        return None

    except Exception as e:
        logger.error(f"CIK lookup failed for {ticker}: {e}")
        return None


def get_insider_filings(ticker: str, days_back: int = 90) -> dict:
    """
    Fetch Form 4 insider trading filings from SEC EDGAR for a given ticker.
    Returns filing count, recent filings list, and an activity interpretation.
    """
    cik = get_cik_for_ticker(ticker)
    if not cik:
        return {
            "ticker": ticker,
            "error": f"Company not found in SEC EDGAR: {ticker}",
            "total_form4_filings": 0,
            "days_back": days_back,
            "recent_filings": [],
        }

    try:
        url = f"https://data.sec.gov/submissions/CIK{cik}.json"
        with httpx.Client(timeout=20.0, headers=DATA_HEADERS) as client:
            response = client.get(url)
            response.raise_for_status()
            data = response.json()

        company_name = data.get("name", ticker)
        filings = data.get("filings", {}).get("recent", {})

        forms = filings.get("form", [])
        dates = filings.get("filingDate", [])
        accessions = filings.get("accessionNumber", [])
        descriptions = filings.get("primaryDocument", [])

        cutoff = datetime.now() - timedelta(days=days_back)
        recent_form4 = []

        for i, form in enumerate(forms):
            if form not in ("4", "4/A"):
                continue
            filing_date_str = dates[i] if i < len(dates) else ""
            try:
                filing_date = datetime.strptime(filing_date_str, "%Y-%m-%d")
            except ValueError:
                continue
            if filing_date < cutoff:
                continue

            accession = accessions[i] if i < len(accessions) else ""
            doc = descriptions[i] if i < len(descriptions) else ""
            accession_fmt = accession.replace("-", "")
            sec_url = (
                f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession_fmt}/{doc}"
                if accession and doc
                else ""
            )
            recent_form4.append({
                "filing_date": filing_date_str,
                "form": form,
                "document": doc,
                "accession": accession,
                "url": sec_url,
            })

        total = len(recent_form4)
        filings_per_month = round(total / (days_back / 30), 1)

        if filings_per_month >= 5:
            activity_level = "very_active"
            note = "Unusually high insider filing activity — warrants attention."
        elif filings_per_month >= 2:
            activity_level = "active"
            note = "Above average insider activity."
        elif filings_per_month >= 0.5:
            activity_level = "normal"
            note = "Normal insider filing frequency."
        else:
            activity_level = "low"
            note = "Low insider filing activity in this period."

        return {
            "ticker": ticker,
            "company_name": company_name,
            "cik": cik,
            "total_form4_filings": total,
            "days_back": days_back,
            "recent_filings": recent_form4[:20],
            "interpretation": {
                "activity_level": activity_level,
                "filings_per_month": filings_per_month,
                "note": note,
            },
        }

    except httpx.HTTPStatusError as e:
        logger.error(f"SEC EDGAR HTTP error for {ticker} (CIK {cik}): {e.response.status_code}")
        return {
            "ticker": ticker,
            "error": f"SEC EDGAR returned {e.response.status_code}",
            "total_form4_filings": 0,
            "days_back": days_back,
            "recent_filings": [],
        }
    except Exception as e:
        logger.error(f"Insider filings fetch failed for {ticker}: {e}")
        return {
            "ticker": ticker,
            "error": str(e),
            "total_form4_filings": 0,
            "days_back": days_back,
            "recent_filings": [],
        }
