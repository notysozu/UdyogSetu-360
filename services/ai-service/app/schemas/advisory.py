from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class ActorContext(BaseModel):
    actor_type: str
    actor_id: Optional[str] = None
    role: Optional[str] = None
    department_code: Optional[str] = None


class CaseSnapshot(BaseModel):
    case_id: Optional[str] = None
    universal_case_id: Optional[str] = None
    case_type: str
    status: str
    current_stage: str
    created_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    department_codes: List[str] = Field(default_factory=list)
    priority: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TaskSnapshot(BaseModel):
    task_id: Optional[str] = None
    department_code: str
    task_type: str
    status: str
    assigned_officer_id: Optional[str] = None
    created_at: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    last_activity_at: Optional[datetime] = None
    checklist_progress: Optional[float] = None
    query_count: Optional[int] = None
    inspection_required: Optional[bool] = None
    fee_pending: Optional[bool] = None
    certificate_pending: Optional[bool] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class DocumentSignal(BaseModel):
    document_type: str
    status: str
    version: Optional[int] = None
    rejection_reason: Optional[str] = None
    verified: Optional[bool] = None
    uploaded_at: Optional[datetime] = None
    corrected_at: Optional[datetime] = None


class GrievanceSignal(BaseModel):
    status: str
    priority: str
    category: str
    due_at: Optional[datetime] = None
    escalation_level: Optional[int] = None
    last_activity_at: Optional[datetime] = None


class SlaSignal(BaseModel):
    entity_type: str
    status: str
    due_at: datetime
    warning_at: Optional[datetime] = None
    breached_at: Optional[datetime] = None
    elapsed_percentage: Optional[float] = None
    paused_minutes: Optional[int] = None
    escalation_level: Optional[int] = None


class QueueSignal(BaseModel):
    queue_name: Optional[str] = None
    backlog_count: Optional[int] = None
    deadletter_count: Optional[int] = None
    retry_count: Optional[int] = None
    oldest_message_age_minutes: Optional[int] = None


class AdapterSignal(BaseModel):
    department_code: str
    last_health_status: Optional[str] = None
    recent_failure_count: Optional[int] = None
    average_latency_ms: Optional[float] = None
    last_success_at: Optional[datetime] = None
    last_failure_at: Optional[datetime] = None


class HistoricalSignal(BaseModel):
    department_code: Optional[str] = None
    average_turnaround_hours: Optional[float] = None
    p90_turnaround_hours: Optional[float] = None
    recent_sla_breach_rate: Optional[float] = None
    recent_rejection_rate: Optional[float] = None
    recent_query_rate: Optional[float] = None


class ExplainabilitySignal(BaseModel):
    name: str
    value: Any
    weight: Optional[float] = None
    impact: str
    explanation: str


class ExplainabilityRule(BaseModel):
    ruleCode: str
    description: str
    matched: bool
    outcome: str


class ExplainabilityPayload(BaseModel):
    summary: str
    signals: List[ExplainabilitySignal] = Field(default_factory=list)
    rulesApplied: List[ExplainabilityRule] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class ConfidencePayload(BaseModel):
    score: float


class UncertaintyPayload(BaseModel):
    isUncertain: bool
    reason: Optional[str] = None
    requiresHumanReview: bool


class AdvisoryDisclaimer(BaseModel):
    advisoryOnly: bool = True
    mustNotAutoApply: bool = True
    finalDecisionOwner: str = "node_or_human_officer"


class ModelMetadata(BaseModel):
    modelName: str
    modelVersion: str
    modelMode: str
    trainedAt: Optional[datetime] = None
    trainingDataVersion: Optional[str] = None
    featureSetVersion: Optional[str] = None
    evaluationMetrics: Dict[str, Any] = Field(default_factory=dict)
    limitations: List[str] = Field(default_factory=list)
    intendedUse: str
    notIntendedFor: List[str] = Field(default_factory=list)


class AdvisoryMeta(BaseModel):
    correlationId: str
    serviceVersion: str
    timestamp: datetime


class AtRiskEntity(BaseModel):
    entity_type: str
    entity_id: str
    department_code: Optional[str] = None
    current_status: str
    due_at: Optional[datetime] = None
    risk_score: int
    risk_level: Literal["low", "medium", "high", "critical"]
    reason: str
    suggested_owner_role: str


class RiskDriver(BaseModel):
    driver_code: str
    label: str
    impact: str
    evidence: str
    confidence: float


class RecommendedIntervention(BaseModel):
    action_code: str
    label: str
    owner_role: str
    department_code: Optional[str] = None
    urgency: str
    reason: str
    must_be_human_approved: bool = True


