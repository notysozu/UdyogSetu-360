# Legacy Data Import Plan

## Scope
Legacy import supports:
- SWS applications.
- Department task references.
- Document metadata.
- Certificates.
- Grievances.
- Status history.
- External reference IDs.

## Rules
- Dry-run mode is required by default.
- Do not overwrite existing cases.
- Generate or map universal case ID.
- Preserve legacy reference ID.
- Mark `sourceSystem`.
- Create import audit event.
- Create domain events:
  - `legacy.case_imported.v1`
  - `legacy.document_imported.v1`
  - `legacy.certificate_imported.v1`
- Validate rows before import.
- Generate an error report.
- Use an idempotency key per legacy record.

## Process
1. Receive legacy CSV export.
2. Validate columns and required fields.
3. Run dry-run import.
4. Review error report.
5. Reconcile duplicates and references.
6. Run controlled import.
7. Verify counts and sample records.
8. Export import audit summary.

## Script
Use:
```bash
node scripts/import-legacy-data.js --dry-run --input tests/fixtures/legacy/legacy-cases.sample.csv
```
