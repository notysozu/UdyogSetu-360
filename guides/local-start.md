# Local Start Guide

This guide walks through the fastest safe path to start UdyogSetu 360 on a development machine.

## 1. Prerequisites

Install these first:

- `Node.js` 20 or later
- `npm` 10 or later
- `Python` 3.11 or later
- `pip`
- `Docker` and `Docker Compose`
- `Git`

Optional but useful:

- `mongosh`
- `curl`

## 2. Clone The Repository

```bash
git clone https://github.com/notysozu/udyogsetu-360.git
cd udyogsetu-360
```

## 3. Create Environment Files

Create the root environment file:

```bash
cp .env.example .env
```

If you also use the preserved legacy `web/` workspace directly, keep `web/.env` aligned with the same local MongoDB and AI endpoints.

## 4. Review The Minimum Required Values

Open `.env` and verify these development values:

- `NODE_ENV=development`
- `MONGODB_URI=mongodb://127.0.0.1:27017/udyogsetu360`
- `MONGO_URI=mongodb://127.0.0.1:27017/udyogsetu360`
- `JWT_SECRET=replace-me`
- `JWT_REFRESH_SECRET=replace-me`
- `COOKIE_SECRET=replace-me`
- `SESSION_SECRET=replace-me`
- `SERVICE_JWT_SECRET=replace-me`
- `INTERNAL_SERVICE_TOKEN=replace-me`
- `S3_ENDPOINT=http://localhost:9000`
- `S3_BUCKET=udyogsetu-documents`
- `S3_ACCESS_KEY=minioadmin`
- `S3_SECRET_KEY=minioadmin`
- `AI_SERVICE_BASE_URL=http://localhost:8000`
- `AI_ADVISORY_BASE_URL=http://localhost:8000`
- `USE_MOCK_DEPARTMENT_DATA=true`
- `ENABLE_MOCK_ADAPTERS=true`

For development you can keep Kafka, RabbitMQ, MinIO, and mock adapters enabled.

## 5. Install Node Dependencies

From the repo root:

```bash
npm install
```

This installs the npm workspaces for:

- `web`
- `apps/*`
- `services/*`
- `packages/*`

## 6. Install Python Dependencies For The AI Service

The Node workspaces do not install Python packages automatically, so set up the AI service separately:

```bash
cd services/ai-service
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ../..
```

## 7. Start Infrastructure Dependencies

The easiest local path is Docker Compose:

```bash
docker compose up -d mongodb rabbitmq kafka minio minio-create-bucket mongo-express
```

What this gives you:

- MongoDB on `27017`
- Mongo Express on `8081`
- RabbitMQ on `5672`
- RabbitMQ UI on `15672`
- Kafka on `9092`
- MinIO API on `9000`
- MinIO console on `9001`

## 8. Start The AI Service

From the repo root:

```bash
cd services/ai-service
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Keep this running in its own terminal.

Health check:

```bash
curl http://127.0.0.1:8000/health
```

## 9. Start The Node Services

Open separate terminals and start the services you want to use.

Core API and portals:

```bash
npm run dev:gateway
npm run dev:public
npm run dev:investor
npm run dev:department
```

Core backend services:

```bash
npm run dev:case
npm run dev:orchestration
npm run dev:adapter
npm run dev:notification
npm run dev:audit
```

## 10. Confirm Health Endpoints

Check that each main component responds:

```bash
curl http://127.0.0.1:4000/health
curl http://127.0.0.1:4003/health
curl http://127.0.0.1:4001/health
curl http://127.0.0.1:4002/health
curl http://127.0.0.1:4100/health
curl http://127.0.0.1:4101/health
curl http://127.0.0.1:4102/health
curl http://127.0.0.1:4103/health
curl http://127.0.0.1:4104/health
curl http://127.0.0.1:8000/health
```

## 11. Seed Demo Data

Seed department mappings:

```bash
npm run seed:pilot-departments
```

Seed demo users:

```bash
npm run seed:demo-users
```

Seed demo cases:

```bash
npm run seed:demo-cases
```

Optional legacy compatibility seed:

```bash
npm run seed
```

## 12. Run Tests

Run the full Node workspace tests:

```bash
npm test
```

Run the Python AI tests:

```bash
cd services/ai-service
source .venv/bin/activate
python -m pytest app/tests
cd ../..
```

Run contract, security, and e2e stubs:

```bash
node --test tests/contract/*.test.js tests/security/*.test.js tests/e2e/*.test.js
```

## 13. Open The Application

Useful local URLs:

- Public portal: `http://localhost:4003`
- Investor portal: `http://localhost:4001`
- Department portal: `http://localhost:4002`
- Gateway API: `http://localhost:4000`
- Gateway OpenAPI: `http://localhost:4000/api/v1/openapi.json`
- Mongo Express: `http://localhost:8081`
- RabbitMQ UI: `http://localhost:15672`
- MinIO console: `http://localhost:9001`

## 14. Stop The Stack

Stop Node processes with `Ctrl+C` in each terminal.

Stop Docker infrastructure:

```bash
docker compose down
```

## Troubleshooting

### `python3 -m pytest` fails with `No module named pytest`

You are missing the AI service Python dependencies.

Run:

```bash
cd services/ai-service
source .venv/bin/activate
pip install -r requirements.txt
```

### `ModuleNotFoundError: No module named 'app'`

Run the AI tests from the service directory:

```bash
cd services/ai-service
python -m pytest app/tests
```

### `docker compose` fails because `.env` is missing

Create it first:

```bash
cp .env.example .env
```

### Mongoose duplicate index warnings appear during tests

These are warnings rather than immediate startup failures. The app can still run, but the schemas should be cleaned up later.

## Recommended Next Reads

After local startup, these are the most useful deeper references:

- [Setup Notes](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/setup.md>)
- [Environment Reference](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/environment.md>)
- [Department Portal Guide](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/department-portal.md>)
- [Production Blueprint](</Users/sonukumar/Documents/Projects/GitHub/UdyogSetu 360 /docs/production-blueprint.md>)
