from fastapi.responses import JSONResponse
from datetime import datetime, timezone


def build_error_response(code: str, message: str, correlation_id: str, details: list | None = None, status_code: int = 400, advisory: dict | None = None):
    content = {
        "success": False,
        "result": None,
        "confidence": 0,
        "uncertainty": {
            "isUncertain": True,
            "reason": "error",
            "requiresHumanReview": True,
        },
        "error": {
            "code": code,
            "message": message,
            "details": details or [],
        },
        "meta": {
            "correlationId": correlation_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    }
    if advisory:
        content["advisory"] = advisory
    return JSONResponse(status_code=status_code, content=content)
