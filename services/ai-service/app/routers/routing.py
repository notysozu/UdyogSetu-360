from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request

from app.config import get_settings
from app.dependencies import require_api_key
from app.schemas.common import ApiMeta
from app.schemas.routing import ApprovalPathRecommendationRequest, SmartRoutingRequest
from app.services.approval_path_service import recommend_approval_path
from app.services.explainability_service import build_explainability
from app.services.smart_routing_service import get_smart_routing_suggestions
from app.services.uncertainty_service import build_uncertainty

router = APIRouter(prefix="/ai/v1/routing", tags=["routing"], dependencies=[Depends(require_api_key)])


@router.post("/approval-path")
def approval_path(payload: ApprovalPathRecommendationRequest, request: Request):
    settings = get_settings()
    evaluated = recommend_approval_path(payload)
    return {
        "success": True,
        "result": evaluated["result"],
        "confidence": evaluated["confidence"],
        "uncertainty": build_uncertainty(evaluated["confidence"], evaluated["warnings"], high_risk=len(evaluated["result"]["recommended_tracks"]) >= 4),
        "explainability": build_explainability(
            "Approval-path recommendation combines project facts with deterministic department routing rules.",
            signals=[{"name": "recommended_tracks", "value": [track["department_code"] for track in evaluated["result"]["recommended_tracks"]], "impact": "neutral", "explanation": "Detected tracks are advisory only."}],
            rules_applied=[{"ruleCode": "approval_track_rules", "description": "Department approval track inference rules.", "matched": True, "outcome": "applied"}],
            warnings=evaluated["warnings"],
        ),
        "meta": ApiMeta(
            correlationId=request.state.correlation_id,
            modelMode=settings.model_mode,
            serviceVersion=settings.service_version,
            timestamp=datetime.now(timezone.utc),
        ).model_dump(),
    }


@router.post("/smart-suggestions")
def smart_suggestions(payload: SmartRoutingRequest, request: Request):
    settings = get_settings()
    evaluated = get_smart_routing_suggestions(payload)
    return {
        "success": True,
        "result": evaluated["result"],
        "confidence": evaluated["confidence"],
        "uncertainty": build_uncertainty(evaluated["confidence"], evaluated["warnings"], high_risk=evaluated["result"]["delay_risk_score"] >= 0.7),
        "explainability": build_explainability(
            "Smart routing suggestions summarise likely bottlenecks and next best actions without mutating workflow state.",
            signals=[{"name": "delay_risk_score", "value": evaluated["result"]["delay_risk_score"], "impact": "negative" if evaluated["result"]["delay_risk_score"] >= 0.65 else "neutral", "explanation": "Higher delay-risk score increases escalation urgency."}],
            rules_applied=[{"ruleCode": "smart_routing_rules", "description": "Delay-risk and routing heuristic rules.", "matched": True, "outcome": "applied"}],
            warnings=evaluated["warnings"],
        ),
        "meta": ApiMeta(
            correlationId=request.state.correlation_id,
            modelMode=settings.model_mode,
            serviceVersion=settings.service_version,
            timestamp=datetime.now(timezone.utc),
        ).model_dump(),
    }
