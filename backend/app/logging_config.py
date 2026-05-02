import logging
import sys

from app.config import settings


def setup_logging():
    log_level = logging.WARNING if settings.is_production else logging.INFO

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s — %(name)s — %(levelname)s — %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )

    noisy_loggers = [
        "httpx", "httpcore", "hpack", "h2",
        "urllib3", "asyncio", "multipart"
    ]
    for logger_name in noisy_loggers:
        logging.getLogger(logger_name).setLevel(logging.WARNING)

    logging.getLogger("uvicorn.access").setLevel(
        logging.WARNING if settings.is_production else logging.INFO
    )

    return logging.getLogger("stockmind")
