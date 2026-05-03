from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from app.config import get_settings
from app.dependencies import require_api_key
from app.schemas.common import ApiMeta
from app.schemas.document import DocumentCompletenessRequest
from app.services.document_completeness_service import check_document_completeness
from app.services.explainability_service import build_explainability
from app.services.uncertainty_service import build_uncertainty

router = APIRouter(prefix="/ai/v1/documents", tags=["validation"], dependencies=[Depends(require_api_key)])


@router.post("/completeness-check")
def document_completeness(payload: DocumentCompletenessRequest, request: Request):
    settings = get_settings()
    evaluated = check_document_completeness(payload)
    uncertainty = build_uncertainty(evaluated["confidence"], evaluated["warnings"])
    return {
        "success": True,
        "result": evaluated["result"],
        "confidence": evaluated["confidence"],
        "uncertainty": uncertainty,
        "explainability": build_explainability(
            "Document completeness was evaluated using declared or inferred department tracks.",
            signals=[
                {"name": "provided_documents_count", "value": len(payload.provided_documents), "weight": 0.4, "impact": "positive", "explanation": "More document references increase confidence."},
                {"name": "inferred_tracks", "value": evaluated["tracks"], "weight": 0.5, "impact": "neutral", "explanation": "Tracks were inferred from project indicators."},
            ],
            rules_applied=[{"ruleCode": f"track_{track}", "description": f"Required document rules for {track}.", "matched": True, "outcome": "evaluated"} for track in evaluated["tracks"]],
            warnings=evaluated["warnings"],
        ),
        "meta": ApiMeta(
            correlationId=request.state.correlation_id,
            modelMode=settings.model_mode,
            serviceVersion=settings.service_version,
            timestamp=datetime.now(timezone.utc),
        ).model_dump(),
    }
