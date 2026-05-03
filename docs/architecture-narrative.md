# UdyogSetu 360 Architecture Narrative

## Executive Summary
Karnataka already has a front door. UdyogSetu 360 becomes the synchronisation spine behind it.

UdyogSetu 360 connects the Single Window System (SWS), department systems, officers, investors, public verification, analytics, audit, operations, AI advisory services and n8n automations through a canonical case model. Node.js domain services backed by MongoDB remain the authoritative operational state. Kafka is the canonical event stream. RabbitMQ is used for delivery work, retries and dead-letter recovery. Python AI services are advisory only, and n8n is automation only.

## Problem Statement
Industrial approvals span multiple departments, document checks, inspections, fees, certificates, grievances and status callbacks. Without a synchronisation layer, investors see fragmented progress, departments duplicate effort, and administrators lack reliable operational visibility.

UdyogSetu 360 provides the interoperability backbone that preserves departmental autonomy while creating a common operational truth.

## Existing SWS Role
The SWS remains the investor-facing entry point and policy-aligned application front door. UdyogSetu 360 accepts SWS submissions, normalises them into canonical cases, routes them to departments, receives callbacks, and keeps status visible to authorised parties.

## Core Modules
- `apps/gateway`: public and internal API ingress, auth, rate limits and response envelopes.
- `apps/investor-portal`: EJS investor dashboard, CAF, documents, fees, certificates and grievances.
- `apps/department-portal`: EJS officer, supervisor, nodal, auditor, analytics and operations screens.
- `apps/public-portal`: aggregate public dashboard and certificate verification with no PII leakage.
- `services/case-service`: canonical case, documents, fees, certificates, grievances, projections and AI client integration.
- `services/orchestration-service`: case and task state transitions, replay, stuck-case detection and SLA orchestration.
- `services/adapter-runtime`: department adapters, outbound delivery, callback reconciliation and RabbitMQ workers.
- `services/notification-service`: notifications, reminders, SLA jobs and grievance ageing.
- `services/audit-service`: append-only audit records, hash chain and audit exports.
- `services/ai-service`: FastAPI advisory validation, routing and operational intelligence.
- `n8n`: workflow automation that calls Node APIs and never writes authoritative state directly.

## Data Ownership Principles
- MongoDB-backed Node domain services own operational state.
- Kafka records canonical events after domain transactions.
- RabbitMQ messages are delivery jobs and can be rebuilt from durable state where possible.
- S3/MinIO stores document binaries; MongoDB stores metadata only.
- Audit records are append-only legal records and are separate from operational logs.
- AI and n8n outputs are recommendations or automations, not source-of-truth decisions.

## Case Lifecycle
An investor or SWS submits a CAF. The case service validates, stores draft/final state, creates a universal case ID and emits domain events. Orchestration creates department tasks, SLA timers and approval tracks. Department officers act through services, producing domain events and audit entries for every state-changing action.

## Two-Way Sync
Southbound sync dispatches canonical case/task/document payloads to department systems through adapters. Northbound callbacks are verified, normalised and passed through Node orchestration before task/case state changes.

## Event Backbone
Domain services write state and outbox records in the same MongoDB transaction. Publishers push events to Kafka. Consumers update projections, notifications, analytics and public metrics idempotently.

## Queue Delivery Subsystem
RabbitMQ carries outbound department delivery jobs, callback reconciliation jobs, retries and dead-letter queues. Queue messages include correlation IDs, idempotency keys and retry metadata. Queue state does not replace MongoDB or Kafka.

## Department Adapter Framework
Adapters support REST, webhook, database, SFTP, RPA and human-assisted integrations. Pilot adapters for `pollution`, `power`, `fire`, `industrial_safety` and `labour` can run in mock, sandbox or controlled production modes.

## Document Subsystem
Documents use upload intents, S3/MinIO object storage, metadata confirmation, versioning, checksums, signed URLs and permission checks. Certificates are stored as documents with verification metadata and public-safe verification responses.

## AI Services
Python FastAPI services provide document completeness, field normalisation, mismatch detection, approval-path recommendations, smart routing, SLA risk, bottlenecks, next-best-actions, summaries and draft assistance. They never mutate state and always return confidence, explainability, uncertainty and advisory-only disclaimers.

## n8n Workflows
n8n handles reminders, escalations, reconciliation and operational workflows. It calls Node APIs with service credentials and does not write MongoDB directly.

## Observability And Audit
Operational observability includes structured logs, metrics, diagnostics, operations console, stuck-case scan and replay tools. Legal audit records are stored separately as append-only, tamper-evident AuditEvent documents.

## Public Dashboard
Public pages expose aggregate metrics and certificate verification only. Privacy thresholds, no-PII views and safe verification responses are mandatory.

## Security Model
The platform uses authN, RBAC, ABAC, service-to-service credentials, short-lived signed URLs, webhook signatures, rate limits, CORS restrictions, audit trails and least-privilege operational roles.

## Deployment Model
Local development uses Docker Compose. Production should prefer managed MongoDB, Kafka, RabbitMQ and object storage where available, with Kubernetes manifests in `infra/k8s` serving as safe deployment placeholders.

## Pilot Rollout Model
The pilot starts with five departments: pollution, power, fire, industrial safety and labour. It progresses from mapping, mock adapters and sandbox integrations to parallel run and controlled pilot cases.
