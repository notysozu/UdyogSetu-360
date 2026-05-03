from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from app.config import get_settings
from app.dependencies import require_api_key
from app.schemas.common import ApiMeta
from app.schemas.normalisation import FieldNormalisationRequest
from app.services.explainability_service import build_explainability
from app.services.field_normalisation_service import normalise_fields
from app.services.uncertainty_service import build_uncertainty

router = APIRouter(prefix="/ai/v1/fields", tags=["normalisation"], dependencies=[Depends(require_api_key)])


@router.post("/normalise")
def normalise(payload: FieldNormalisationRequest, request: Request):
    settings = get_settings()
    result = normalise_fields(payload)
    confidence = 0.9 if not result["unresolved_fields"] else 0.62
    warnings = result["validation_warnings"] + (["ambiguous normalisation"] if result["unresolved_fields"] else [])
    return {
        "success": True,
        "result": result,
        "confidence": confidence,
        "uncertainty": build_uncertainty(confidence, warnings),
        "explainability": build_explainability(
            "Field normalisation used deterministic cleanup and alias mapping rules.",
            signals=[{"name": "changed_fields", "value": len(result["changed_fields"]), "impact": "neutral", "explanation": "Changed fields were safely normalised using starter rules."}],
            rules_applied=[{"ruleCode": "normalisation_profile_default", "description": "Default field normalisation profile.", "matched": True, "outcome": "applied"}],
            warnings=warnings,
        ),
        "meta": ApiMeta(
            correlationId=request.state.correlation_id,
            modelMode=settings.model_mode,
            serviceVersion=settings.service_version,
            timestamp=datetime.now(timezone.utc),
        ).model_dump(),
    }
