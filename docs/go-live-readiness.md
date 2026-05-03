# Go-Live Readiness Criteria

## Functional Readiness
- [ ] CAF draft, upload, validation and final submission work.
- [ ] Universal case ID, acknowledgement, approval tracks and department tasks are created.
- [ ] Two-way department sync works in pilot mode.
- [ ] Document upload, versioning, permissions and certificate verification work.
- [ ] Grievance create, update, resolve and close flows work.
- [ ] Notifications and reminders work.
- [ ] SLA monitoring, warning, breach and escalation work.
- [ ] Append-only audit trail and hash-chain verification work.
- [ ] Analytics dashboards render from projections.
- [ ] Operations console shows health, queues, adapters, stuck cases and replay attempts.
- [ ] n8n workflows are imported and tested.
- [ ] AI service and AI advisory fallback paths are tested.

## Technical Readiness
- [ ] CI pipeline passing.
- [ ] Contract tests passing.
- [ ] E2E tests passing.
- [ ] Performance tests acceptable for pilot targets.
- [ ] Security checklist completed.
- [ ] MongoDB backup tested.
- [ ] MinIO/S3 backup tested.
- [ ] Restore drill completed.
- [ ] Monitoring and alerts configured.
- [ ] Secrets configured outside source control.
- [ ] TLS configured.
- [ ] Rate limits configured.

## Operational Readiness
- [ ] Admin users created.
- [ ] Department officers and supervisors onboarded.
- [ ] Nodal and auditor roles onboarded.
- [ ] Runbooks available.
- [ ] Support contacts defined.
- [ ] Rollback plan approved.
- [ ] Cut-over checklist signed.
- [ ] Pilot scope confirmed.
- [ ] Training and demo completed.

## Data Readiness
- [ ] Legacy import dry run complete.
- [ ] Data validation complete.
- [ ] Universal case ID mapping verified.
- [ ] Department reference mapping verified.
- [ ] Duplicate detection checked.
- [ ] Import audit events recorded.

## Compliance Readiness
- [ ] Audit hash chain verified.
- [ ] Audit export process tested.
- [ ] Public dashboard privacy checked.
- [ ] PII review complete.
- [ ] Access control review complete.
- [ ] AI advisory-only controls reviewed.

## Validation Script
Run:
```bash
node scripts/validate-go-live-readiness.js
```

The script performs connectivity and configuration checks. Manual sign-off is still required for policy, training and stakeholder acceptance.
