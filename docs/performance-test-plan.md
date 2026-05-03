# Performance Test Plan

## Purpose
These are engineering test targets, not official production SLAs. Official targets must be approved separately.

## Metrics
- p50 latency
- p95 latency
- p99 latency
- error rate
- throughput
- CPU and memory
- MongoDB query time
- Kafka publish latency
- RabbitMQ queue depth
- worker processing time
- adapter latency
- AI service latency

## Scenarios
1. CAF draft save under concurrent users.
2. Final submission and task creation.
3. Case timeline retrieval.
4. Department task inbox.
5. Document signed URL generation.
6. Kafka outbox publishing.
7. RabbitMQ delivery processing.
8. Public dashboard metrics query.
9. Analytics dashboard query using projections.
10. Operations console health query.
11. AI advisory timeout/fallback.
12. n8n webhook throughput.

## Starter Scripts
- `tests/performance/k6-caf-submission.js`
- `tests/performance/k6-case-timeline.js`
- `tests/performance/k6-public-dashboard.js`
- `tests/performance/k6-department-inbox.js`
- `tests/performance/k6-webhook-ingestion.js`

Run:
```bash
scripts/run-performance-tests.sh
```

## Reporting
Record environment, commit SHA, seed data version, p95/p99 latency, error rate, bottlenecks and remediation notes for every run.
