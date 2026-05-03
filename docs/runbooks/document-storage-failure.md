# Document Storage Failure Runbook

## Symptoms
- Upload intents fail, signed URLs fail, downloads fail or certificate storage unavailable.

## Detection
- Document service errors, MinIO/S3 health, user reports.

## Immediate Action
- Disable non-critical uploads if corruption risk exists.
- Verify bucket and credentials.

## Diagnosis
- Check S3 endpoint, bucket policy, object key generation and network access.
- Confirm MongoDB metadata remains consistent.

## Recovery Steps
- Restore object storage connectivity.
- Reissue signed URLs.
- Reconcile pending upload intents.

## Escalation Owner Placeholder
Storage owner: TBD.

## Verification
- Upload, confirm, download and certificate verification pass.

## Audit Notes
Document access and admin recovery actions must be audited where configured.
