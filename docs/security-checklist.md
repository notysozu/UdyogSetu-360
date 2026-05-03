# Security Checklist

## Authentication
- [ ] Passwords hashed with approved algorithm.
- [ ] JWT expiry configured.
- [ ] Refresh token rotation implemented or explicitly scoped.
- [ ] HttpOnly cookies used for browser sessions.
- [ ] Secure cookies enabled in production.
- [ ] OIDC-ready SSO integration points reviewed.
- [ ] Service-to-service authentication configured.
- [ ] Logout/session revocation tested.

## Authorisation
- [ ] RBAC enforced.
- [ ] ABAC enforced for investor ownership and department scope.
- [ ] Route-level guards configured.
- [ ] Service-level guards configured.
- [ ] Auditor routes are read-only.
- [ ] Admin override reason required.
- [ ] Document permissions checked before URL generation.

## Input Validation
- [ ] Request bodies validated.
- [ ] Query strings validated.
- [ ] Route params validated.
- [ ] File type and size validation enforced.
- [ ] Webhook payload validation enforced.
- [ ] AI payload validation enforced.
- [ ] n8n payload validation enforced.

## Data Protection
- [ ] No secrets in logs.
- [ ] No raw files stored in MongoDB.
- [ ] Signed URLs expire.
- [ ] PII excluded from public dashboard.
- [ ] Analytics minimum group size enforced.
- [ ] Audit exports permission-protected.

## Infrastructure
- [ ] HTTPS/TLS termination configured.
- [ ] CORS restricted.
- [ ] Helmet/security headers enabled where applicable.
- [ ] Rate limiting configured.
- [ ] Webhook signatures enforced.
- [ ] Kafka credentials configured outside source.
- [ ] RabbitMQ credentials configured outside source.
- [ ] MongoDB credentials configured outside source.
- [ ] S3 credentials configured outside source.
- [ ] n8n encryption key configured outside source.
- [ ] Backups encrypted where possible.

## Audit And Compliance
- [ ] Append-only audit events verified.
- [ ] Tamper-evident hash chain verified.
- [ ] Audit exports logged.
- [ ] Privileged admin actions audited.
- [ ] Replay actions audited.
- [ ] Operations console actions audited.

## AI Safety
- [ ] AI advisory only.
- [ ] Human review required for uncertain or high-risk recommendations.
- [ ] No direct mutation from Python services.
- [ ] Safe summarisation checked.
- [ ] Feedback and override logging minimises PII.

## n8n Safety
- [ ] n8n does not mutate DB directly.
- [ ] n8n calls Node APIs only.
- [ ] n8n secrets use env/credentials store.
- [ ] n8n payloads minimised.
