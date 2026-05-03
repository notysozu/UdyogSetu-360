# Event Taxonomy

UdyogSetu 360 uses dot-separated lowercase event names with explicit versions.

## Core events

- `case.submitted.v1`
- `case.amended.v1`
- `task.created.v1`
- `task.assigned.v1`
- `task.query_raised.v1`
- `task.response_submitted.v1`
- `task.approved.v1`
- `task.rejected.v1`
- `document.uploaded.v1`
- `grievance.created.v1`
- `certificate.issued.v1`
- `notification.sent.v1`
- `audit.recorded.v1`

## Event envelope shape

- `id`
- `specversion`
- `type`
- `source`
- `subject`
- `time`
- `datacontenttype`
- `correlationId`
- `actor`
- `data`

The shared helper lives in `packages/shared/src/events/envelope.js`.
