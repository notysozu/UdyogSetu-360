# Incident Response Runbook

## Symptoms
- User-facing outage, elevated errors, data mismatch, security alert or failed critical workflow.

## Detection
- Health checks, operations console, logs, metrics, support reports and queue depth alerts.

## Immediate Action
- Assign incident owner.
- Preserve logs and correlation IDs.
- Stop unsafe automation if needed.
- Communicate impact and current mitigation.

## Diagnosis
- Identify affected service, route, queue, event topic and deployment version.
- Check recent releases and config changes.
- Review audit records for privileged actions.

## Recovery Steps
- Roll back deployment if release-related.
- Pause workers for duplicate-processing risk.
- Restore service dependencies.
- Run smoke tests.

## Escalation Owner Placeholder
Production incident commander: TBD.

## Verification
- Health endpoints pass.
- Critical E2E smoke journey passes.
- Error rate returns to baseline.

## Audit Notes
Record incident timeline, privileged actions and user-visible impact.
