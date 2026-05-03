# Audit Export Runbook

## Symptoms
- Audit team requests export or export job fails.

## Detection
- Audit export page, audit-service logs, export job status.

## Immediate Action
- Confirm requester permission.
- Confirm case ID/date range and export reason.

## Diagnosis
- Check audit collection, hash-chain status and export row limit.

## Recovery Steps
- Retry export with narrowed scope.
- Verify generated file and export audit event.
- Provide export through protected download only.

## Escalation Owner Placeholder
Audit owner: TBD.

## Verification
- Export completes.
- Hash-chain verification passes.

## Audit Notes
Every export must itself create an audit record.
