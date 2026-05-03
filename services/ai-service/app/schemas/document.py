from typing import Dict, List, Optional

from pydantic import BaseModel, Field

from app.schemas.common import CaseContext, DocumentReference, EnterpriseContext, ProjectContext


class MissingDocumentItem(BaseModel):
    document_type: str
    label: str
    required_for_department: str
    reason: str
    severity: str


class DocumentCompletenessRequest(BaseModel):
    case_context: CaseContext
    enterprise: EnterpriseContext
    project: ProjectContext
    provided_documents: List[DocumentReference] = Field(default_factory=list)
    declared_approval_tracks: List[str] = Field(default_factory=list)
    locale: Optional[str] = "en"
    strict_mode: bool = False


class DocumentCompletenessResult(BaseModel):
    completeness_status: str
    missing_documents: List[MissingDocumentItem]
    optional_documents: List[str]
    invalid_documents: List[str]
    duplicate_documents: List[str]
    required_by_department: Dict[str, List[str]]
    suggested_next_actions: List[str]
