import logging

import httpx

logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "StockMind contact@example.com",
    "Accept-Encoding": "gzip, deflate",
    "Host": "www.sec.gov",
}


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
