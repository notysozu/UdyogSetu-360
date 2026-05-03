# n8n Workflow Failure Runbook

## Symptoms
- Reminders, escalations, reconciliation or operational workflows stop executing.

## Detection
- n8n health, workflow execution logs, missing Node API calls.

## Immediate Action
- Confirm Node scheduled jobs and APIs remain healthy.
- Disable failing workflow if it loops.

## Diagnosis
- Check n8n credentials, webhook URL, workflow JSON version and API response.

## Recovery Steps
- Re-import workflow JSON.
- Restore n8n credentials.
- Re-run safe missed automation through Node API.

## Escalation Owner Placeholder
Automation owner: TBD.

## Verification
- Workflow executes successfully.
- Node audit/events exist for state-changing API calls.

## Audit Notes
n8n must not mutate MongoDB directly.
