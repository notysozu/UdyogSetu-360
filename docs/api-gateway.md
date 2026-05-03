# API Gateway

## Overview

The UdyogSetu 360 gateway is the versioned API entry point for external clients, portals, departmental callbacks, and internal service integrations. It sits in `apps/gateway` and provides a stable `/api/v1` surface while the underlying case, audit, notification, and adapter services evolve independently.

The gateway currently focuses on:

- versioned routing under `/api/v1`
- standard success and error envelopes
- correlation and request ID propagation
- request validation with Zod
- rate limiting
- idempotency-key handling for unsafe write endpoints
- webhook signature verification
- legacy `/api/*` compatibility aliases
- OpenAPI 3.1 documentation

## Versioning Strategy

- Primary prefix: `/api/v1`
- Compatibility aliases:
  - `/api/cases`
  - `/api/tasks`
  - `/api/documents`
  - `/api/grievances`
  - `/api/certificates/verify`
  - `/api/events`

Legacy aliases respond with:

- `Deprecation: true`
- `Link: </api/v1/...>; rel="successor-version"`

## Standard Response Envelope

Success:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": {
    "correlationId": "corr-123",
    "requestId": "req-123",
    "timestamp": "2026-05-01T00:00:00.000Z",
    "apiVersion": "v1"
  }
}
```

Error:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": []
  },
  "meta": {
    "correlationId": "corr-123",
    "requestId": "req-123",
    "timestamp": "2026-05-01T00:00:00.000Z",
    "apiVersion": "v1"
  }
}
```

## Error Codes

- `VALIDATION_ERROR`
- `AUTH_REQUIRED`
- `ACCESS_DENIED`
- `NOT_FOUND`
- `CONFLICT`
- `IDEMPOTENCY_CONFLICT`
- `WEBHOOK_SIGNATURE_INVALID`
- `RATE_LIMITED`
- `PAYLOAD_TOO_LARGE`
- `UNSUPPORTED_MEDIA_TYPE`
- `INTERNAL_ERROR`
- `SERVICE_UNAVAILABLE`
- `BAD_REQUEST`

## Correlation IDs

The gateway:

- accepts incoming `x-correlation-id`
- generates one if missing
- generates `x-request-id` for every request
- places both in `req.context`
- returns them in response headers and envelope metadata

These IDs should be forwarded to downstream services and included in logs, audit records, and replay tooling.

## Idempotency-Key Usage

Required for:

- `POST /api/v1/cases`
- `POST /api/v1/cases/:caseId/submit`
- `POST /api/v1/documents`
- `POST /api/v1/events/ingest`
- `POST /api/v1/grievances`
- `POST /api/v1/tasks/:taskId/actions/*`

Headers:

```http
Idempotency-Key: demo-key-001
```

Gateway behavior:

- first request stores a processing record
- matching completed request replays stored response
- same key with different request body returns `409 IDEMPOTENCY_CONFLICT`
- active in-flight duplicate returns accepted/processing response

Response header:

```http
x-idempotency-status: created|replayed|conflict|processing
```

## Webhook Signing Format

Webhook routes expect:

- `x-us360-signature`
- `x-us360-timestamp`
- `x-us360-webhook-id`
- optional `x-correlation-id`

Signature format:

- algorithm: `HMAC SHA256`
- signed string: raw request body concatenated with timestamp
- shared secret: integration-specific secret or `WEBHOOK_DEFAULT_SECRET`

Development bypass is controlled by:

- `WEBHOOK_ALLOW_DEV_BYPASS=true`

## Rate Limiting

Default policies:

- global API: `300` requests / `15` minutes / IP
- webhook ingestion: `120` requests / minute / IP
- certificate verification: `60` requests / `15` minutes / IP
- dashboard queries: `100` requests / `15` minutes / IP

Configured via environment variables in `.env.example`.

## OpenAPI Docs

- JSON: `/api/v1/openapi.json`
- HTML index: `/api/v1/docs`

The contract is generated as OpenAPI `3.1.0`.

## Key Routes

- `POST /api/v1/cases`
- `PATCH /api/v1/cases/:caseId`
- `POST /api/v1/cases/:caseId/submit`
- `POST /api/v1/tasks/:taskId/actions/approve`
- `POST /api/v1/documents`
- `POST /api/v1/events/ingest`
- `POST /api/v1/certificates/verify`
- `POST /api/v1/grievances`
- `GET /api/v1/dashboard/public-metrics`

## Local Testing Examples

```bash
curl http://localhost:4000/health
```

```bash
curl http://localhost:4000/api/v1/openapi.json
```

```bash
curl -X POST http://localhost:4000/api/v1/cases \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: demo-key-001" \
  -d '{"caseType":"new_industrial_unit","title":"Demo Factory Approval"}'
```

```bash
curl -i http://localhost:4000/api/cases
```

## Backwards Compatibility

The gateway does not replace the server-rendered `web/` app. EJS pages and existing UI routes stay in place. The new gateway is an additive API layer with deprecated compatibility aliases for older `/api/*` callers.
