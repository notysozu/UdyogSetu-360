# Backup Restore Runbook

## Symptoms
- Restore drill, data loss, environment rebuild or DR event.

## Detection
- Scheduled drill or incident.

## Immediate Action
- Stop workers if restoring over active environment.
- Confirm restore target.

## Diagnosis
- Identify backup timestamp, MongoDB dump and object storage snapshot.

## Recovery Steps
- Restore MongoDB.
- Restore object storage.
- Start services in dependency order.
- Run smoke tests.
- Verify audit hash chain.

## Escalation Owner Placeholder
DR owner: TBD.

## Verification
- Critical user journeys pass.
- Audit chain passes.
- Document download and certificate verification pass.

## Audit Notes
Record restore operator, time, backup ID and verification result.
