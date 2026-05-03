# Kafka Topics

Development defaults:

- partitions: 6
- replication factor: 1
- cleanup policy: `delete`
- retention: 30 days for domain topics
- dead-letter retention: longer than standard domain topics

Core topics:

- `us360.domain.case.v1`
- `us360.domain.task.v1`
- `us360.domain.document.v1`
- `us360.domain.grievance.v1`
- `us360.domain.inspection.v1`
- `us360.domain.fee.v1`
- `us360.domain.certificate.v1`
- `us360.domain.notification.v1`
- `us360.domain.audit.v1`
- `us360.domain.sla.v1`
- `us360.integration.department.v1`
- `us360.integration.callback.v1`
- `us360.projection.update.v1`
- `us360.dead-letter.v1`

Create them locally with:

```bash
node scripts/create-kafka-topics.js
```
