# Department Portal

## Overview
The department portal provides Express and EJS views for `department_officer`, `department_supervisor`, `nodal_officer`, `auditor`, and admin override users. It is designed as a server-rendered workflow console for scrutiny, document review, inspection handling, fee demand actions, certificate issuance, comment threads, and SLA-aware task monitoring.

## Role Views
- Officer dashboards and inboxes live under `/department`
- Supervisor dashboards and workload tools live under `/supervisor`
- Nodal coordination views live under `/nodal`
- Auditor read-only views live under `/audit`

## Route Summary
- Dashboards: `/department`, `/supervisor`, `/nodal`, `/audit`
- Officer tasks: `/department/tasks`, `/department/tasks/:taskId`
- Supervisor operations: `/supervisor/tasks`, `/supervisor/workload`, `/supervisor/sla`
- Nodal coordination: `/nodal/cases`, `/nodal/sla`, `/nodal/escalations`
- Auditor review: `/audit/tasks`, `/audit/cases/:caseId`, `/audit/events`
- API routes: `/api/v1/department/tasks/*`

## Controller And Service Structure
- Controllers render EJS or return JSON envelopes.
- View services fetch inbox, task detail, timeline, comments, documents, and SLA state.
- Action services enforce RBAC and ABAC, call orchestration/lifecycle helpers where available, and create domain-event plus audit records for workflow mutations.
- Comment handling is separated into `department-comment.service.js`.

## Workflow Actions
- Start review
- Update checklist
- Review or reject documents
- Raise investor queries
- Schedule and complete inspections
- Create fee demands
- Approve, reject, or return tasks
- Issue certificates
- Add comments

Every action emits the mapped domain event and corresponding audit action through `department-action-event.service.js`.

## Checklist Scrutiny
Checklist items support:
- `pending`
- `satisfied`
- `not_satisfied`
- `needs_clarification`
- `not_applicable`

Approval is blocked until all required items are `satisfied` or `not_applicable`.

## Document Review
Task detail pages surface document metadata, version, verification status, and document review actions. Private object keys are not rendered into templates.

## Inspection, Fees, Approval, Rejection
- Inspection scheduling validates type, location, and future schedule unless admin override is used.
- Fee demand creation validates amount, total, and due date.
- Rejection requires a rejection reason.
- Approval validates checklist completion before transition.

## Certificate Issuance
Certificate issuance is available after approval or where the workflow allows it. The portal delegates storage and verification-token work to the existing certificate/document services where present.

## Comment Threads
Task and case comments support:
- `internal`
- `investor_visible`
- `audit_only`
- `nodal_visible`

Internal comments stay hidden from investor-facing flows.

## SLA Countdown
Dashboards and task detail pages render:
- due date
- countdown
- warning or breach status
- escalation level
- progress percentage

JavaScript enhances countdowns, but server-rendered values remain visible without JS.

## Events And Audit
Mapped workflow actions create:
- task review events
- checklist update events
- document review events
- inspection events
- fee demand events
- decision events
- certificate issuance events
- comment events
- SLA escalation events

Each action also records a matching audit entry with actor, role, department, resource linkage, correlation data, and reason where applicable.

## Mock Data
Set `USE_MOCK_DEPARTMENT_DATA=true` to use the built-in demo case `US360-KA-2026-000001`, five department tracks, task comments, documents, inspections, fees, certificates, and audit timeline samples.

## Manual Testing
1. Start the department portal workspace.
2. Login as a department officer.
3. Open `/department` and `/department/tasks`.
4. Open a task detail page and submit checklist, query, inspection, fee, and comment actions.
5. Approve or reject a task and verify flash messages.
6. Login as supervisor and test assign, reassign, and escalation flows.
7. Login as nodal officer and verify cross-department read views.
8. Login as auditor and confirm read-only access.
