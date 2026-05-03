# Analytics Checklist

- [x] Projection models created
- [x] Aggregation services created
- [x] Query services created
- [x] Bottleneck detection service added
- [x] Document defect analytics service added
- [x] Department turnaround analytics added
- [x] Rejection reason analytics added
- [x] Query ageing analytics added
- [x] Officer workload analytics added
- [x] Escalation frequency analytics added
- [x] Investor history analytics added
- [x] Roll-up jobs added
- [x] Export endpoints added
- [x] EJS dashboards added
- [x] Review committee pack page added
- [x] Privacy masking rules added
- [x] Seed script added
- [x] Environment variables added
- [ ] Full integration tests completed
- [ ] Existing flows regression-tested end-to-end

## Manual Test Flow
1. Start app.
2. Run `npm run seed:analytics`.
3. Login as admin.
4. Open `/admin/analytics`.
5. Visit:
   - `/admin/analytics/bottlenecks`
   - `/admin/analytics/document-defects`
   - `/admin/analytics/department-turnaround`
   - `/admin/analytics/rejections`
   - `/admin/analytics/query-ageing`
   - `/admin/analytics/officer-workload`
   - `/admin/analytics/escalations`
   - `/admin/analytics/investor-history`
   - `/admin/analytics/review-pack`
6. Run `npm run analytics:rollup`.
7. Request CSV export from `/admin/analytics/exports`.
8. Verify export audit event.
9. Login as supervisor and verify own-department view.
10. Login as nodal and verify cross-department non-PII view.
11. Login as investor and verify denied.
12. Print review pack page.
