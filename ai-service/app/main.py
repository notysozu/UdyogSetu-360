from fastapi import FastAPI
from app.schemas import (
    SubmissionPayload,
    ValidationResponse,
    RecommendationResponse,
    DelayRiskRequest,
    DelayRiskResponse,
)
from app.services import validate_submission, recommend_approvals, predict_delay

app = FastAPI(
    title="UdyogSetu 360 AI Service",
    description="Advisory AI service for validation, routing and delay-risk prediction.",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"ok": True, "service": "udyogsetu-ai", "version": "0.1.0"}


@app.post("/ai/validate-submission", response_model=ValidationResponse)
def validate_submission_endpoint(payload: SubmissionPayload):
    return validate_submission(payload)


@app.post("/ai/recommend-approvals", response_model=RecommendationResponse)
def recommend_approvals_endpoint(payload: SubmissionPayload):
    return recommend_approvals(payload)


@app.post("/ai/predict-delay", response_model=DelayRiskResponse)
def predict_delay_endpoint(request: DelayRiskRequest):
    return predict_delay(request)
