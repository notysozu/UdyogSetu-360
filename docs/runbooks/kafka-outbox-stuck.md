# Kafka Outbox Stuck Runbook

## Symptoms
- Outbox unpublished count grows or projections stop updating.

## Detection
- Outbox diagnostics, Kafka publisher logs, projection lag.

## Immediate Action
- Check Kafka broker health.
- Confirm publisher process is running.

## Diagnosis
- Inspect failed outbox records, schema validation errors and producer credentials.
- Check topic existence.

## Recovery Steps
- Create missing topics.
- Fix schema/config issue.
- Restart publisher.
- Replay unpublished outbox records.

## Escalation Owner Placeholder
Event backbone owner: TBD.

## Verification
- Outbox unpublished count falls.
- Consumers process events idempotently.

## Audit Notes
Manual replay requires reason and audit event.
