# Rollback Runbook

## Symptoms
- Release causes critical regression or pilot cutover must be reversed.

## Detection
- Failed smoke tests, error spike, data mismatch, security finding.

## Immediate Action
- Assign rollback owner.
- Pause affected workers if duplicate processing risk exists.
- Communicate rollback window.

## Diagnosis
- Identify bad deployment, migration or configuration.

## Recovery Steps
- Disable adapters or n8n workflows if integration-related.
- Roll back image tag/config.
- Restore backup only if approved.
- Run post-rollback smoke tests.

## Escalation Owner Placeholder
Release manager: TBD.

## Verification
- Health checks pass.
- Critical journey passes.
- Queue/event processing stable.

## Audit Notes
Rollback reason and privileged actions must be recorded.
