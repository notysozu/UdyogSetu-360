# AI Service Unavailable Runbook

## Symptoms
- AI validation, routing, advisory, summary or drafting requests time out.

## Detection
- AI health check failure, Node fallback warnings, operations console.

## Immediate Action
- Confirm Node fallback is active.
- Continue domain workflows through deterministic rules.

## Diagnosis
- Check FastAPI container health, logs, CPU/memory and API key config.

## Recovery Steps
- Restart AI service.
- Verify `/health` and `/ai/v1/advisory/health`.
- Run AI client tests or sample curl.

## Escalation Owner Placeholder
AI service owner: TBD.

## Verification
- AI requests return advisory envelopes.
- Fallback warning rate drops.

## Audit Notes
AI suggestions are not legal decisions. Human overrides must still be audited by Node where relevant.
