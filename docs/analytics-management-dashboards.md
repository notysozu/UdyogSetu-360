# Analytics Management Dashboards

## Overview
This module adds projection-backed analytics for senior administrators, review committees, nodal leads, supervisors, and auditors. It uses MongoDB read models to avoid expensive live queries on each dashboard load.

## Read Models
- `AnalyticsDailyRollup`
- `DepartmentTurnaroundProjection`
- `BottleneckProjection`
- `DocumentDefectProjection`
- `RejectionReasonProjection`
- `QueryAgeingProjection`
- `OfficerWorkloadProjection`
- `EscalationFrequencyProjection`
- `InvestorHistoryProjection`
- `AnalyticsExportJob`

## Aggregation Strategy
- Aggregations run in `services/case-service/src/services/analytics-aggregation.service.js`.
- Early `$match` and soft-delete filtering are applied.
- Draft cases are excluded from management outcomes.
- Projection services upsert analytics collections for dashboard reads.

## Dashboards
- Admin routes:
  - `/admin/analytics`
  - `/admin/analytics/bottlenecks`
  - `/admin/analytics/document-defects`
  - `/admin/analytics/department-turnaround`
  - `/admin/analytics/rejections`
  - `/admin/analytics/query-ageing`
  - `/admin/analytics/officer-workload`
  - `/admin/analytics/escalations`
  - `/admin/analytics/investor-history`
  - `/admin/analytics/review-pack`
  - `/admin/analytics/exports`
- Supervisor aliases:
  - `/supervisor/analytics`
  - `/supervisor/analytics/officer-workload`
  - `/supervisor/analytics/department-turnaround`
  - `/supervisor/analytics/query-ageing`
- Nodal aliases:
  - `/nodal/analytics`
  - `/nodal/analytics/bottlenecks`
  - `/nodal/analytics/escalations`
  - `/nodal/analytics/review-pack`

## API Endpoints
- `/api/v1/analytics/overview`
- `/api/v1/analytics/bottlenecks`
- `/api/v1/analytics/document-defects`
- `/api/v1/analytics/department-turnaround`
- `/api/v1/analytics/rejections`
- `/api/v1/analytics/query-ageing`
- `/api/v1/analytics/officer-workload`
- `/api/v1/analytics/escalations`
- `/api/v1/analytics/investor-history`
- `/api/v1/analytics/review-pack`
- `/api/v1/analytics/rebuild`
- `/api/v1/analytics/exports`
- `/api/v1/analytics/exports/:exportId`

## Privacy Rules
- Investor contact data and document secrets are excluded.
- Investor history defaults to masked organisation labels.
- Officer names are anonymised for non-admin/non-supervisor readers.
- PII view requires permission (`analytics.view_pii`) and explicit include flag.
- Group-level suppression uses `ANALYTICS_MIN_GROUP_SIZE`.

## Rollups and Jobs
- `analytics-rollup.job.js`
- `analytics-daily-rollup.job.js`
- `analytics-projection-rebuild.job.js`
- Scripts:
  - `npm run analytics:rollup`
  - `npm run analytics:rebuild`

## Exports
- Export service: `analytics-export.service.js`
- Formats: csv, json, html_print (xlsx placeholder only)
- Export requests and completion/failure generate audit events.

## Environment Variables
Configured in `.env.example`:
- `ANALYTICS_ENABLED`
- `ANALYTICS_CACHE_ENABLED`
- `ANALYTICS_CACHE_TTL_SECONDS`
- `ANALYTICS_ROLLUP_ENABLED`
- `ANALYTICS_ROLLUP_INTERVAL_MINUTES`
- `ANALYTICS_DAILY_ROLLUP_HOUR`
- `ANALYTICS_DEFAULT_LOOKBACK_DAYS`
- `ANALYTICS_MAX_DATE_RANGE_DAYS`
- `ANALYTICS_EXPORT_ENABLED`
- `ANALYTICS_EXPORT_MAX_ROWS`
- `ANALYTICS_EXPORT_DIR`
- `ANALYTICS_MIN_GROUP_SIZE`
- `ANALYTICS_ALLOW_PII_FOR_ADMIN`
- `ANALYTICS_USE_MOCK_DATA`

## Manual Testing
1. Start services.
2. Run `npm run seed:analytics`.
3. Login as admin and open `/admin/analytics`.
4. Visit each analytics page listed above.
5. Run `npm run analytics:rollup`.
6. Request CSV export from `/admin/analytics/exports`.
7. Verify audit event exists for export.
8. Login as supervisor and verify department-only scope.
9. Login as nodal and verify cross-department non-PII view.
10. Login as investor and verify access denied.
11. Print `/admin/analytics/review-pack`.
