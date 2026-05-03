# Document Subsystem

## Overview
The UdyogSetu 360 document subsystem stores binary content in S3-compatible object storage and keeps only metadata in MongoDB. It supports server-side upload, signed upload/download URLs, versioning, verification, certificate publishing, access logging, scanning hooks, and DigiLocker-backed reference import.

## MongoDB vs Object Storage
- MongoDB stores document metadata, permissions, hashes, verification state, version links, DigiLocker references, and audit context.
- S3 or MinIO stores the raw file bytes.
- Raw document binaries are never persisted in MongoDB.

## Storage Providers
- `s3`: production-oriented provider using `@aws-sdk/client-s3`
- `minio`: supported through the same S3-compatible provider
- `local`: development fallback under `storage/documents`
- `digilocker_reference`: metadata-only imported reference

## Upload Modes
### Server-side multipart
- `POST /api/v1/documents/upload`
- `POST /api/v1/cases/:caseId/documents/upload`
- Uses `multer`, validates MIME type and size, computes checksum, uploads to object storage, writes metadata, emits audit/event hooks.

### Signed browser upload
- `POST /api/v1/documents/signed-upload-url`
- `POST /api/v1/documents/:documentId/confirm-upload`
- Creates a draft document intent, generates signed upload details, and confirms storage metadata after upload.
- In local fallback mode, signed upload/download routes are HMAC-signed and time-bound.

## Object Key Strategy
- Case-linked files: `cases/{universalCaseId}/{documentType}/v{version}/{documentId}-{safeFileName}`
- Organisation-linked files: `organisations/{organisationId}/{documentType}/v{version}/{documentId}-{safeFileName}`
- File names are sanitized to remove traversal and unsafe characters.

## Hashing and Checksums
- Default algorithm: `sha256`
- Implemented in `services/case-service/src/documents/document-hash.service.js`
- Checksums are stored in Mongo metadata and attached to S3 object metadata when available.

## Versioning
- Each version is a separate `Document` record.
- Relationships use `parentDocumentId`, `version`, and `supersededByDocumentId`.
- `POST /api/v1/documents/:documentId/new-version`
- `GET /api/v1/documents/:documentId/versions`

## Permission-Aware Retrieval
- Implemented in `document-permission.service.js`
- Investors can access their own organisation’s documents.
- Department officers can access department-linked task documents.
- Auditors can view/download for audit but cannot verify or mutate.
- Public access is limited to certificate verification tokens.

## Signed URL Flow
- `GET /api/v1/documents/:documentId/signed-download-url`
- Signed URLs are issued only after permission checks.
- S3/MinIO uses presigned URLs.
- Local fallback uses short-lived HMAC-signed app routes.

## Certificate Storage and Verification
- `POST /api/v1/certificates`
- `GET /api/v1/certificates/:certificateNumber`
- `POST /api/v1/certificates/:certificateNumber/revoke`
- `GET /verify/certificate/:verificationToken`
- Public verification returns only limited certificate-safe fields.

## Scanning Hooks
- `POST /api/v1/documents/:documentId/scan`
- `POST /api/v1/documents/scanning/callback`
- Current implementation is a stub-friendly hook that marks scan state and can quarantine on upload when configured.

## DigiLocker
### Consent Flow
- `POST /api/v1/digilocker/consents`
- `GET /digilocker/callback`
- `GET /api/v1/digilocker/consents/:consentId`
- `POST /api/v1/digilocker/consents/:consentId/revoke`

### Retrieval and Verification
- `GET /api/v1/digilocker/documents`
- `POST /api/v1/digilocker/documents/retrieve`
- `POST /api/v1/digilocker/documents/verify`
- `POST /api/v1/digilocker/documents/import`
- `POST /api/v1/digilocker/webhook`

### Sandbox and Mock Mode
- If `DIGILOCKER_ENABLED=false` and `DIGILOCKER_ALLOW_SANDBOX_MOCK=true`, the subsystem returns mock consent URLs, mock documents, mock verification responses, and reference-only imports.

