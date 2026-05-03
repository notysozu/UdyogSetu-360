# UdyogSetu 360

UdyogSetu 360 is a production-oriented interoperability backbone for unified governance in
Karnataka. It connects a Single Window System with department systems using a canonical case model,
two-way synchronization, department adapters, audit-first workflows, notifications, AI advisory
services, and n8n operational automations.

This repository now uses a safe monorepo structure while preserving the existing working EJS
application in `web/`. The current SSR experience stays intact, and the new `apps/`, `services/`,
and `packages/` layout creates room for gradual extraction into service boundaries.

## Architecture Overview

- `web/`: preserved working Express + EJS portal
- `apps/gateway`: API entry point with versioned stubs and shared correlation IDs
- `apps/public-portal`: public-facing wrapper around the existing SSR app
- `apps/investor-portal`: investor-facing wrapper around the existing SSR app
- `apps/department-portal`: department-facing wrapper around the existing SSR app
- `services/case-service`: canonical case lifecycle and outbox starter
- `services/orchestration-service`: state-machine and transition guard starter
- `services/adapter-runtime`: department adapter registry with mock adapters
- `services/notification-service`: notification persistence and send stubs
- `services/audit-service`: append-only audit API starter
- `services/ai-service`: FastAPI advisory service
- `packages/shared`: common constants, logging, config, middleware, errors, and helpers
- `packages/ui`: shared UI extraction landing zone
- `n8n/`: automation workflow starters
- `infra/`: deployment placeholders and infrastructure notes

## Folder Structure

```text
.
├── apps/
├── docs/
├── infra/
├── n8n/
├── packages/
├── services/
├── web/
├── ai-service/              # preserved legacy AI starter
├── docker-compose.yml
├── package.json
└── README.md
```

## Monorepo Conventions

- npm workspaces at the repo root
- Express + EJS remain the server-rendered UI stack
- MongoDB + Mongoose remain the operational data layer
- FastAPI AI service is advisory only
- n8n is automation glue, not system of record
- Event names follow dot-separated lowercase versioning such as `case.submitted.v1`

## Getting Started

1. Copy `.env.example` to `.env`
2. Keep any existing `web/.env` file if you already use it locally
3. Install dependencies from the repo root:

```bash
npm install
```

4. Start the main portal in compatibility mode:

```bash
npm run dev:public
```

5. Start additional services as needed:

```bash
npm run dev:gateway
npm run dev:case
npm run dev:adapter
npm run dev:notification
npm run dev:audit
```

## Docker Compose

Bring up the local stack:

```bash
npm run docker:up
```

Tear it down:

```bash
npm run docker:down
```

Included services:

- MongoDB
- Mongo Express
- RabbitMQ
- Kafka
- Gateway
- Public, investor, and department portals
- Case, orchestration, adapter, notification, and audit services
- AI service
- n8n

## Seed and Demo Users

The existing seeding flow is preserved through the legacy `web` workspace:

```bash
npm run seed
```

Default demo users remain documented in the legacy app flow, including:

- `admin@udyogsetu.local`
- investor and officer demo accounts seeded by the existing scripts

## Health Endpoints

- Gateway: `http://localhost:4000/health`
- Public portal: `http://localhost:4003/health`
- Investor portal: `http://localhost:4001/health`
- Department portal: `http://localhost:4002/health`
- Case service: `http://localhost:4100/health`
- Orchestration service: `http://localhost:4101/health`
- Adapter runtime: `http://localhost:4102/health`
- Notification service: `http://localhost:4103/health`
- Audit service: `http://localhost:4104/health`
- AI service: `http://localhost:8000/health`

Each service also exposes `/ready`.

## AI Service Overview

The FastAPI AI service exposes:

- `POST /ai/validate-document`
- `POST /ai/normalise-fields`
- `POST /ai/recommend-approval-path`
- `POST /ai/predict-delay`
- `POST /ai/summarise-case`

These responses include confidence scores and explanation text. The AI service does not mutate case
state.

## n8n Workflow Overview

Starter workflows are provided for:

- inbound reconciliation
- nightly reconciliation
- SLA reminders
- grievance escalation
- adapter retry processing
- operations alerts

See [n8n/README.md](n8n/README.md) for details.

## Development Conventions

- Route files: kebab-case, for example `case.routes.js`
- Controllers: `case.controller.js`
- Services: `case.service.js`
- Models: PascalCase, for example `Case.js`
- Constants: `UPPER_SNAKE_CASE`
- Use shared helpers from `packages/shared` where practical
- Preserve `web/` compatibility until a given feature is fully migrated

## Troubleshooting

- If the UI already works from `web/`, prefer the portal wrappers over moving templates around.
- If MongoDB is unavailable, some new services start in degraded mode for local scaffolding.
- If `npm install` has not yet been run from the root, workspace scripts will not be available.
- The legacy `ai-service/` directory is intentionally preserved while `services/ai-service/` becomes
  the monorepo-native service.

## Intentional TODOs

- Replace gateway stubs with real proxy or SDK integration
- Extract shared EJS layouts and public assets into `packages/ui`
- Add message broker consumers and outbox dispatchers
- Add stronger contract tests across service boundaries
