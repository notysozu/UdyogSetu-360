# E2E Tests

This folder holds end-to-end journey tests for UdyogSetu 360.

Recommended flow:
```bash
npm ci
docker compose up -d mongodb kafka rabbitmq minio ai-service n8n
DEMO_SEED_ENABLED=true node scripts/seed-pilot-departments.js
DEMO_SEED_ENABLED=true node scripts/seed-demo-users.js
DEMO_SEED_ENABLED=true node scripts/seed-demo-cases.js
node --test tests/e2e/*.test.js
```

Journeys are documented in `docs/end-to-end-test-plan.md`.
