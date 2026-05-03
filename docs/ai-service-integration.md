# AI Service Integration

## Role in UdyogSetu 360
The AI service is advisory only. It provides recommendations, confidence, uncertainty, and explainability. It never updates MongoDB state directly and never replaces Node orchestration or officer decisions.

## Node Integration Files
- `services/case-service/src/config/ai.config.js`
- `services/case-service/src/services/ai-client.service.js`
- `services/case-service/src/services/ai-fallback.service.js`
- `services/case-service/src/routes/ai.routes.js`
- `services/case-service/src/controllers/ai.controller.js`

## How Node Calls AI
Node services call:
- `/ai/v1/documents/completeness-check`
- `/ai/v1/fields/normalise`
- `/ai/v1/mismatch/detect`
- `/ai/v1/routing/approval-path`
- `/ai/v1/routing/smart-suggestions`

Requests pass:
- `x-correlation-id`
- optional `x-ai-service-key`

## Fallback Behaviour
If the AI service is disabled, times out, or returns network errors:
- `ai-client.service.js` falls back to deterministic Node rules
- fallback confidence stays conservative
- `requiresHumanReview` remains true
- CAF flow should not break due to AI unavailability

## Example Integration Points
- CAF validation: call document completeness and mismatch detection before final submit
- Draft save: call field normalisation for safe suggestions
- Approval routing: compare AI recommendation with deterministic Node routing before task creation
- Dashboards: use smart routing suggestions as advisory notes only

## Protected Debug Routes
- `POST /api/v1/ai/test/document-completeness`
- `POST /api/v1/ai/test/approval-path`

These routes are intended for `admin` or `system` callers only.

## Troubleshooting
- Check `/health` and `/ready` on the AI service
- Verify `AI_SERVICE_BASE_URL`
- Verify `AI_SERVICE_REQUIRE_AUTH` and `AI_SERVICE_API_KEY`
- If requests still fail, Node fallback should continue returning advisory output
