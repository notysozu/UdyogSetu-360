# API Contracts

## Gateway

- `GET /health`
- `GET /ready`
- `ALL /api/v1/cases`
- `ALL /api/v1/tasks`
- `ALL /api/v1/documents`
- `ALL /api/v1/grievances`
- `ALL /api/v1/certificates`
- `ALL /api/v1/notifications`
- `ALL /api/v1/audit`
- `ALL /api/v1/integrations`

## Case Service

- `POST /cases`
- `GET /cases`
- `GET /cases/:id`
- `PATCH /cases/:id`
- `POST /cases/:id/submit`
- `GET /cases/:id/timeline`
- `POST /cases/:id/documents`
- `POST /cases/:id/grievances`

## Adapter Runtime

- `POST /adapters/:department/submit`
- `GET /adapters/:department/status/:referenceId`
- `POST /adapters/:department/callback`
