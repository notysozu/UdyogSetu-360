# Adapter Failure Runbook

## Symptoms
- Department delivery failures, callback reconciliation failures or adapter health degraded.

## Detection
- Adapter diagnostics, operations console, RabbitMQ retries, Kafka integration events.

## Immediate Action
- Identify department and adapter type.
- Stop repeated delivery if it is creating downstream load.

## Diagnosis
- Check credentials, endpoint availability, mapping profile and signature validation.
- Compare payload against contract fixtures.

## Recovery Steps
- Restore credential/config.
- Patch mapping profile if contract drift is confirmed.
- Retry failed jobs through controlled replay.

## Escalation Owner Placeholder
Department integration owner: TBD.

## Verification
- Adapter health passes.
- Test dispatch and callback reconcile.

## Audit Notes
Record adapter disable/enable and replay actions.
