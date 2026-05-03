# n8n Workflows for UdyogSetu 360

These workflow starter files support operational automations around the UdyogSetu 360 backbone.
n8n is intentionally not the source of truth for case state; it reacts to events and calls Node
service APIs.

## Workflows

- `inbound-webhook-reconciliation.json`: receives department callbacks and normalizes them before
  handing them to gateway or adapter-runtime endpoints.
- `nightly-case-reconciliation.json`: scans long-running cases and compares local state with
  adapter status.
- `sla-reminder-campaign.json`: sends reminders for soon-to-breach SLAs.
- `grievance-escalation.json`: escalates unresolved grievances to nodal officers.
- `adapter-retry-reprocessing.json`: retries failed adapter handoffs safely.
- `operations-alerts.json`: pushes alert fanout for degraded integrations.

## Environment

- `N8N_BASE_URL`
- `N8N_WEBHOOK_SECRET`
- `GATEWAY_PORT`
- `CASE_SERVICE_PORT`
- `NOTIFICATION_SERVICE_PORT`
- `AUDIT_SERVICE_PORT`

## Integration notes

- n8n should call the gateway or service health endpoints to determine dependency health.
- Workflow executions must be replay-safe; the case-service outbox or audit-service events remain
  the durable record.
- Sensitive credentials should be stored in n8n credentials, never in workflow JSON.
