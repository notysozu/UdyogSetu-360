# RabbitMQ Delivery Subsystem

## Purpose
RabbitMQ in UdyogSetu 360 handles paced work delivery, department-specific dispatch jobs, callback reconciliation, retry timing, poison isolation, dead-letter recovery, and worker monitoring. Kafka remains the canonical event backbone for domain and audit event propagation.

## Kafka vs RabbitMQ
- Kafka: canonical domain events, replayable history, outbox publication, cross-service event backbone.
- RabbitMQ: operational work queues, adapter pacing, callback reconciliation jobs, retry orchestration, dead-letter recovery.

## Exchange Design
- `us360.department.delivery` (`topic`): outbound department jobs.
- `us360.department.callback` (`topic`): inbound callback reconciliation jobs.
- `us360.retry` (`topic`): delayed retry routing via TTL queues.
- `us360.deadletter` (`topic`): unrecoverable and poison messages.
- `us360.monitoring` (`topic`): worker lifecycle and monitoring events.

## Queue Design
- Delivery queues:
  - `us360.delivery.pollution.q`
  - `us360.delivery.power.q`
  - `us360.delivery.fire.q`
  - `us360.delivery.industrial_safety.q`
  - `us360.delivery.labour.q`
- Delivery retry queues:
  - `us360.delivery.pollution.retry.q`
  - `us360.delivery.power.retry.q`
  - `us360.delivery.fire.retry.q`
  - `us360.delivery.industrial_safety.retry.q`
  - `us360.delivery.labour.retry.q`
- Delivery dead-letter queue:
  - `us360.delivery.deadletter.q`
- Callback queues:
  - `us360.callback.reconciliation.q`
  - `us360.callback.reconciliation.retry.q`
  - `us360.callback.deadletter.q`
- Monitoring queue:
  - `us360.monitoring.worker-events.q`

## Routing Keys
- Delivery:
  - `delivery.{departmentCode}.submit`
  - `delivery.{departmentCode}.status_check`
  - `delivery.{departmentCode}.document_push`
- Callback:
  - `callback.department.received`
  - `callback.{departmentCode}.received`
  - `callback.n8n.received`
- Retry:
  - `retry.delivery.{departmentCode}`
  - `retry.callback.reconciliation`
- Dead-letter:
  - `deadletter.delivery`
  - `deadletter.callback`
  - `deadletter.poison`
- Monitoring:
  - `monitoring.worker.started`
  - `monitoring.worker.stopped`
  - `monitoring.worker.heartbeat`
  - `monitoring.message.received`
  - `monitoring.message.processed`
  - `monitoring.message.failed`
  - `monitoring.message.retry_scheduled`
  - `monitoring.message.deadlettered`
  - `monitoring.queue.depth_warning`

## Message Envelope
Every RabbitMQ message uses the queue envelope from [packages/shared/src/utils/queue-message-envelope.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/packages/shared/src/utils/queue-message-envelope.js:1) with identifiers, correlation, idempotency, attempt metadata, routing metadata, and payload.

## Ack/Nack Rules
- `ack` on success.
- `ack` on duplicate idempotent skip.
- `ack` after successful retry scheduling.
- `ack` after successful dead-letter publish.
- `nack(requeue=false)` is avoided unless a recovery publish cannot be completed.
- `nack(requeue=true)` is reserved for temporary worker-level failures before retry/dead-letter recovery could be published.

## Retry Strategy
- RabbitMQ retry uses TTL queues plus dead-letter back to the primary exchange.
- Backoff uses `baseDelay * 2^attempt + jitter`, capped by `RABBITMQ_RETRY_MAX_DELAY_MS`.
- Headers include retry count, original exchange/routing key, and last error details.

## Dead-Letter Strategy
- Malformed JSON, schema validation failures, unsupported transitions, and poison messages are sent to dead-letter exchanges.
- Delivery and callback dead-letters are separated logically by routing key and persisted in `QueueJob`.
- Requeue operations create a fresh message id while preserving correlation and original metadata.

## Poison Logic
A message is treated as poison when validation repeatedly fails, a non-transient error repeats past threshold, or the state is impossible. Poisoned messages are dead-lettered and recorded with `dead_lettered` status in MongoDB.

## Worker Framework
- Shared worker runner: [worker-runner.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/workers/worker-runner.js:1)
- Features: topology assertion, prefetch, lifecycle monitoring, idempotency guard, retry/dead-letter handling, structured worker context.

## Outbound Delivery Flow
1. A producer publishes a department delivery envelope to `us360.department.delivery`.
2. The department worker loads case/task context if available.
3. The worker resolves the adapter from the registry.
4. The worker invokes `submit`, `status_check`, or `document_push`.
5. Success updates safe sync metadata and appends `integration.dispatch_succeeded.v1` to the Mongo outbox.
6. Retryable failures schedule TTL retry.
7. Non-retryable failures dead-letter.

## Callback Reconciliation Flow
1. A verified callback or internal automation publishes a reconciliation job.
2. The callback worker matches task context by universal case id, external reference id, or task id.
3. Callback type and status are normalized into orchestration actions.
4. Task lifecycle services are invoked instead of mutating state inline.
5. `integration.callback_received.v1` is appended to the outbox and an audit event is recorded.
6. Temporary mismatches retry; malformed callbacks dead-letter.

## Monitoring and Recovery
- Admin endpoints live in [queue.routes.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/routes/queue.routes.js:1).
- Mongo-backed stats remain available when RabbitMQ management API is unavailable.
- Recovery scripts:
  - `node scripts/requeue-dead-letter.js --messageId MESSAGE_ID --reason "fixed adapter config"`
  - `node scripts/requeue-dead-letter.js --department pollution --limit 10 --reason "retry pollution"`

## Docker Compose
RabbitMQ management is available from the root [docker-compose.yml](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/docker-compose.yml:1) on:
- AMQP: `5672`
- Management UI: `15672`

## Manual Testing
1. `docker compose up rabbitmq`
2. Start `adapter-runtime` and supporting services.
3. `node scripts/assert-rabbitmq-topology.js`
4. `node scripts/publish-test-delivery-job.js --department pollution --case US360-KA-2026-000001`
5. `node scripts/start-outbound-worker.js --department pollution`
6. Confirm the job succeeds or retries.
7. `node scripts/publish-test-callback-job.js --department fire --case US360-KA-2026-000001 --type inspection_completed`
8. `node scripts/start-callback-worker.js`
9. Confirm reconciliation succeeds.
10. Publish a malformed payload and confirm it lands in dead-letter.
11. `node scripts/requeue-dead-letter.js --messageId MESSAGE_ID --reason "fixed config"`

## Troubleshooting
- If RabbitMQ is disabled, adapter-runtime readiness reports `rabbitmq: disabled` without failing development startup.
- If RabbitMQ is enabled in production and unavailable, adapter-runtime readiness returns `503`.
- If retries accumulate, inspect `/api/v1/queues/stats` and `/api/v1/queues/dead-letter`.
- If Kafka remains healthy but RabbitMQ degrades, canonical event publication still uses the outbox/Kafka path.
