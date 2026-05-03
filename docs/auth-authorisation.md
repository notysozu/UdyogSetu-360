# Authentication and Authorisation

## Overview

UdyogSetu 360 now supports:

- local username/password login for development
- cookie-backed web sessions
- JWT access and refresh tokens
- service-to-service authentication
- RBAC via role and permission guards
- ABAC via case/task/organisation access helpers
- password reset, email verification, OTP stubs
- OIDC-ready SSO extension points
- audit logging for sensitive auth actions

## Login Flow

1. user submits email and password
2. password is verified with bcrypt
3. failed logins increment lockout counters
4. on success, a `UserSession` record is created
5. `us360_access_token` and `us360_refresh_token` are set as httpOnly cookies
6. `req.session.user` is preserved for compatibility with older routes

## JWT Flow

- access tokens are signed with `JWT_SECRET`
- refresh tokens are signed with `JWT_REFRESH_SECRET`
- both include role, permissions, organisation, department, investor, and session claims
- API routes use bearer or access-cookie auth through `attachCurrentUser`

## Refresh Flow

- refresh token is stored hashed in `UserSession`
- refresh rotates the stored hash
- logout revokes current session
- logout-all revokes every active session for the user

## Role Matrix

- investor: own dashboard, own cases, documents, grievances, notifications
- department_officer: department queue and department task actions
- department_supervisor: workload and assignment oversight
- nodal_officer: cross-department coordination and SLA visibility
- admin: users, roles, integrations, operations
- auditor: audit reads and exports
- system: internal calls only

## ABAC Rules

- investors are limited to their own cases or organisation-linked cases
- department users are limited to their own department tasks
- supervisors can assign within their department
- auditors can read audit data but not mutate cases
- admins can manage most resources but cannot bypass append-only audit/event rules

## Service-to-Service Auth

- `requireServiceAuth`
- `requireInternalCall`
- static dev token via `INTERNAL_SERVICE_TOKEN`
- signed service JWT via `SERVICE_JWT_SECRET`

## OIDC Placeholders

Routes:

- `GET /auth/sso/start`
- `GET /auth/sso/callback`

If `OIDC_ENABLED=false`, the app shows a friendly not-configured response.

## Password Reset / Verification

- `GET/POST /auth/forgot-password`
- `GET/POST /auth/reset-password/:token`
- `POST /auth/send-email-verification`
- `GET /auth/verify-email/:token`
- `POST /auth/send-otp`
- `POST /auth/verify-otp`

In development, reset and verification artifacts are logged to the server output instead of being
emailed or texted.

## Audit Events

Auth-sensitive actions log through the audit service, including:

- login success/failure
- logout
- refresh
- password reset request/completion
- email verification send/complete
- OTP send/verify
- session revoke
- SSO start/callback
- access denied
- service authentication
- admin role/status changes

## Environment Variables

See `.env.example` and `web/.env.example` for:

- JWT secrets and expiry controls
- cookie security settings
- password reset / verification expiry
- internal service authentication
- OIDC placeholders

## How to Test

1. run `npm install`
2. run `npm run seed` or `npm run seed:domain`
3. run `npm test`
4. sign in with a demo account
5. visit `/auth/sessions`
6. exercise forgot-password and OTP stubs in development
7. call `/internal/health` with a valid internal token
