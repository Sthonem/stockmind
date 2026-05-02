import logging
import time

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("stockmind.middleware")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        try:
            response = await call_next(request)
            duration = round((time.time() - start) * 1000, 1)
            if not request.url.path.startswith("/health"):
                logger.info(
                    f"{request.method} {request.url.path} "
                    f"→ {response.status_code} ({duration}ms)"
                )
            return response
        except Exception as e:
            duration = round((time.time() - start) * 1000, 1)
            logger.error(
                f"{request.method} {request.url.path} → 500 ({duration}ms): {e}"
            )
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error", "path": request.url.path},
            )
