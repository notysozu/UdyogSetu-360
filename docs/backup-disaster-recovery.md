# Backup And Disaster Recovery

## MongoDB
- Schedule daily logical backups with `mongodump`.
- Store backups outside the primary host.
- Use encrypted backup storage where possible.
- Retain daily, weekly and monthly backups according to approved policy.
- Test restore into an isolated environment at least once before go-live.
- Point-in-time recovery is a production placeholder pending managed MongoDB selection.

## S3 / MinIO Documents
- Enable bucket versioning where supported.
- Back up object data and metadata.
- Use replication or offsite sync for production.
- Test restoring a certificate and a regular uploaded document.
- Keep signed URLs short-lived; backups must not depend on signed URLs.

## Kafka
- Kafka is the canonical event stream, but not the only state store.
- Configure topic retention based on replay and audit requirements.
- Rebuild projections from MongoDB domain events/outbox where possible.
- Preserve event schemas and topic definitions in repo.

## RabbitMQ
- RabbitMQ carries delivery jobs and retries.
- Export dead-letter queues before maintenance.
- Reconstruct work from MongoDB queue/outbox records where available.
- After restore, resume workers gradually and monitor duplicate idempotency keys.

## n8n
- Workflow JSON lives in repo under `n8n/workflows`.
- n8n credentials and encryption keys must be backed up securely.
- Execution history is useful for troubleshooting but is not source of truth.

## AI Services
- AI services are stateless.
- Model metadata, dummy models and training stubs live in repo.
- Feedback logs are optional improvement data and should be backed up only if enabled.

## Audit Records
- Audit events are append-only MongoDB records.
- Hash-chain verification must run after restore.
- Audit exports should be stored with export audit entries.

## Restore Order
1. Restore infrastructure secrets.
2. Restore MongoDB.
3. Restore object storage.
4. Start Kafka and RabbitMQ.
5. Start Node services.
6. Start portals.
7. Start AI service and n8n.
8. Run smoke tests.
9. Verify audit hash chain.
10. Resume workers and scheduled jobs.

## DR Targets
RPO and RTO are placeholders until operations approval:
- RPO placeholder: 24 hours for local pilot backups.
- RTO placeholder: 4 hours for pilot restore.

## Scripts
- `scripts/backup-mongodb.sh`
- `scripts/restore-mongodb.sh`
- `scripts/backup-minio.sh`
- `scripts/restore-minio.sh`
- `scripts/verify-backup-integrity.sh`
