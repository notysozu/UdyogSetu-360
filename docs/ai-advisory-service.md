# AI Advisory Service

## Purpose
This module extends the existing Python FastAPI AI service with operational intelligence endpoints for:
- SLA-risk prediction
- likely bottleneck detection
- next-best-action suggestions
- safe case summarisation
- officer drafting assistance
- feedback capture
- human override logging

The module is advisory only. It does not mutate case, task, grievance, certificate, queue or notification state.

## Architecture Choice
The repo already had `services/ai-service`, so the safest option was to add this work as a module inside the existing service under `services/ai-service/app/`. This avoids introducing a second deployment and keeps existing AI endpoints intact.

## Endpoints
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

## Response Contract
Every advisory response includes:
- `confidence`
- `uncertainty`
- `explainability`
- `advisory`
- `model`
- `meta`

The `advisory` block explicitly states that results must not be auto-applied and that final decisions remain with Node services and authorised humans.

## Advisory Rules
### SLA risk
- overdue entities increase risk sharply
- high elapsed SLA percentage increases risk
- long inactivity increases risk
- queue backlog and deadletters increase risk
- adapter failures increase risk

### Bottlenecks
- queue backlog
- adapter failures
- no activity
- repeated query cycles

### Next best actions
- role-aware suggestions only
- auditors get read-only suggestions
- investors get upload/respond style suggestions
- officers get task-level operational suggestions
- supervisors and nodal leads get coordination or escalation hints

### Safe summarisation
- excludes secrets, tokens, signed URLs and private internal comments
- investor summaries exclude internal notes
- missing evidence is reported as unavailable rather than invented

### Draft assistance
- formal British English by default
- never produces final legal decisions
- always requires human review
- avoids unsupported claims, commitments and invented dates

## Feature Engineering Placeholders
`feature_engineering_service.py` includes starter extractors for:
- case age
- task age
- queue pressure
- adapter instability
- document defects
- grievances
- historical breach rates

## Training Stubs
Training helpers live in `services/ai-service/app/training/`:
- `dataset_builder.py`
- `train_sla_risk_stub.py`
- `train_bottleneck_stub.py`
- `train_next_action_stub.py`
- `evaluate_stub.py`

These are placeholders only. They generate synthetic examples and metadata, and they should not train on PII by default.

## Feedback And Override Logging
- feedback is stored as masked JSONL in development
- override logs are advisory-learning records only
- Node services must still write legal audit records separately

## Node Integration
Added:
- `services/case-service/src/services/ai-advisory-client.service.js`
- `services/case-service/src/services/ai-advisory-fallback.service.js`

Suggested uses:
- department task detail page: next-best-action hints
- SLA dashboard: SLA risk
- operations console: bottlenecks
- case detail page: safe summary
- query form: draft assistance

If the service is unavailable, Node falls back to deterministic rules and returns low-to-medium confidence advisory output without blocking workflow.

## Environment Variables
- `AI_ADVISORY_ENABLED`
- `AI_ADVISORY_BASE_URL`
- `AI_ADVISORY_TIMEOUT_MS`
- `AI_ADVISORY_RETRIES`
- `AI_ADVISORY_REQUIRE_AUTH`
- `AI_ADVISORY_API_KEY`
- `AI_ADVISORY_MODEL_MODE`
- `AI_ADVISORY_CONFIDENCE_THRESHOLD`
- `AI_ADVISORY_UNCERTAIN_THRESHOLD`
- `AI_ADVISORY_FEEDBACK_ENABLED`
- `AI_ADVISORY_SAFE_SUMMARY_MAX_CHARS`
- `AI_ADVISORY_DRAFT_MAX_CHARS`
- `AI_ADVISORY_DISABLE_FREEFORM_LLM`
- `AI_ADVISORY_ALLOW_DUMMY_MODE`

## Manual Test Commands
Health:
```bash
curl http://localhost:8000/ai/v1/advisory/health
```

SLA risk:
```bash
curl -X POST http://localhost:8000/ai/v1/advisory/sla-risk \
  -H "Content-Type: application/json" \
  -H "x-correlation-id: demo-advisory-001" \
  -d '{
    "case_snapshot": {
      "universal_case_id": "US360-KA-2026-000001",
      "case_type": "new_industrial_unit",
      "status": "under_scrutiny",
      "current_stage": "department_review",
      "department_codes": ["pollution", "power", "fire", "labour"],
      "last_activity_at": "2026-05-01T10:00:00Z"
    },
    "tasks": [
      {
        "task_id": "task-fire-001",
        "department_code": "fire",
        "task_type": "fire_noc",
        "status": "inspection_scheduled",
        "due_at": "2026-05-03T10:00:00Z",
        "last_activity_at": "2026-05-01T10:00:00Z"
      }
    ],
    "sla_signals": [
      {
        "entity_type": "task",
        "status": "warning",
        "due_at": "2026-05-03T10:00:00Z",
        "elapsed_percentage": 85
      }
    ]
  }'
```

Next best actions:
```bash
curl -X POST http://localhost:8000/ai/v1/advisory/next-best-actions \
  -H "Content-Type: application/json" \
  -d '{
    "actor_context": {
      "actor_type": "user",
      "actor_id": "officer-001",
      "role": "department_officer",
      "department_code": "fire"
    },
    "case_snapshot": {
      "universal_case_id": "US360-KA-2026-000001",
      "case_type": "new_industrial_unit",
      "status": "under_scrutiny",
      "current_stage": "department_review",
      "department_codes": ["fire"]
    },
    "tasks": [
      {
        "task_id": "task-fire-001",
        "department_code": "fire",
        "task_type": "fire_noc",
        "status": "inspection_scheduled",
        "inspection_required": true
      }
    ],
    "max_actions": 3
  }'
```

Draft assistance:
```bash
curl -X POST http://localhost:8000/ai/v1/advisory/draft-assistance \
  -H "Content-Type: application/json" \
  -d '{
    "actor_context": {
      "actor_type": "user",
      "actor_id": "officer-001",
      "role": "department_officer",
      "department_code": "pollution"
    },
    "draft_type": "query_to_investor",
    "case_snapshot": {
      "universal_case_id": "US360-KA-2026-000001",
      "case_type": "new_industrial_unit",
      "status": "under_scrutiny",
      "current_stage": "document_scrutiny",
      "department_codes": ["pollution"]
    },
    "issue_summary": "Pollution control document is missing details about effluent treatment arrangement.",
    "tone": "formal"
  }'
```
