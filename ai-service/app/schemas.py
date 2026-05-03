from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SubmissionPayload(BaseModel):
    applicantName: Optional[str] = None
    applicantEmail: Optional[str] = None
    enterpriseName: Optional[str] = None
    industry: Optional[str] = None
    district: Optional[str] = None
    fireSafety: Optional[str] = None
    factoryLicence: Optional[str] = None
    labourRegistration: Optional[str] = None
    powerConnection: Optional[str] = None
    pollutionConsent: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ValidationResponse(BaseModel):
    ok: bool = True
    completenessScore: float
    missingFields: List[str]
    warnings: List[str]
    explanation: str


class RecommendationResponse(BaseModel):
    ok: bool = True
    recommendedDepartments: List[str]
    confidence: float
    explanation: str


class DelayRiskRequest(BaseModel):
    caseId: Optional[str] = None
    currentStatus: Optional[str] = None
    daysOpen: int = 0
    pendingDepartments: int = 0
    grievanceCount: int = 0


class DelayRiskResponse(BaseModel):
    ok: bool = True
    riskScore: float
    riskBand: str
    reasons: List[str]
    suggestedNextAction: str