class BottleneckItem(BaseModel):
    bottleneck_type: str
    department_code: Optional[str] = None
    stage: Optional[str] = None
    severity: str
    bottleneck_score: int
    evidence: List[str] = Field(default_factory=list)
    likely_cause: str
    recommended_action: str
    confidence: float


class SuggestedAction(BaseModel):
    action_code: str
    label: str
    description: str
    owner_role: str
    department_code: Optional[str] = None
    target_entity_type: str
    target_entity_id: Optional[str] = None
    priority: str
    reason: str
    expected_outcome: str
    confidence: float
    must_be_human_approved: bool = True


class TimelineEvent(BaseModel):
    event_type: str
    occurred_at: Optional[datetime] = None
    summary: Optional[str] = None
    safe_text: Optional[str] = None


class ChecklistItem(BaseModel):
    item_code: Optional[str] = None
    label: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None


class SlaRiskPredictionRequest(BaseModel):
    case_snapshot: CaseSnapshot
    tasks: List[TaskSnapshot] = Field(default_factory=list)
    sla_signals: List[SlaSignal] = Field(default_factory=list)
    queue_signals: List[QueueSignal] = Field(default_factory=list)
    adapter_signals: List[AdapterSignal] = Field(default_factory=list)
    historical_signals: List[HistoricalSignal] = Field(default_factory=list)
    locale: Optional[str] = None


class BottleneckDetectionRequest(BaseModel):
    case_snapshot: Optional[CaseSnapshot] = None
    tasks: List[TaskSnapshot] = Field(default_factory=list)
    queue_signals: List[QueueSignal] = Field(default_factory=list)
    adapter_signals: List[AdapterSignal] = Field(default_factory=list)
    historical_signals: List[HistoricalSignal] = Field(default_factory=list)
    stage_metrics: Dict[str, Any] = Field(default_factory=dict)
    locale: Optional[str] = None


class NextBestActionRequest(BaseModel):
    actor_context: ActorContext
    case_snapshot: CaseSnapshot
    tasks: List[TaskSnapshot] = Field(default_factory=list)
    documents: List[DocumentSignal] = Field(default_factory=list)
    grievances: List[GrievanceSignal] = Field(default_factory=list)
    sla_signals: List[SlaSignal] = Field(default_factory=list)
    queue_signals: List[QueueSignal] = Field(default_factory=list)
    adapter_signals: List[AdapterSignal] = Field(default_factory=list)
    historical_signals: List[HistoricalSignal] = Field(default_factory=list)
    max_actions: int = 5
    locale: Optional[str] = None


class CaseSummaryRequest(BaseModel):
    actor_context: ActorContext
    case_snapshot: CaseSnapshot
    tasks: List[TaskSnapshot] = Field(default_factory=list)
    documents: List[DocumentSignal] = Field(default_factory=list)
    grievances: List[GrievanceSignal] = Field(default_factory=list)
    timeline_events: List[TimelineEvent] = Field(default_factory=list)
    audit_events: List[Dict[str, Any]] = Field(default_factory=list)
    max_length: Optional[int] = None
    summary_type: Literal["investor", "officer", "nodal", "audit", "committee"]
    locale: Optional[str] = None


class DraftAssistanceRequest(BaseModel):
    actor_context: ActorContext
    draft_type: Literal[
        "query_to_investor",
        "status_note",
        "inspection_note",
        "rejection_reason",
        "approval_condition",
        "grievance_reply",
        "escalation_note",
    ]
    case_snapshot: CaseSnapshot
    task: Optional[TaskSnapshot] = None
    documents: List[DocumentSignal] = Field(default_factory=list)
    checklist_items: List[ChecklistItem] = Field(default_factory=list)
    issue_summary: Optional[str] = None
    tone: Optional[str] = None
    locale: Optional[str] = None
    max_length: Optional[int] = None


class AdvisoryFeedbackRequest(BaseModel):
    advisory_request_id: Optional[str] = None
    endpoint_name: str
    universal_case_id: Optional[str] = None
    actor_context: ActorContext
    suggestion_id: Optional[str] = None
    rating: Literal["helpful", "not_helpful", "incorrect", "unsafe", "used", "ignored"]
    feedback_text: Optional[str] = None
    selected_action_code: Optional[str] = None
    final_human_action: Optional[str] = None
    override_reason: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class HumanOverrideRequest(BaseModel):
    advisory_request_id: Optional[str] = None
    endpoint_name: str
    universal_case_id: Optional[str] = None
    actor_context: ActorContext
    original_recommendation_summary: str
    human_decision: str
    override_type: Literal["accepted", "modified", "rejected", "ignored"]
    override_reason: str
    final_action_taken: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
