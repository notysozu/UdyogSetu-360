from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class FieldNormalisationRequest(BaseModel):
    raw_fields: Dict[str, Any] = Field(default_factory=dict)
    field_context: Dict[str, Any] = Field(default_factory=dict)
    locale: Optional[str] = "en"
    normalisation_profile: Optional[str] = "default"


class ChangedField(BaseModel):
    field_name: str
    original_value: Any
    normalised_value: Any
    method: str
    confidence: float


class UnresolvedField(BaseModel):
    field_name: str
    value: Any
    reason: str
    suggested_action: str


class FieldNormalisationResult(BaseModel):
    normalised_fields: Dict[str, Any]
    changed_fields: List[ChangedField]
    unresolved_fields: List[UnresolvedField]
    validation_warnings: List[str]
