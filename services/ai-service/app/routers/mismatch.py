from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from app.config import get_settings
from app.dependencies import require_api_key
from app.schemas.common import ApiMeta
from app.schemas.mismatch import MismatchDetectionRequest
from app.services.explainability_service import build_explainability
from app.services.mismatch_detection_service import detect_mismatches
from app.services.uncertainty_service import build_uncertainty

router = APIRouter(prefix="/ai/v1/mismatch", tags=["mismatch"], dependencies=[Depends(require_api_key)])


@router.post("/detect")
def mismatch_detect(payload: MismatchDetectionRequest, request: Request):
    settings = get_settings()
    evaluated = detect_mismatches(payload)
    conflicting = len(evaluated["result"]["mismatches"]) > 1
    return {
        "success": True,
        "result": evaluated["result"],
        "confidence": evaluated["confidence"],
        "uncertainty": build_uncertainty(evaluated["confidence"], evaluated["warnings"], conflicting_signals=conflicting),
        "explainability": build_explainability(
            "Mismatch detection compared structured case data with extracted document fields and expected routing signals.",
            signals=[{"name": "mismatch_count", "value": len(evaluated["result"]["mismatches"]), "impact": "negative" if evaluated["result"]["mismatches"] else "positive", "explanation": "More mismatches reduce consistency confidence."}],
            rules_applied=[{"ruleCode": "track_consistency", "description": "Check whether project facts align with department tracks.", "matched": True, "outcome": "evaluated"}],
            warnings=evaluated["warnings"],
        ),
        "meta": ApiMeta(
            correlationId=request.state.correlation_id,
            modelMode=settings.model_mode,
            serviceVersion=settings.service_version,
            timestamp=datetime.now(timezone.utc),
        ).model_dump(),
    }
