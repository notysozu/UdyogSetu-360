# Contract Test Plan

## Approach
Contract tests verify boundaries, not implementation internals. They should run with seeded fixtures and validate response envelopes, schemas, headers, idempotency and safe failure modes.

## 1. Gateway API Contracts
- Standard success envelope.
- Error envelope.
- Correlation ID headers.
- Idempotency headers.
- Auth errors.
- Validation errors.

## 2. Case Service Contracts
- Create draft.
- Submit case.
- Amend case.
- Resubmit case.
- Get timeline.
- Get tasks.
- Get documents.

## 3. Orchestration Contracts
- Transition case.
- Transition task.
- Recalculate aggregate case status.
- Replay events.

## 4. Kafka Event Contracts
- CloudEvents-like envelope.
- Case events.
- Task events.
- Document events.
- Grievance events.
- Inspection events.
- Fee events.
- Certificate events.

## 5. RabbitMQ Message Contracts
- Queue message envelope.
- Outbound department delivery job.
- Inbound callback reconciliation job.
- Dead-letter message shape.

## 6. Department Adapter Contracts
- `submitApplication`
- `getStatus`
- `pushDocument`
- `receiveCallback`
- `healthCheck`
- error classification.

## 7. Document Subsystem Contracts
- Upload intent.
- Signed URL.
- Confirm upload.
- Download URL.
- Versioning.
- Certificate verification.

## 8. Notification And Grievance Contracts
- Notification creation.
- Template rendering.
- Grievance create/update/close.
- SLA escalation.

## 9. AI Service Contracts
- Document completeness.
- Field normalisation.
- Mismatch detection.
- Approval-path recommendation.
- Smart routing suggestions.

## 10. AI Advisory Contracts
- SLA risk.
- Bottleneck detection.
- Next-best-action.
- Case summary.
- Draft assistance.

## 11. n8n Workflow Contracts
- Inbound webhook payload.
- Reconciliation payload.
- Reminder payload.
- Escalation payload.
- Adapter reprocessing payload.
- Document verification callback payload.

## Starter Files
Starter contract tests live in `tests/contract/`. Node tests use the built-in `node:test` runner so they can run without adding a new framework. Python AI contract tests should use pytest.

## OpenAPI Notes
If `/api/v1/openapi.json` is available, contract tests should load it and validate route presence. If not available, keep schema validation against JSON fixtures and mark OpenAPI generation as a go-live TODO.
