# Observability Checklist

- [x] Structured logger with JSON output and redaction
- [x] Correlation ID + request ID propagation
- [x] Tracing wrapper added with no-op fallback
- [x] Metrics registry + routes (`/metrics`, diagnostics metrics)
- [x] AuditEvent append-only schema with hash chain fields
- [x] Audit hash-chain verification service
- [x] Diagnostics API endpoints added
- [x] Stuck-case detection model/service added
- [x] Replay attempt model/service added
- [x] Operations console views/routes added
- [x] Audit viewer views/routes added
- [x] Audit export flow added
- [x] Privileged operations create audit records
- [x] Environment variables updated
- [x] Test placeholders added

## Manual Test Flow
1. Start services.
2. Login as admin.
3. Open `/admin/operations`.
4. Open health/queues/adapters/consumers pages.
5. Run stuck-case scan (`POST /api/v1/diagnostics/run-stuck-case-scan`).
6. Open `/admin/operations/stuck-cases`.
7. Search case trace and correlation trace pages.
8. Open `/admin/audit/events`.
9. Run integrity verify from `/admin/audit/integrity`.
10. Export from `/admin/audit/export`.
11. Start dry-run replay from `/admin/operations/replay/new`.
12. Login as auditor and confirm read-only operations/audit access.
13. Login as investor and confirm access denied.
