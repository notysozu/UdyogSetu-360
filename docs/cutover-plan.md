# Pilot Cut-Over Plan

## Pre-Cutover
- Freeze pilot scope and selected case set.
- Confirm departments: pollution, power, fire, industrial safety and labour.
- Confirm pilot users and support contacts.
- Confirm adapter mode per department.
- Validate secrets and service credentials.
- Validate MongoDB and MinIO/S3 backups.
- Run legacy import dry run.
- Run E2E smoke tests.
- Verify analytics, operations and public dashboards.
- Verify certificate verification privacy.
- Confirm rollback owner and escalation channel.

## Cut-Over Day
1. Take MongoDB and document backup.
2. Verify backup integrity.
3. Enable maintenance banner if required.
4. Import pilot legacy data in controlled mode.
5. Validate import counts and error report.
6. Enable adapters for pilot departments.
7. Enable n8n workflows.
8. Enable scheduled jobs.
9. Run smoke tests.
10. Start parallel monitoring.
11. Notify pilot users.

## Post-Cutover
- Monitor queue backlog.
- Monitor adapter failures.
- Monitor stuck-case findings.
- Review audit events.
- Verify SLA jobs.
- Review grievance flow.
- Produce daily pilot report.
- Collect officer and investor feedback.

## Rollback
- Disable department adapters.
- Disable n8n workflows.
- Pause RabbitMQ workers.
- Keep imported data read-only if needed.
- Restore from backup only if approved by rollback owner.
- Record rollback audit event.
- Communicate rollback status to pilot stakeholders.

## Pilot Success Criteria
- Demo and pilot cases submit successfully.
- Department callbacks reconcile.
- No critical data mismatch.
- Audit events are created.
- Queue backlog remains stable.
- No unauthorised access is observed.
- Public dashboard exposes no PII.
- Officers can complete assigned tasks.
- Investors can see unified timeline.
- Grievance and notification flows work.
