# Communication, Notification, Grievance and SLA Module

## Overview
This module introduces in-app notifications, provider abstractions for email/SMS, grievance lifecycle workflows, SLA monitoring, reminder dispatch, escalation chains, and ageing dashboards across investor and department portals.

## Channels and Providers
- In-app notifications are always persisted.
- Email/SMS channels are queued and dispatched through provider abstractions.
- Development providers (`dev-email`, `dev-sms`) return mock provider IDs and do not send real traffic unless explicitly configured.

## Grievance Lifecycle
- Create -> Acknowledge -> In Review/Waiting -> Resolved -> Closed/Reopened -> Escalated.
- Every status transition appends `statusHistory`.
- Internal comments are visibility-controlled and hidden from investors.
- External replies are investor-visible.

## SLA and Escalations
- SLA timers support warning, breach, escalation, pause/resume, and completion states.
- Warning evaluation runs before breach based on configured threshold.
- Breached items escalate per policy levels and trigger notifications.

## Scheduled Jobs
- `notification-dispatch.job.js`
- `reminder-dispatch.job.js`
- `sla-monitoring.job.js`
- `grievance-ageing-rollup.job.js`
- `approval-ageing-rollup.job.js`
- Scheduler starts only when `SCHEDULED_JOBS_ENABLED=true`.

## Events and Audit
- Key events emitted include notification/grievance/SLA/reminder events.
- Important actions write audit entries (notification send/fail/read, grievance lifecycle, SLA warning/breach/escalation, reminder schedule/send, template changes).

## Environment Variables
See `.env.example` entries added for:
- notification providers
- grievance due day windows
- SLA evaluation and escalation controls
- job dispatch intervals and module flags

## Manual Test Steps
1. Start services.
2. Run `npm run seed:communication`.
3. Login as investor and verify `/notifications` and `/grievances/new`.
4. Submit grievance and add a message.
5. Login as department officer and use `/department/grievances`.
6. Add internal comment and external reply.
7. Resolve and close grievance with required fields.
8. Open `/department/sla` and confirm warning/breach visuals.
9. Trigger SLA evaluation (`POST /api/v1/sla/evaluate`) and verify updates.
10. Confirm investor cannot see internal comments.
