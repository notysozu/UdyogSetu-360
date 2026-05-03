from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ActorContext(BaseModel):
    actor_type: str
    actor_id: Optional[str] = None
    role: Optional[str] = None
    department_code: Optional[str] = None


class CaseContext(BaseModel):
    case_id: Optional[str] = None
    universal_case_id: Optional[str] = None
    case_type: Optional[str] = None
    status: Optional[str] = None
    department_codes: List[str] = Field(default_factory=list)
    current_stage: Optional[str] = None


class EnterpriseContext(BaseModel):
    legal_name: Optional[str] = None
    organisation_type: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    udyam_number: Optional[str] = None
    district: Optional[str] = None
    sector: Optional[str] = None
    authorised_representative: Optional[bool] = False


class ProjectContext(BaseModel):
    project_name: Optional[str] = None
    sector: Optional[str] = None
    investment_amount: Optional[float] = None
    employment_expected: Optional[int] = None
    district: Optional[str] = None
    land_area_sq_m: Optional[float] = None
    power_requirement_kw: Optional[float] = None
    water_requirement_kld: Optional[float] = None
    hazardous_process: Optional[bool] = None
    boilers: Optional[bool] = None
    workers_count: Optional[int] = None
    fire_noc_required: Optional[bool] = None
    building_height_m: Optional[float] = None
    flammable_storage: Optional[bool] = None


class DocumentReference(BaseModel):
    document_id: Optional[str] = None
    document_type: str
    title: Optional[str] = None
    file_name: Optional[str] = None
    mime_type: Optional[str] = None
    size_bytes: Optional[int] = None
    checksum: Optional[str] = None
    status: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    extracted_fields: Dict[str, Any] = Field(default_factory=dict)


class ConfidenceScore(BaseModel):
    score: float


class UncertaintyPayload(BaseModel):
    isUncertain: bool
    reason: Optional[str] = None
    requiresHumanReview: bool


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


class ApiMeta(BaseModel):
    correlationId: str
    modelMode: Optional[str] = None
    serviceVersion: Optional[str] = None
    timestamp: datetime


class AiSuccessResponse(BaseModel, Generic[T]):
    success: bool = True
    result: T
    confidence: float
    uncertainty: UncertaintyPayload
    explainability: ExplainabilityPayload
    meta: ApiMeta


class AiErrorBody(BaseModel):
    code: str
    message: str
    details: List[Any] = Field(default_factory=list)


class AiErrorResponse(BaseModel):
    success: bool = False
    result: Optional[dict] = None
    confidence: float = 0
    uncertainty: UncertaintyPayload
    error: AiErrorBody
    meta: ApiMeta