## Events and Audit Hooks
Implemented or stubbed event names:
- `document.uploaded.v1`
- `document.version_created.v1`
- `document.verified.v1`
- `document.rejected.v1`
- `document.superseded.v1`
- `document.deleted.v1`
- `document.scan_requested.v1`
- `document.scan_completed.v1`
- `certificate.issued.v1`
- `certificate.revoked.v1`
- `certificate.verified.v1`
- `digilocker.consent_initiated.v1`
- `digilocker.consent_granted.v1`
- `digilocker.document_retrieved.v1`
- `digilocker.document_verified.v1`
- `digilocker.document_imported.v1`

Audit actions include upload, metadata view, download URL generation, download, verification, rejection, supersede, delete, certificate issue/revoke/verify, and DigiLocker reconciliation actions.

## Environment Variables
Add or review:
- `DOCUMENT_STORAGE_PROVIDER`
- `DOCUMENT_STORAGE_LOCAL_FALLBACK`
- `DOCUMENT_MAX_FILE_SIZE_MB`
- `DOCUMENT_ALLOWED_MIME_TYPES`
- `DOCUMENT_SIGNED_URL_EXPIRES_SECONDS`
- `DOCUMENT_UPLOAD_URL_EXPIRES_SECONDS`
- `DOCUMENT_HASH_ALGORITHM`
- `DOCUMENT_ENABLE_SCANNING`
- `DOCUMENT_SCANNING_PROVIDER`
- `DOCUMENT_QUARANTINE_ON_UPLOAD`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY`
- `S3_SECRET_KEY`
- `S3_FORCE_PATH_STYLE`
- `MINIO_CONSOLE_PORT`
- `DIGILOCKER_*`

## Manual Test Steps
1. Start MongoDB and MinIO:
   `docker compose up mongodb minio minio-create-bucket`
2. Start the case service and portals.
3. Upload a document:
   `curl -X POST http://localhost:4100/api/v1/cases/CASE_ID/documents/upload -H "x-user-id: USER_ID" -H "x-user-role: investor" -H "x-organisation-id: ORG_ID" -F "documentType=project_report" -F "title=Project Report" -F "file=@./sample.pdf"`
4. Get a signed download URL:
   `curl http://localhost:4100/api/v1/documents/DOCUMENT_ID/signed-download-url -H "x-user-id: USER_ID" -H "x-user-role: investor"`
5. Create a new version:
   `curl -X POST http://localhost:4100/api/v1/documents/DOCUMENT_ID/new-version -H "x-user-id: USER_ID" -H "x-user-role: investor" -F "file=@./sample-v2.pdf"`
6. Verify a document:
   `curl -X POST http://localhost:4100/api/v1/documents/DOCUMENT_ID/verify -H "x-user-id: OFFICER_ID" -H "x-user-role: department_officer" -H "x-department-code: fire" -H "Content-Type: application/json" -d '{"remarks":"Verified against submitted records"}'`
7. Start DigiLocker mock consent:
   `curl -X POST http://localhost:4100/api/v1/digilocker/consents -H "x-user-id: USER_ID" -H "x-user-role: investor" -H "Content-Type: application/json" -d '{"requestedDocumentTypes":["pan_card","udyam_certificate"],"purpose":"CAF document verification"}'`

## Troubleshooting
- If MinIO is up but downloads fail, verify `S3_BUCKET`, `S3_FORCE_PATH_STYLE=true`, and the bucket init container completed.
- If local fallback signed URLs fail, check `DOCUMENT_LOCAL_SIGNING_SECRET` or the shared secret fallback values.
- If DigiLocker mock mode is expected but unavailable, confirm `DIGILOCKER_ALLOW_SANDBOX_MOCK=true`.
- If a verified document is blocked from download, inspect `scan.status` and `permissions.isDownloadAllowed`.
