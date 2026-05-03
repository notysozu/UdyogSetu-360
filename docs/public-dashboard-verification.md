# Public Dashboard And Verification

## Overview
The public portal provides a privacy-safe transparency dashboard and a third-party verification flow for certificates and approvals. It uses Express, EJS, server-rendered forms, and progressive enhancement only.

## Privacy Rules
- No investor names, email addresses, phone numbers, physical addresses, raw document payloads, officer names, or internal comments are shown.
- Metrics are aggregate-only.
- Small groups are merged or marked as insufficient public data using `PUBLIC_METRICS_MIN_GROUP_SIZE`.
- Verification results expose only public authenticity fields.

## Dashboard Data Strategy
- Prefer `PublicMetricsProjection` and `DepartmentWorkloadProjection`.
- Fall back to operational aggregates only when projections are unavailable.
- Fall back to seeded mock data in development when the database is unavailable or empty.

## Caching
- In-memory cache for public metrics.
- TTL controlled by `PUBLIC_METRICS_CACHE_TTL_SECONDS`.
- Dashboard responses send `Cache-Control: public`.
- Verification POST responses send `Cache-Control: no-store`.

## Anti-Abuse Controls
- Public dashboard rate limiting.
- Stricter verification rate limiting.
- Date-range validation.
- Repeated failed verification tracking via `PublicVerificationAttempt`.
- Optional captcha placeholder flag for public verification forms.

## Verification Methods
- Verification token
- Certificate/reference number with Universal Case ID
- Certificate/reference number with checksum

## Verification Output
- `verified`
- `status`
- `certificateNumber`
- `universalCaseId`
- `issuingDepartment`
- `certificateType`
- `issuedAt`
- `validFrom`
- `validUntil`
- `revokedAt`
- `revocationStatus`
- `checksumMatch`
- `verificationTimestamp`
- `verificationId`
- `publicMessage`

## Seed Data
The seed script creates:
- 12 months of `PublicMetricsProjection`
- department workload projections for the five departments
- a sample issued certificate:
  - `CERT-US360-2026-000001`
  - `US360-KA-2026-000001`
  - token `DEV-VERIFY-TOKEN-000001`

## Routes
- `/public/dashboard`
- `/public/metrics`
- `/public/departments`
- `/public/grievances`
- `/public/certificates`
- `/verify`
- `/verify/certificate/:verificationToken`
- `/api/v1/public/metrics/*`
- `/api/v1/public/verify`

## Environment Variables
- `PUBLIC_METRICS_CACHE_ENABLED`
- `PUBLIC_METRICS_CACHE_TTL_SECONDS`
- `PUBLIC_METRICS_MIN_GROUP_SIZE`
- `PUBLIC_METRICS_RATE_LIMIT_WINDOW_MS`
- `PUBLIC_METRICS_RATE_LIMIT_MAX`
- `PUBLIC_VERIFY_RATE_LIMIT_WINDOW_MS`
- `PUBLIC_VERIFY_RATE_LIMIT_MAX`
- `PUBLIC_VERIFY_MAX_FAILED_ATTEMPTS_PER_IP`
- `PUBLIC_VERIFY_ENABLE_CAPTCHA_PLACEHOLDER`
- `PUBLIC_METRICS_MAX_DATE_RANGE_DAYS`

## Manual Testing
1. Run `npm run seed:public-metrics`.
2. Start the public portal.
3. Open `/public/dashboard`.
4. Test date, department, and stage filters.
5. Open `/verify`.
6. Verify `CERT-US360-2026-000001` with `US360-KA-2026-000001`.
7. Verify `/verify/certificate/DEV-VERIFY-TOKEN-000001`.
8. Try an incorrect checksum and confirm failure.
9. Confirm HTML and API responses expose no PII.

## Security Notes
- Verification attempts are logged with hashed inputs, not raw tokens.
- No raw document URLs or storage object keys are returned.
- Legacy compatibility endpoints remain available without replacing the existing web/gateway flows.
