# Secrets Management

## Local Development
Use local `.env` files and keep `.env.example` free of real secrets. Local defaults may be convenient but must not be reused in staging or production.

## Never Commit
- JWT secrets
- MongoDB URI with credentials
- Kafka credentials
- RabbitMQ URL with password
- S3 access keys
- n8n encryption key
- AI service keys
- AI advisory keys
- OIDC secrets
- SMTP/SMS credentials
- DigiLocker credentials
- Webhook signing secrets

## Docker Compose
Development can use `.env`. For shared environments, prefer Docker secrets or mounted secret files. Do not bake secrets into images.

## Kubernetes
Use Kubernetes `Secret` objects or an external secret manager. `infra/secrets/k8s-secret.template.yaml` is a placeholder and must not contain real values.

## Production Secret Manager
Recommended placeholder options:
- cloud secret manager
- Vault-compatible service
- sealed secrets or external secrets operator

## Rotation Plan
- Rotate service tokens quarterly or after staff changes.
- Rotate immediately after suspected exposure.
- Maintain dual-key rollout for webhooks and service credentials when supported.
- Record rotation in operational audit.

## Emergency Revocation
1. Disable compromised credential at provider.
2. Rotate dependent service configuration.
3. Restart affected services.
4. Verify health and authentication.
5. Review logs for misuse.
6. Record incident and audit trail.
