from contextlib import asynccontextmanager
from datetime import datetime, timezone
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers.health import router as health_router
from app.routers.advisory import router as advisory_router
from app.routers.mismatch import router as mismatch_router
from app.routers.normalisation import router as normalisation_router
from app.routers.recommendations import router as recommendations_router
from app.routers.routing import router as routing_router
from app.routers.validation import router as validation_router
from app.utils.correlation import CORRELATION_HEADER, get_or_create_correlation_id
from app.utils.errors import build_error_response
from app.utils.logging import configure_logging

settings = get_settings()
logger = configure_logging(settings.log_level)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("ai_service_startup", extra={"extra_data": {"service": "ai-service", "version": settings.service_version}})
    yield
    logger.info("ai_service_shutdown", extra={"extra_data": {"service": "ai-service"}})


app = FastAPI(
    title="UdyogSetu 360 AI Service",
    version=settings.service_version,
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    openapi_url="/openapi.json" if settings.environment != "production" else None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def correlation_and_logging_middleware(request: Request, call_next):
    request.state.correlation_id = get_or_create_correlation_id(request.headers.get(CORRELATION_HEADER))
    max_size_bytes = settings.max_payload_size_mb * 1024 * 1024
    content_length = int(request.headers.get("content-length", "0") or "0")
    if content_length > max_size_bytes:
        return build_error_response("PAYLOAD_TOO_LARGE", "Payload exceeds AI service limit.", request.state.correlation_id, status_code=413)

    started_at = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "request_failed",
            extra={"extra_data": {"endpoint": request.url.path, "method": request.method, "correlationId": request.state.correlation_id}},
        )
        return build_error_response("INTERNAL_ERROR", "Unexpected AI service error.", request.state.correlation_id, status_code=500)

    duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
    response.headers[CORRELATION_HEADER] = request.state.correlation_id
    logger.info(
        "request_completed",
        extra={
            "extra_data": {
                "endpoint": request.url.path,
                "method": request.method,
                "status": response.status_code,
                "durationMs": duration_ms,
                "correlationId": request.state.correlation_id,
            }
        },
    )
    return response


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return build_error_response("VALIDATION_ERROR", str(exc), request.state.correlation_id)


app.include_router(health_router)
app.include_router(validation_router)
app.include_router(normalisation_router)
app.include_router(mismatch_router)
app.include_router(routing_router)
app.include_router(recommendations_router)
app.include_router(advisory_router)
