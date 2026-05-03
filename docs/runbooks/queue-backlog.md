# Queue Backlog Runbook

## Symptoms
- RabbitMQ backlog increasing, delivery delays or stale department tasks.

## Detection
- Operations console queue view, RabbitMQ management UI, worker logs.

## Immediate Action
- Confirm consumers are running.
- Pause non-critical replay or bulk jobs.
- Check dead-letter growth.

## Diagnosis
- Inspect oldest message age, retry count, adapter health and downstream department status.
- Verify idempotency keys are present.

## Recovery Steps
- Restart stuck worker.
- Scale worker concurrency within safe limits.
- Requeue dead letters after root cause is fixed.
- Disable faulty adapter if it is causing repeated failures.

## Escalation Owner Placeholder
Adapter/runtime owner: TBD.

## Verification
- Queue depth decreases.
- No duplicate task transitions.
- Affected case timelines update.

## Audit Notes
Privileged requeue and replay actions must be audited.
