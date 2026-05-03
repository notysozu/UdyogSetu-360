# UdyogSetu 360 Production Blueprint

## Summary
UdyogSetu 360 is the interoperability spine behind Karnataka's Single Window System. It joins canonical case management, two-way department synchronisation, Kafka events, RabbitMQ delivery, S3/MinIO documents, EJS portals, analytics, operations, legal audit, AI advisory services and n8n automations into one production-ready platform.

Authoritative operational state remains in MongoDB through Node domain services. Kafka is the canonical event stream. RabbitMQ is for delivery jobs and retry workflows. AI services and n8n never become the source of truth.

## Blueprint Index
- Architecture narrative: `docs/architecture-narrative.md`
- Final repository tree: `docs/final-repository-tree.md`
- End-to-end test plan: `docs/end-to-end-test-plan.md`
- Contract test plan: `docs/contract-test-plan.md`
- Performance test plan: `docs/performance-test-plan.md`
- Security checklist: `docs/security-checklist.md`
- Secrets management: `docs/secrets-management.md`
- Backup and disaster recovery: `docs/backup-disaster-recovery.md`
- Pilot rollout plan: `docs/pilot-rollout-plan.md`
- Cutover plan: `docs/cutover-plan.md`
- Go-live readiness: `docs/go-live-readiness.md`
- Legacy import plan: `docs/legacy-data-import-plan.md`
- Demo data plan: `docs/demo-data-plan.md`

## Test Strategy
Testing is layered:
- Unit tests for domain services, validators, adapters, projections and AI services.
- Contract tests for HTTP, Kafka, RabbitMQ, adapter, document, AI and n8n boundaries.
- E2E tests for investor, department, public, operations, audit and AI fallback journeys.
- Performance tests for CAF, timelines, inboxes, dashboards, webhooks and queue workers.
- Security tests for auth, access control, headers, secrets, webhooks and file handling.

## Deployment Summary
Docker Compose supports local and test environments. Kubernetes placeholders in `infra/k8s` define target deployment structure, probes, resource placeholders, network policy and persistent volumes. Production should prefer managed MongoDB, Kafka, RabbitMQ and object storage where procurement and compliance allow.

## Security Summary
Required controls include JWT/cookie hardening, service credentials, RBAC, ABAC, route guards, document permissions, rate limits, signed URL expiry, webhook signatures, audit trails, secret scanning and privacy thresholds.

## Disaster Recovery Summary
MongoDB and object storage backups are primary. Kafka supports replay but is not the only state store. RabbitMQ delivery jobs should be reconstructable from durable records where possible. Audit hash-chain verification is required after restore.

## Pilot Rollout Summary
Pilot departments are pollution, power, fire, industrial safety and labour. Rollout moves through discovery, mock validation, sandbox integration, parallel run, controlled pilot and scale decision.

## Go-Live Criteria Summary
Go-live requires passing E2E, contract, performance and security gates; verified backups and restore; functioning observability and operations console; onboarded users; tested rollback; validated public privacy; and confirmed audit integrity.

## Diagrams Index
- `docs/diagrams/architecture-overview.mmd`
- `docs/diagrams/caf-submission-sequence.mmd`
- `docs/diagrams/two-way-sync-sequence.mmd`
- `docs/diagrams/department-callback-sequence.mmd`
- `docs/diagrams/document-verification-sequence.mmd`
- `docs/diagrams/grievance-escalation-sequence.mmd`
- `docs/diagrams/sla-escalation-sequence.mmd`
- `docs/diagrams/event-backbone-sequence.mmd`
- `docs/diagrams/operations-replay-sequence.mmd`
- `docs/diagrams/pilot-cutover-sequence.mmd`

## Runbook Index
Runbooks live in `docs/runbooks/` and cover incident response, queue backlog, adapter failures, outbox issues, dead letters, document storage, AI downtime, n8n failures, audit exports, backup/restore and rollback.

## Known Assumptions
- The current repo is already a monorepo with an older `web` workspace retained for compatibility.
- The AI advisory module is currently implemented inside `services/ai-service`.
- Kafka/RabbitMQ can be local in development and managed or clustered in production.
- Some production policies, official SLAs and department-specific data contracts must be finalised with stakeholders.

## Open TODOs
- Replace placeholder Kubernetes resource sizes with environment-specific values.
- Add official RPO/RTO values after operations approval.
- Wire contract tests to generated OpenAPI and event schema artefacts.
- Complete department-specific sandbox credentials and callback certificates.
