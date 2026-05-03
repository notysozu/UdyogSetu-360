from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from app.config import get_settings
from app.dependencies import require_advisory_api_key
from app.schemas.advisory import (
    AdvisoryFeedbackRequest,
    BottleneckDetectionRequest,
    CaseSummaryRequest,
    DraftAssistanceRequest,
    HumanOverrideRequest,
    NextBestActionRequest,
    SlaRiskPredictionRequest,
)
from app.services.bottleneck_detection_service import detect_bottlenecks
from app.services.drafting_assistant_service import build_draft_assistance
from app.services.explainability_service import build_explainability
from app.services.feedback_service import store_feedback
from app.services.human_override_service import store_override
from app.services.model_metadata_service import get_model, list_models
from app.services.next_best_action_service import suggest_next_best_actions
from app.services.sla_risk_service import predict_sla_risk
from app.services.summarisation_service import build_case_summary
from app.services.uncertainty_service import build_uncertainty
from app.utils.errors import build_error_response

router = APIRouter(prefix="/ai/v1/advisory", tags=["advisory"], dependencies=[Depends(require_advisory_api_key)])


def _meta(request: Request) -> dict:
    settings = get_settings()
    return {
        "correlationId": request.state.correlation_id,
        "serviceVersion": settings.service_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def _advisory() -> dict:
    return {
        "advisoryOnly": True,
        "mustNotAutoApply": True,
        "finalDecisionOwner": "node_or_human_officer",
    }


def _model(name: str) -> dict:
    settings = get_settings()
    metadata = get_model(name) or {
        "modelName": name,
        "modelVersion": "0.1.0",
        "modelMode": settings.advisory_model_mode,
        "trainedAt": None,
        "trainingDataVersion": None,
        "featureSetVersion": None,
        "evaluationMetrics": {},
        "limitations": [],
        "intendedUse": "Operational advisory support only.",
        "notIntendedFor": ["Automatic decision-making"],
    }
    return metadata


def _response(request: Request, model_name: str, evaluated: dict, summary: str, high_risk: bool = False) -> dict:
    settings = get_settings()
    confidence = evaluated["confidence"]
    uncertainty = build_uncertainty(
        confidence if settings.advisory_model_mode == settings.model_mode else min(confidence, 0.69),
        evaluated.get("warnings", []),
        high_risk=high_risk,
    )
    if settings.advisory_model_mode != settings.model_mode:
        uncertainty = {
            "isUncertain": False if confidence >= settings.advisory_confidence_threshold else True,
            "reason": None if confidence >= settings.advisory_confidence_threshold else (evaluated.get("warnings", ["medium_confidence"])[0]),
            "requiresHumanReview": True,
        }
    return {
        "success": True,
        "result": evaluated["result"],
        "confidence": confidence,
        "uncertainty": uncertainty,
        "explainability": build_explainability(
            summary,
            signals=evaluated.get("signals"),
            rules_applied=evaluated.get("rules"),
            warnings=evaluated.get("warnings") or ["Advisory only. Final decision remains with Node domain services and human officers."],
        ),
        "advisory": _advisory(),
        "model": _model(model_name),
        "meta": _meta(request),
    }


@router.get("/health")
@router.get("/ready")
def health(request: Request):
    settings = get_settings()
    return {
        "ok": True,
        "service": "ai-advisory-service",
        "version": settings.service_version,
        "modelMode": settings.advisory_model_mode,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "correlationId": request.state.correlation_id,
    }


@router.post("/sla-risk")
def sla_risk(payload: SlaRiskPredictionRequest, request: Request):
    evaluated = predict_sla_risk(payload.model_dump())
    return _response(request, "dummy_sla_risk_model", evaluated, "SLA risk was estimated from due dates, activity, queue signals, adapter health and historical context.", high_risk=evaluated["result"]["overall_risk_level"] in {"high", "critical"})


@router.post("/bottlenecks")
def bottlenecks(payload: BottleneckDetectionRequest, request: Request):
    evaluated = detect_bottlenecks(payload.model_dump())
    return _response(request, "dummy_bottleneck_model", evaluated, "Likely bottlenecks were inferred from workflow friction signals and recent operational behaviour.")


@router.post("/next-best-actions")
def next_best_actions(payload: NextBestActionRequest, request: Request):
    evaluated = suggest_next_best_actions(payload.model_dump())
    return _response(request, "dummy_next_action_model", evaluated, "Next best actions were selected using role-aware operational rules and current case signals.")


@router.post("/case-summary")
def case_summary(payload: CaseSummaryRequest, request: Request):
    evaluated = build_case_summary(payload.model_dump())
    return _response(request, "dummy_summariser", evaluated, "A safe structured summary was generated from the supplied case data.")


@router.post("/draft-assistance")
def draft_assistance(payload: DraftAssistanceRequest, request: Request):
    evaluated = build_draft_assistance(payload.model_dump())
    return _response(request, "dummy_drafting_model", evaluated, "A review-required draft was generated using safe deterministic drafting rules.")


@router.post("/feedback")
def feedback(payload: AdvisoryFeedbackRequest, request: Request):
    result = store_feedback(payload.model_dump())
    return _response(
        request,
        "dummy_next_action_model",
        {"result": result, "confidence": 0.72, "warnings": [], "signals": [], "rules": [{"ruleCode": "feedback_masking", "description": "Sensitive text is masked before storage.", "matched": True, "outcome": "stored_safely"}]},
        "Feedback was captured for advisory improvement without changing workflow state.",
    )


@router.post("/human-override")
def human_override(payload: HumanOverrideRequest, request: Request):
    try:
        result = store_override(payload.model_dump())
    except ValueError as exc:
        return build_error_response(
            "VALIDATION_ERROR",
            str(exc),
            request.state.correlation_id,
            status_code=400,
            advisory=_advisory(),
        )
    return _response(
        request,
        "dummy_next_action_model",
        {"result": result, "confidence": 0.75, "warnings": [], "signals": [], "rules": [{"ruleCode": "override_reason_required", "description": "Human override logging requires a reason.", "matched": True, "outcome": "logged"}]},
        "Human override feedback was captured as a non-authoritative advisory improvement signal.",
    )


@router.get("/models")
def models(request: Request):
    return _response(
        request,
        "dummy_next_action_model",
        {"result": {"models": list_models()}, "confidence": 0.88, "warnings": [], "signals": [], "rules": []},
        "Available advisory model metadata was returned.",
    )


@router.get("/models/{model_name}")
def model_by_name(model_name: str, request: Request):
    model = get_model(model_name)
    if not model:
        return build_error_response(
            "NOT_FOUND",
            "Requested advisory model metadata was not found.",
            request.state.correlation_id,
            status_code=404,
            advisory=_advisory(),
        )
    return _response(
        request,
        model_name,
        {"result": model, "confidence": 0.88, "warnings": [], "signals": [], "rules": []},
        "Requested advisory model metadata was returned.",
    )
