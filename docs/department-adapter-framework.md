# Department Adapter Framework

## Purpose
The adapter framework gives UdyogSetu 360 a plug-and-play integration layer for legacy and modern department systems without pushing department-specific logic into CAF, orchestration, Kafka consumers, or RabbitMQ workers.

## Supported Adapter Types
- REST/API
- SFTP/file-drop
- Database
- Webhook/event-hook
- Human-assisted
- RPA placeholder

## Base Interface
The common contract lives in [BaseDepartmentAdapter.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/adapters/base/BaseDepartmentAdapter.js:1). It standardises capabilities, logging, normalised success/failure results, acknowledgement building, signature validation hooks, and error normalisation.

## Result Format
- Success responses include `departmentCode`, `adapterCode`, `operation`, `externalReferenceId`, acknowledgement, status, raw response, and timing metadata.
- Failure responses always carry normalised adapter errors instead of raw downstream exceptions.

## Configuration Model
Adapter configuration extends the existing [IntegrationEndpoint model](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/case-service/src/models/IntegrationEndpoint.js:1) with adapter-specific fields such as:
- `adapterCode`
- `adapterType`
- `displayName`
- `environment`
- `endpoints`
- `auth`
- `secretsRef`
- `signature`
- `mappingProfile`
- `retryPolicy`
- `capabilities`
- `fileDrop`
- `database`
- `webhook`
- `rpa`
- `humanAssisted`

Secrets are referenced, not stored inline.

## Registry and Factory
- Registry: [adapter-registry.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/services/adapter-registry.js:1)
- Factory: [adapter-factory.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/services/adapter-factory.js:1)

The registry tracks available adapter classes and active department bindings. The factory loads configs from Mongo when available, falls back to static development configs, validates them, instantiates the correct adapter class, and caches instances safely.

## Mapping and Transformation
- Mapping engine: [mapping-engine.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/mappings/mapping-engine.js:1)
- Canonical builder: [canonical-payload-builder.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/transformers/canonical-payload-builder.js:1)
- Department normaliser: [department-payload-normaliser.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/transformers/department-payload-normaliser.js:1)

The framework supports rename, copy, combine, enum mapping, boolean conversions, conditional mapping, defaults, and required-field validation.

## Signature Validation
Signature utilities live in [signature-validator.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/signatures/signature-validator.js:1). Supported today:
- HMAC SHA256
- HMAC SHA512
- RSA SHA256 placeholder
- API key header check
- Timestamp tolerance
- Replay-protection placeholder

## Retry Hooks
Retry policy helpers live in [adapter-retry-policy.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/retry/adapter-retry-policy.js:1). They classify retryability, calculate exponential backoff with jitter, and keep adapter retry decisions separate from RabbitMQ queue retry decisions.

## Acknowledgement Capture
[acknowledgement-capture.service.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/services/acknowledgement-capture.service.js:1) extracts external reference ids and acknowledgement numbers, builds canonical acknowledgement records, persists safe task linkage, and appends best-effort acknowledgement events.

## Error Classification
The adapter error hierarchy lives in [packages/shared/src/errors/adapter.errors.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/packages/shared/src/errors/adapter.errors.js:1). Categories include configuration, validation, mapping, authentication, authorisation, timeout, rate limit, unavailable, conflict, retryable, and non-retryable failures.

## Pilot Mock Adapters
- Pollution: `PollutionMockAdapter`
- Power: `PowerMockAdapter`
- Fire: `FireMockAdapter`
- Industrial safety: `IndustrialSafetyMockAdapter`
- Labour: `LabourMockAdapter`

Each mock returns realistic acknowledgement ids and department-specific external statuses which are normalised into canonical outcomes.

## Runtime Service
[adapter-runtime.service.js](/Users/sonukumar/Documents/Projects/GitHub/UdyogSetu%20360%20/services/adapter-runtime/src/services/adapter-runtime.service.js:1) is the single orchestration point for:
- `submitToDepartment`
- `checkDepartmentStatus`
- `pushDocumentToDepartment`
- `processDepartmentCallback`
- `getAdapterHealth`
- `listAdapterHealth`
- `reloadAdapter`

RabbitMQ consumers now call this service instead of embedding adapter logic.

## RabbitMQ Integration
- Outbound delivery workers delegate to `submitToDepartment`, `checkDepartmentStatus`, and `pushDocumentToDepartment`.
- Callback reconciliation workers delegate signature and adapter normalisation to `processDepartmentCallback`.
- Queue workers still own ack/nack, retry, and dead-letter behavior.

## Kafka/Outbox Integration
The runtime service appends existing integration events where available:
- `integration.dispatch_requested.v1`
- `integration.dispatch_succeeded.v1`
- `integration.dispatch_failed.v1`
- `integration.callback_received.v1`

For adapter health change events not yet formalised in the event taxonomy, the implementation currently uses audit/log stubs instead of inventing an incompatible canonical event.

## Audit Integration
The runtime service records audit events for:
- adapter submit requested
- adapter submit succeeded
- adapter submit failed
- callback received
- callback signature failed
- adapter config reloaded

## Onboarding a New Department
1. Add or seed an adapter config with `departmentCode`, `adapterCode`, `adapterType`, capabilities, timeout, retry policy, secret references, and endpoints.
2. Create a mapping profile for outbound and/or inbound fields.
3. Implement a department adapter by extending the correct base class.
4. Register the adapter class in the factory.
5. Seed or activate the config.
6. Verify health, submit, status, callback, and retry paths through adapter-runtime and RabbitMQ workers.

## Manual Commands
1. Seed adapters:
   `npm run seed:adapters`
2. List adapters:
   `curl http://localhost:4102/api/v1/adapters -H "x-user-role: admin"`
3. Health check:
   `curl http://localhost:4102/api/v1/adapters/pollution/health -H "x-user-role: admin"`
4. Submit mock application:
   `curl -X POST http://localhost:4102/api/v1/adapters/pollution/submit -H "Content-Type: application/json" -H "x-internal-service-token: replace-me" -d '{"canonicalPayload":{"universalCaseId":"US360-KA-2026-000001","application":{"caseType":"consent_to_establish"},"enterprise":{"legalName":"Setu Manufacturing Private Limited"},"project":{"waterRequirementKld":12,"location":{"district":"Bengaluru Urban"}},"departmentSpecific":{"pollutionCategory":"orange","effluentGenerated":true,"hazardousWasteGenerated":false},"documents":[]}}'`
5. Check status:
   `curl http://localhost:4102/api/v1/adapters/pollution/status/KSPCB-CTE-2026-000123 -H "x-internal-service-token: replace-me"`
6. Test callback:
   `curl -X POST http://localhost:4102/api/v1/adapters/fire/callback -H "Content-Type: application/json" -H "x-internal-service-token: replace-me" -d '{"externalReferenceId":"KSFES-NOC-2026-000789","status":"inspection_completed","callbackType":"inspection_completed","remarks":"Inspection completed successfully"}'`
