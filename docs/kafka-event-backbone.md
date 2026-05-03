# Kafka Event Backbone

UdyogSetu 360 now uses MongoDB as the operational source of truth and Kafka as the durable event backbone for lifecycle propagation, integrations, projections, and replay.

## Responsibilities

MongoDB:

- current operational state
- outbox storage
- processed-event idempotency records
- audit projections and service data

Kafka:

- durable stream of canonical lifecycle events
- integration dispatch and callback streams
- projection fan-out
- replay and recovery workflows

## Topic Naming Strategy

- `us360.domain.case.v1`
- `us360.domain.task.v1`
- `us360.domain.document.v1`
- `us360.domain.grievance.v1`
- `us360.domain.inspection.v1`
- `us360.domain.fee.v1`
- `us360.domain.certificate.v1`
- `us360.domain.notification.v1`
- `us360.domain.audit.v1`
- `us360.domain.sla.v1`
- `us360.integration.department.v1`
- `us360.integration.callback.v1`
- `us360.projection.update.v1`
- `us360.dead-letter.v1`

## Event Naming Strategy

Versioned event names live in:

- `packages/shared/src/constants/event-names.constants.js`

They use lowercase dot-separated names such as:

- `case.submitted.v1`
- `task.status_changed.v1`
- `document.uploaded.v1`
- `fee.paid.v1`

## CloudEvents-like Envelope

Built by:

- `packages/shared/src/events/event-envelope.js`

Core fields:

- `id`
- `source`
- `specversion`
- `type`
- `subject`
- `time`
- `datacontenttype`
- `dataschema`
- `correlationid`
- `causationid`
- `partitionkey`
- `data`

## Partition Key Rules

- case events: `universalCaseId`
- task events: `universalCaseId`, fallback `taskId`
- document events: `universalCaseId`, fallback `documentId`
- grievance events: `universalCaseId`, fallback `grievanceNumber`
- inspection events: `universalCaseId`, fallback `inspectionId`
- fee events: `universalCaseId`, fallback `feeId`
- certificate events: `universalCaseId`, fallback `certificateNumber`
- audit events: `universalCaseId`, fallback `resourceId`

## Producer Flow

1. Domain service appends an outbox record in MongoDB.
2. The outbox publisher polls pending records.
3. The Kafka producer validates the envelope and topic mapping.
4. The event is published with Kafka headers derived from the envelope.
5. The outbox record is marked `published`, `failed`, or `dead_lettered`.

## Consumer Flow

1. Consumer receives Kafka message.
2. JSON is parsed and schema-validated.
3. Idempotency record is checked.
4. Handler runs only once per event/handler/group.
5. Retryable failures bubble for retry.
6. Non-retryable failures are dead-lettered.

## Outbox Pattern

Primary implementation:

- `services/case-service/src/models/DomainEvent.js`
- `services/case-service/src/outbox/outbox.repository.js`
- `services/case-service/src/outbox/outbox-publisher.service.js`

`DomainEvent` now acts as the outbox record with:

- topic
- partition key
- stored envelope
- publish status
- retry metadata
- publishing locks

## Retry and Dead Letter Behaviour

- retryable publish failures use exponential backoff
- non-retryable failures go to `us360.dead-letter.v1`
- publishing locks can be recovered if a worker dies mid-flight

## Idempotency Strategy

- `ProcessedEvent` tracks `(eventId, handlerName, consumerGroup)`
- duplicate deliveries become idempotent skips
- stale processing locks can be taken over safely

## Replay Strategy

Replay CLI:

```bash
node scripts/replay-events.js --case US360-KA-2026-000001 --dry-run
node scripts/replay-events.js --event case.submitted.v1 --from 2026-01-01 --to 2026-01-31
node scripts/replay-events.js --case US360-KA-2026-000001 --republish --reason "projection rebuild" --confirm
```

Replay metadata includes:

- `replayedAt`
- `replayedBy`
- `replayReason`
- `originalEventId`

## Sample Events

Stored in:

- `events/samples/`

Examples:

- `case-submitted.sample.json`
- `task-created.sample.json`
- `document-uploaded.sample.json`
- `grievance-created.sample.json`
- `inspection-scheduled.sample.json`
- `fee-demanded.sample.json`
- `fee-paid.sample.json`
- `certificate-issued.sample.json`

## Local Development

Kafka is optional in development.

When `KAFKA_ENABLED=false`:

- producer calls return disabled-mode responses
- readiness reports Kafka as disabled
- MongoDB outbox still stores event envelopes

## Docker Compose

The repo already includes a single-node Kafka service in `docker-compose.yml`.

Create topics locally with:

```bash
npm run kafka:topics
```

## Troubleshooting

- if readiness shows Kafka `degraded`, check broker reachability and env config
- if outbox records remain `failed`, inspect `failureReason`, `lastError`, and `publishAttempts`
- if replay seems to do nothing, verify `KAFKA_ENABLED=true` and confirm dry-run flags
