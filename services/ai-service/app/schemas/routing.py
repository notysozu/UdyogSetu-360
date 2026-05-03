from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import CaseContext, DocumentReference, EnterpriseContext, ProjectContext


class RecommendedTrack(BaseModel):
    department_code: str
    department_name: str
    task_type: str
    required_approval_type: str
    is_mandatory: bool
    reason: str
    confidence: float
    required_documents: List[str]
    suggested_sla_days: int


class ApprovalPathRecommendationRequest(BaseModel):
    case_context: Optional[CaseContext] = None
    enterprise: EnterpriseContext
    project: ProjectContext
    provided_documents: List[DocumentReference] = Field(default_factory=list)
    existing_tracks: List[str] = Field(default_factory=list)
    locale: Optional[str] = "en"


class ApprovalPathRecommendationResult(BaseModel):
    recommended_tracks: List[RecommendedTrack]
    not_required_tracks: List[str]
    missing_information: List[str]
    overall_routing_confidence: float
    suggested_case_priority: str
    suggested_sla_days: int


class SuggestedRoute(BaseModel):
    department_code: str
    action: str
    reason: str
    urgency: str
    confidence: float


class NextBestAction(BaseModel):
    action_code: str
    label: str
    owner_role: str
    department_code: Optional[str] = None
    reason: str
    due_hint: Optional[str] = None


class SmartRoutingRequest(BaseModel):
    case_context: CaseContext
    enterprise: EnterpriseContext
    project: ProjectContext
    current_tasks: List[Dict[str, Any]] = Field(default_factory=list)
    document_summary: Dict[str, Any] = Field(default_factory=dict)
    grievance_summary: Dict[str, Any] = Field(default_factory=dict)
    sla_summary: Dict[str, Any] = Field(default_factory=dict)
    historical_signals: Dict[str, Any] = Field(default_factory=dict)


class SmartRoutingResult(BaseModel):
    suggested_routes: List[SuggestedRoute]
    suggested_priority: str
    next_best_actions: List[NextBestAction]
    risk_flags: List[str]
    delay_risk_score: float
    officer_notes_suggestion: Optional[str] = None
    confidence: float
