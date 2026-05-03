# Deployment Guide

This guide explains a safe path to deploy UdyogSetu 360 to staging or production.

The application is a monorepo with:

- Express and EJS portals
- Node.js domain and integration services
- MongoDB for authoritative operational state
- Kafka for canonical events
- RabbitMQ for delivery and retry work
- MinIO or S3-compatible document storage
- Python FastAPI AI advisory services
- n8n for automation only

## 1. Decide The Deployment Shape

Use one of these modes:

1. `Docker Compose`
   Good for local integration, demos, and lightweight staging.

2. `Kubernetes`
   Better for shared staging and production.

3. `Managed Infrastructure + Containers`
   Recommended for production if you have managed MongoDB, Kafka, RabbitMQ, object storage, and secret management.

The repo already contains placeholders under:

- `docker-compose.yml`
- `docker-compose.dev.yml`
- `docker-compose.test.yml`
- `docker-compose.observability.yml`
- `infra/k8s/`

## 2. Prepare Environment-Specific Secrets

Do not deploy using development placeholder values from `.env.example`.

Create environment-specific values for:

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `COOKIE_SECRET`
- `SESSION_SECRET`
- `SERVICE_JWT_SECRET`
- `INTERNAL_SERVICE_TOKEN`
- `WEBHOOK_DEFAULT_SECRET`
- `DIGILOCKER_WEBHOOK_SECRET`
- `N8N_WEBHOOK_SECRET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `AI_SERVICE_API_KEY`
- `AI_ADVISORY_API_KEY`
- Kafka credentials if secure brokers are used
- RabbitMQ credentials
- MongoDB credentials
- OIDC secrets if SSO is enabled

Reference:

- [Secrets Management](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/secrets-management.md>)
- [infra/secrets/README.md](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /infra/secrets/README.md>)

## 3. Prepare Infrastructure Dependencies

Before deploying app services, ensure these backing systems exist:

1. MongoDB
   This is the authoritative operational store.

2. Kafka
   This is the event backbone, not the primary system of record.

3. RabbitMQ
   This handles delivery jobs, callbacks, retries, and DLQ workflows.

4. Object storage
   Use MinIO for private environments or managed S3-compatible storage.

5. n8n
   Only for automation workflows, never for authoritative business state.

6. AI service runtime
   FastAPI advisory service.

## 4. Choose Deployment Ports And URLs

Default service ports in the repo are:

- Gateway `4000`
- Investor portal `4001`
- Department portal `4002`
- Public portal `4003`
- Case service `4100`
- Orchestration service `4101`
- Adapter runtime `4102`
- Notification service `4103`
- Audit service `4104`
- AI service `8000`

In production, these are usually internal container ports behind an ingress or load balancer.

## 5. Build Application Images

The repo already contains Dockerfiles for the main apps and services.

Build them locally if you want to verify the images:

```bash
docker compose build
```

Or use the CI pipeline builds in:

- `.github/workflows/docker-build.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`

## 6. Validate CI Before Deploying

A safe deployment should not start from a red branch.

Run:

```bash
npm install
npm test
cd services/ai-service && python -m pytest app/tests && cd ../..
node --test tests/contract/*.test.js tests/security/*.test.js tests/e2e/*.test.js
```

Then review:

- [Contract Test Plan](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/contract-test-plan.md>)
- [Performance Test Plan](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/performance-test-plan.md>)
- [Security Checklist](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/security-checklist.md>)

## 7. Staging Deployment With Docker Compose

For a simple staging environment:

1. Provision a Linux host with Docker and Docker Compose.
2. Clone the repo onto the host.
3. Create a real `.env` file with staging secrets.
4. Build and start the stack:

```bash
docker compose up -d --build
```

5. Run the smoke checks:

```bash
sh scripts/smoke-test.sh
```

6. Seed only if this is a demo or test environment:

```bash
npm run seed:pilot-departments
npm run seed:demo-users
npm run seed:demo-cases
```

Do not run demo seeds in production unless explicitly intended.

## 8. Deployment With Kubernetes

For Kubernetes, the repo includes placeholders under `infra/k8s/`.

Suggested order:

1. Create namespace
2. Create ConfigMap
3. Create Secrets
4. Deploy MongoDB or connect to managed MongoDB
5. Deploy MinIO or configure external object storage
6. Deploy RabbitMQ or use external RabbitMQ
7. Deploy Kafka or point to managed Kafka
8. Deploy AI service
9. Deploy case, orchestration, adapter, notification, and audit services
10. Deploy gateway and portals
11. Deploy n8n
12. Apply ingress and network policies

Example order:

```bash
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/configmap.yaml
kubectl apply -f infra/k8s/secrets.template.yaml
kubectl apply -f infra/k8s/services.yaml
kubectl apply -f infra/k8s/ingress.yaml
```

Important: the Kubernetes manifests are placeholders and must be adapted with:

- real image names
- real secret references
- real storage classes
- resource requests and limits
- readiness and liveness thresholds
- managed service endpoints if MongoDB, Kafka, or RabbitMQ are external

## 9. Configure Domain URLs And Ingress

Map public URLs intentionally:

- public portal
- investor portal
- department portal
- gateway API
- AI service internal URL
- n8n internal/admin URL

Suggested pattern:

- `public.example.gov`
- `investor.example.gov`
- `department.example.gov`
- `api.example.gov`

Use TLS termination at ingress or load balancer.

## 10. Configure Storage

Set these correctly:

- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_FORCE_PATH_STYLE`
- `DOCUMENT_STORAGE_PROVIDER=s3`

If you use MinIO in-cluster, ensure the bucket exists before live uploads.

## 11. Configure Messaging

Kafka:

- set `KAFKA_ENABLED=true`
- set `KAFKA_BROKERS`
- configure SASL or TLS if required

RabbitMQ:

- set `RABBITMQ_ENABLED=true`
- set `RABBITMQ_URL`
- review exchange and retry settings

n8n:

- set `N8N_BASE_URL`
- set `N8N_WEBHOOK_SECRET`
- import workflow JSONs
- make sure workflows call Node APIs, not MongoDB directly

## 12. Configure AI Services

The Node services expect:

- `AI_SERVICE_BASE_URL`
- `AI_ADVISORY_BASE_URL`

If the advisory module remains inside the same FastAPI service, keep both pointing to the same host unless you later split them.

## 13. Run Readiness Validation

Before go-live, run:

```bash
node scripts/validate-go-live-readiness.js
```

This validates items such as:

- environment variables
- service health endpoints
- MongoDB reachability
- AI service health
- n8n health

## 14. Run Smoke Tests After Deployment

Use:

```bash
sh scripts/smoke-test.sh
```

Check these manually too:

1. Public portal opens
2. Investor login works
3. Department portal opens
4. Gateway health responds
5. OpenAPI JSON responds
6. AI health responds
7. RabbitMQ management UI is healthy if exposed internally
8. MinIO bucket exists

## 15. Prepare Data Before Pilot Or Go-Live

For non-empty environments, plan import carefully.

Read:

- [Legacy Data Import Plan](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/legacy-data-import-plan.md>)
- [Pilot Rollout Plan](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/pilot-rollout-plan.md>)
- [Cutover Plan](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/cutover-plan.md>)

Dry-run example:

```bash
node scripts/import-legacy-data.js --dry-run --input tests/fixtures/legacy/legacy-cases.sample.csv
```

## 16. Backup Before Production Changes

Always take backups before major deploys, migrations, or cutover actions.

Scripts already included:

- `scripts/backup-mongodb.sh`
- `scripts/restore-mongodb.sh`
- `scripts/backup-minio.sh`
- `scripts/restore-minio.sh`
- `scripts/verify-backup-integrity.sh`

Also read:

- [Backup And Disaster Recovery](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/backup-disaster-recovery.md>)

## 17. Production Go-Live Checklist

Before production launch, confirm:

1. CI is green
2. Contract tests are green
3. Security checklist is reviewed
4. Backups are tested
5. Restore is tested
6. Roles and users are prepared
7. Pilot departments are onboarded
8. AI fallback is tested
9. Public dashboard exposes no PII
10. Audit and health endpoints are working

Reference:

- [Go-Live Readiness](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/go-live-readiness.md>)

## 18. Rollback Planning

Every deployment should have a rollback owner and a rollback decision threshold.

At minimum define:

- which release can be restored
- whether adapters should be disabled first
- whether n8n workflows should be paused
- whether RabbitMQ workers should be paused
- whether a data restore is necessary or whether app rollback alone is enough

References:

- [Rollback Runbook](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/runbooks/rollback.md>)
- [Cutover Plan](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/cutover-plan.md>)

## 19. Recommended Production Topology

A practical target shape is:

1. Gateway and portals behind ingress
2. Case and orchestration services on internal network
3. Adapter runtime isolated with limited egress
4. Audit service isolated and tightly permissioned
5. AI service internal-only
6. n8n internal-only
7. MongoDB and object storage on persistent volumes or managed services
8. Kafka and RabbitMQ managed if possible

## 20. Post-Deployment Monitoring

Immediately monitor:

- app health endpoints
- gateway request errors
- Kafka publish lag
- RabbitMQ queue depth
- adapter failures
- document upload failures
- audit write failures
- AI service timeouts
- n8n workflow failures

Related runbooks:

- [Incident Response](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/runbooks/incident-response.md>)
- [Queue Backlog](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/runbooks/queue-backlog.md>)
- [Adapter Failure](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/runbooks/adapter-failure.md>)
- [AI Service Unavailable](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/runbooks/ai-service-unavailable.md>)

## Notes

- MongoDB-backed Node services remain the authoritative state layer.
- Kafka is the canonical event stream, but not the only durable source of truth.
- RabbitMQ is for delivery and retry work, not business state authority.
- AI and n8n must remain advisory and automation-only.
