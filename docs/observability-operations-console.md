# Observability and Operations Console

## Overview
This implementation adds structured observability primitives and an operations console while preserving separation between:
- Operational logs (debugging/performance)
- Legal audit records (append-only and tamper-evident)

## What Was Added
- Shared structured logger with redaction support.
- Correlation/request ID propagation middleware update.
- Tracing wrapper with no-op fallback when OTEL is disabled.
- In-memory metrics registry and diagnostics endpoints.
- Audit hash-chain service and append-only audit repository/service updates.
- Gateway diagnostics API (`/api/v1/diagnostics/*`), replay API (`/api/v1/replay/*`), and audit API (`/api/v1/audit/*`).
- Stuck-case finding model + detector service.
- Replay attempt model + replay service.
- Department portal operations and audit viewer pages under `/admin/operations` and `/admin/audit`.

## Security
- Sensitive values are redacted from logs (`password`, tokens, keys, cookies, signed URLs, etc.).
- Operations console routes are restricted to `admin`/`auditor` roles.
- Mutating operations (replay start, stuck-case acknowledge/resolve) are admin-only and audited.
- Safe config diagnostics expose flags/thresholds only, not secrets.

## Tamper-Evident Audit
- `AuditEvent` now stores `auditSequence`, `previousHash`, `currentHash`, `hashAlgorithm`.
- Hash uses SHA-256 over canonical payload + previous hash.
- Integrity verification endpoint compares computed vs stored chain hashes.
- Repository intentionally has no update/delete methods for legal records.

## Key Routes
- Diagnostics:
  - `GET /api/v1/diagnostics/health`
  - `GET /api/v1/diagnostics/readiness`
  - `GET /api/v1/diagnostics/config`
  - `GET /api/v1/diagnostics/dependencies`
  - `GET /api/v1/diagnostics/queues`
  - `GET /api/v1/diagnostics/kafka`
  - `GET /api/v1/diagnostics/rabbitmq`
  - `GET /api/v1/diagnostics/adapters`
  - `GET /api/v1/diagnostics/consumers`
  - `GET /api/v1/diagnostics/jobs`
  - `GET /api/v1/diagnostics/stuck-cases`
  - `GET /api/v1/diagnostics/cases/:caseId/trace`
  - `GET /api/v1/diagnostics/correlation/:correlationId`
  - `POST /api/v1/diagnostics/run-stuck-case-scan`
- Replay:
  - `GET /api/v1/replay/attempts`
  - `GET /api/v1/replay/attempts/:replayId`
  - `POST /api/v1/replay`
  - `POST /api/v1/replay/:replayId/cancel`
  - `POST /api/v1/replay/case/:universalCaseId`
  - `POST /api/v1/replay/dead-letter/:messageId`
- Audit:
  - `GET /api/v1/audit/events`
  - `GET /api/v1/audit/events/:eventId`
  - `GET /api/v1/audit/case/:universalCaseId`
  - `POST /api/v1/audit/integrity/verify`
  - `POST /api/v1/audit/export`

## Operations Console Pages
- `/admin/operations`
- `/admin/operations/health`
- `/admin/operations/queues`
- `/admin/operations/adapters`
- `/admin/operations/consumers`
- `/admin/operations/stuck-cases`
- `/admin/operations/replay`
- `/admin/operations/cases/:caseId/trace`
- `/admin/operations/correlation/:correlationId`
- `/admin/audit`
- `/admin/audit/events`
- `/admin/audit/integrity`
- `/admin/audit/export`

## Manual Test Steps
1. Start gateway, audit-service, orchestration-service, case-service, notification-service, department-portal.
2. Login as admin.
3. Open `/admin/operations` and verify health/queue/consumer summaries.
4. Open stuck-cases page and trigger scan using diagnostics API.
5. Start dry-run replay from `/admin/operations/replay/new`.
6. Open `/admin/audit/integrity` and run hash-chain verification.
7. Export audit trail from `/admin/audit/export`.
8. Login as auditor and confirm read-only access.
9. Login as investor and confirm operations console is denied.

## TODO
- Replace diagnostics placeholders for RabbitMQ/adapter deep stats with broker/runtime integrations.
- Add distributed locks for scan/replay jobs in multi-instance production.
- Add optional PDF export backend for audit exports.
