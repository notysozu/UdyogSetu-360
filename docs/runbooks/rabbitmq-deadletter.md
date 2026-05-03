# RabbitMQ Dead-Letter Runbook

## Symptoms
- Dead-letter queue grows, delivery jobs stop completing.

## Detection
- RabbitMQ management UI, operations console, worker logs.

## Immediate Action
- Export dead-letter sample.
- Pause blind reprocessing.

## Diagnosis
- Classify errors as transient, mapping, auth, downstream or poison payload.
- Verify retry policy.

## Recovery Steps
- Fix root cause.
- Requeue selected messages with idempotency intact.
- Mark poison messages failed and attach case trace.

## Escalation Owner Placeholder
Queue owner: TBD.

## Verification
- Dead-letter count stabilises.
- Requeued messages complete.

## Audit Notes
Dead-letter reprocessing must be traceable.
