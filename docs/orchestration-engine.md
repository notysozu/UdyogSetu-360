# Orchestration Engine

UdyogSetu 360 now includes a state-machine-driven orchestration layer in `services/orchestration-service` for case and department task lifecycle management.

## Overview

The orchestration engine is responsible for:

- validating case and task transitions
- aggregating case status from parallel department tasks
- enforcing dependency sequencing
- managing SLA timers
- emitting domain events and audit events
- replaying events safely with processed-event tracking

## Case State Machine

Implemented in:

- `services/orchestration-service/src/state-machines/case-state-machine.js`

Primary transitions:

- `draft -> submitted`
- `submitted -> under_scrutiny`
- `under_scrutiny -> query_raised | inspection_scheduled | fee_demanded | approved | rejected | amendment_requested`
- `query_raised -> response_submitted`
- `response_submitted -> under_scrutiny`
- `inspection_scheduled -> inspection_completed`
- `inspection_completed -> fee_demanded | approved | rejected`
- `fee_demanded -> fee_paid`
- `fee_paid -> under_scrutiny`
- `approved -> certificate_issued`
- `certificate_issued -> closed`
- `rejected -> reopened`
- `closed -> reopened`
- `reopened -> under_scrutiny`
- `submitted -> withdrawn`
- `draft -> withdrawn`
- `amendment_requested -> amended`
- `amended -> under_scrutiny`

## Task State Machine

Implemented in:

- `services/orchestration-service/src/state-machines/task-state-machine.js`

Primary transitions:

- `pending -> assigned`
- `assigned -> under_review`
- `under_review -> query_raised | inspection_required | fee_demanded | approved | rejected | returned`
- `query_raised -> response_received`
- `response_received -> under_review`
- `inspection_required -> inspection_scheduled`
- `inspection_scheduled -> inspection_completed`
- `inspection_completed -> under_review`
- `fee_demanded -> fee_paid`
- `fee_paid -> under_review`
- `approved -> certificate_issued`
- `certificate_issued -> closed`
- `rejected -> closed`
- `pending | assigned -> cancelled`

## Guard Rules

Implemented in:

- `services/orchestration-service/src/guards/transition-guards.js`
- `services/orchestration-service/src/guards/dependency-guards.js`

Current rules include:

- closed cases cannot change unless reopened
- approval requires checklist completion
- rejection-sensitive transitions require a reason
- fee payment requires a payment reference
- certificate issuance requires a certificate number or document reference
- dependency guards block invalid sequencing such as:
  - certificate issuance before approval
  - fee paid before fee demanded
  - inspection completed before inspection scheduled

## Parallel Task Aggregation

Implemented in:

- `services/orchestration-service/src/services/orchestration.service.js`

`recalculateCaseAggregateStatus(caseId, context)` loads the case and active tasks, derives the aggregate status, and updates the case only when a real status change is needed.

Aggregation rules currently support:

- any active `query_raised` task moves the case to `query_raised`
- inspection-related task states move the case to `inspection_scheduled`
- any mandatory rejection moves the case to `rejected`
- all mandatory approvals move the case to `approved`
- all issued certificates move the case to `certificate_issued`

## Dependency Sequencing

Implemented in:

- `services/orchestration-service/src/workflows/workflow-dependencies.js`

Current starter dependencies:

- fire review depends on layout/building documents
- industrial safety depends on factory details
- labour registration depends on employee data
- certificate issuance depends on approval
- fee payment depends on fee demand
- inspection completion depends on scheduled inspection
- closure depends on finality

## SLA Clock Behaviour

Implemented in:

- `services/orchestration-service/src/services/sla-orchestration.service.js`

Supported operations:

- start case SLA on submission
- start task SLA on task creation or assignment
- pause SLA on query raised
- resume SLA on response received
- complete SLA on approval, rejection, closure, or certificate issuance finality
- cancel SLA on withdrawal/cancellation
- evaluate warnings and breaches in batch

Default department SLA days:

- pollution: 30
- power: 21
- fire: 15
- industrial_safety: 30
- labour: 15

## Replay-Safe Event Handling

Implemented in:

- `services/orchestration-service/src/models/ProcessedEvent.js`
- `services/orchestration-service/src/services/event-replay.service.js`
- `services/orchestration-service/src/handlers/case-event.handlers.js`
- `services/orchestration-service/src/handlers/task-event.handlers.js`

Handlers check whether an event has already been processed for a given handler name before running again.

## Events and Audit Behaviour

Every important transition appends:

- a domain event in the outbox/event store
- an audit event in the audit service collection

Transition payloads include:

- previous status
- next status
- actor
- reason
- case/task identifiers
- universal case ID
- department code where relevant

## API Routes

The orchestration service exposes:

- `POST /api/v1/orchestration/cases/:caseId/transition`
- `POST /api/v1/orchestration/tasks/:taskId/transition`
- `POST /api/v1/orchestration/cases/:caseId/recalculate`
- `POST /api/v1/orchestration/cases/:caseId/replay`
- `GET /api/v1/orchestration/cases/:caseId/state`
- `GET /api/v1/orchestration/tasks/:taskId/state`
- `POST /api/v1/orchestration/sla/evaluate`

## Compatibility

Existing `services/case-service` methods now delegate lifecycle writes through the orchestration layer for:

- `submitCase`
- `changeCaseStatus`
- `assignTask`
- `raiseQuery`
- `submitTaskResponse`
- `approveTask`
- `rejectTask`

## Testing Guide

Run:

```bash
npm --workspace @udyogsetu/orchestration-service test
```

The current tests cover:

- valid and invalid state transitions
- reason/checklist guards
- aggregate case status across parallel tasks
- dependency sequencing rules
- a five-department approval flow progression

Two integration-heavy areas are intentionally left as `todo` tests for now:

- persisted SLA timer transitions
- persisted replay-safe `ProcessedEvent` behavior
