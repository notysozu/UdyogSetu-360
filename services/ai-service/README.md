# UdyogSetu 360 AI Service

## Overview
This FastAPI service provides advisory-only AI endpoints for document completeness, field normalisation, mismatch detection, approval-path recommendation, and smart routing suggestions. It never mutates case state and never issues approvals, rejections, or certificates.
It also includes an operational advisory module for SLA risk prediction, bottleneck detection, next-best-action suggestions, safe case summarisation, drafting assistance, feedback capture and human override learning logs.

## Endpoints
- `GET /health`
- `GET /ready`
- `GET /ai/v1/health`
- `GET /ai/v1/ready`
- `POST /ai/v1/documents/completeness-check`
- `POST /ai/v1/fields/normalise`
- `POST /ai/v1/mismatch/detect`
- `POST /ai/v1/routing/approval-path`
- `POST /ai/v1/routing/smart-suggestions`
- `GET /ai/v1/advisory/health`
- `GET /ai/v1/advisory/ready`
- `POST /ai/v1/advisory/sla-risk`
- `POST /ai/v1/advisory/bottlenecks`
- `POST /ai/v1/advisory/next-best-actions`
- `POST /ai/v1/advisory/case-summary`
- `POST /ai/v1/advisory/draft-assistance`
- `POST /ai/v1/advisory/feedback`
- `POST /ai/v1/advisory/human-override`
- `GET /ai/v1/advisory/models`
- `GET /ai/v1/advisory/models/{model_name}`

## Response Shape
All AI endpoints return:
- `success`
- `result`
- `confidence`
- `uncertainty`
- `explainability`
- `advisory` for the advisory module
- `model` for the advisory module
- `meta`

## Confidence and Uncertainty
- High confidence: above `AI_SERVICE_CONFIDENCE_THRESHOLD`
- Medium confidence: between uncertain and confidence thresholds
- Low confidence: below `AI_SERVICE_UNCERTAIN_THRESHOLD`
- Contradictory signals always require human review

## Security
- Optional API key via `x-ai-service-key`
- Optional advisory API key via `x-ai-advisory-key`
- Correlation ID via `x-correlation-id`
- Request payloads are not persisted
- Logs avoid raw sensitive identifiers

## Advisory Module Notes
- Advisory responses are never auto-applied.
- Feedback and human override logs are non-authoritative improvement signals only.
- Training scripts under `app/training/` are placeholders and must use anonymised data.
- Safe summarisation excludes secrets, tokens, signed URLs and private internal comments.

## Local Run
```bash
cd services/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Tests
```bash
cd services/ai-service
python -m pytest app/tests
```

## Docker
```bash
docker build -f services/ai-service/Dockerfile .
```

## Node Integration
Node services should call this service through the case-service AI client and fallback service. Final workflow decisions remain in Node orchestration/domain services.
