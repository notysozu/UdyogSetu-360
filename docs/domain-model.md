# UdyogSetu 360 Domain Model

## Overview

MongoDB is the operational source of truth for current state and derived projections. Domain events
and audit events are stored append-only for replayability and traceability.

## Relationship Map

- `Organisation` owns many `User`, `InvestorProfile`, `Case`, `Document`, `Notification`
- `InvestorProfile` links a `User` to an `Organisation`
- `Case` is the canonical aggregate
- `ApprovalTask`, `Document`, `Inspection`, `Fee`, `Certificate`, `Grievance`, and `SlaTimer`
  attach to a `Case`
- `DomainEvent` tracks append-only lifecycle events for replay/outbox publishing
- `AuditEvent` tracks append-only access and action history
- projection collections support dashboards and transparency views

## Collections

- `roles`
- `users`
- `organisations`
- `investorprofiles`
- `departments`
- `cases`
- `approvaltasks`
- `documents`
- `inspections`
- `fees`
- `certificates`
- `grievances`
- `notificationservicenotifications`
- `integrationendpoints`
- `retryjobs`
- `slatimers`
- `auditserviceevents`
- `domainevents`
- `casesummaryprojections`
- `departmentworkloadprojections`
- `publicmetricsprojections`
- `slabreachprojections`

## Important Indexes

- partial unique email on `User`
- partial unique `universalCaseId` on `Case`
- partial unique `caseId + departmentCode` on `ApprovalTask`
- unique `certificateNumber` and `verificationToken` on `Certificate`
- append-only indexes on `AuditEvent` and `DomainEvent`
- status/time indexes on `SlaTimer`, `RetryJob`, and projections

## Append-Only Event Strategy

`DomainEvent` acts as the outbox collection. Services append events with a CloudEvents-like envelope
and publishers later mark them as `published`, `failed`, or `dead_lettered`.

`AuditEvent` is append-only by convention and repository design. We only expose create and read
paths. Hash-chain placeholders are included with `previousHash` and `currentHash`.

## Soft Delete Strategy

Operational collections use:

- `isDeleted`
- `deletedAt`
- `deletedBy`

The shared `softDeletePlugin` adds:

- `softDeleteById(id, deletedBy)`
- `.active()` query helper
- `findActive(filter)` static

Audit and outbox collections are intentionally not soft-deleted in normal flows.

## Seed Users

- `investor@udyogsetu.local`
- `officer.pollution@udyogsetu.local`
- `officer.power@udyogsetu.local`
- `officer.fire@udyogsetu.local`
- `officer.industrial@udyogsetu.local`
- `officer.labour@udyogsetu.local`
- `admin@udyogsetu.local`
- `auditor@udyogsetu.local`

Password for seeded demo users:

- `password123`

## Pilot Departments

- Karnataka State Pollution Control Board
- Bangalore Electricity Supply Company Limited
- Karnataka State Fire and Emergency Services
- Department of Factories, Boilers, Industrial Safety and Health
- Department of Labour

## Service / Repository Pattern

- controllers call services
- services coordinate repositories, validation, timers, projections, and outbox events
- repositories stay persistence-only and use lean reads for list views

## Example Lifecycle

1. create draft case
2. append `case.draft_created.v1`
3. start case SLA timer
4. submit case
5. create one approval task per required department
6. append `case.submitted.v1` and `task.created.v1`
7. update projections
8. record audit events for operator actions
