from datetime import datetime, timezone

from fastapi import APIRouter, Request

from app.config import get_settings

router = APIRouter(tags=["health"])


def _health_payload(request: Request):
    settings = get_settings()
    return {
        "ok": True,
        "service": "ai-service",
        "version": settings.service_version,
        "modelMode": settings.model_mode,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health")
def health(request: Request):
    return _health_payload(request)


@router.get("/ready")
def ready(_request: Request):
    settings = get_settings()
    return {
        "ok": True,
        "service": "ai-service",
        "dependencies": {"models": "ok", "rules": "ok"},
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "modelMode": settings.model_mode,
    }


@router.get("/ai/v1/health")
def ai_health(request: Request):
    return _health_payload(request)


@router.get("/ai/v1/ready")
def ai_ready(request: Request):
    return ready(request)
