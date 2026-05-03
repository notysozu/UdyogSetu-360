from fastapi import Header, HTTPException

from app.config import get_settings


def require_api_key(x_ai_service_key: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if not settings.require_auth:
        return
    if not x_ai_service_key or x_ai_service_key != settings.api_key:
        raise HTTPException(status_code=401, detail="Invalid AI service credentials.")


def require_advisory_api_key(x_ai_advisory_key: str | None = Header(default=None)) -> None:
    settings = get_settings()
    if not settings.advisory_require_auth:
        return
    if not x_ai_advisory_key or x_ai_advisory_key != settings.advisory_api_key:
        raise HTTPException(status_code=401, detail="Invalid AI advisory service credentials.")
