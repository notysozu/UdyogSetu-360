from typing import Any, Dict, List

from pydantic import BaseModel, Field

from app.schemas.common import CaseContext, DocumentReference, EnterpriseContext, ProjectContext


class MismatchItem(BaseModel):
    mismatch_type: str
    field_name: str
    source_a: str
    value_a: Any
    source_b: str
    value_b: Any
    severity: str
    reason: str
    suggested_resolution: str
    confidence: float


class MismatchDetectionRequest(BaseModel):
    case_context: CaseContext
    enterprise: EnterpriseContext
    project: ProjectContext
    provided_documents: List[DocumentReference] = Field(default_factory=list)
    extracted_document_fields: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    previous_case_summary: Dict[str, Any] = Field(default_factory=dict)
    department_records: Dict[str, Any] = Field(default_factory=dict)


class MismatchDetectionResult(BaseModel):
    mismatch_status: str
    mismatches: List[MismatchItem]
    consistency_score: float
    suggested_resolutions: List[str]
