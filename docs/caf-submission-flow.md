# CAF Submission Flow

## Overview

The Combined Application Form (CAF) flow gives investors a Single Window System style application journey inside the existing UdyogSetu 360 EJS portal.

The flow supports:

- draft creation
- draft update
- server-side validation
- review before final submission
- duplicate detection
- attachment metadata capture
- immutable Universal Case ID generation on final submit
- approval track calculation for five pilot departments
- initial task creation
- domain event creation
- audit event creation
- acknowledgement generation
- amendment
- resubmission

## Routes

### Investor EJS routes

- `GET /cases/new`
- `POST /cases/draft`
- `GET /cases/:caseId/edit`
- `PATCH /cases/:caseId/draft`
- `POST /cases/:caseId/validate`
- `POST /cases/:caseId/submit`
- `GET /cases/:caseId/acknowledgement`
- `GET /cases/:caseId/acknowledgement.pdf`
- `GET /cases/:caseId/amend`
- `POST /cases/:caseId/amend`
- `POST /cases/:caseId/resubmit`

### API routes

- `POST /api/v1/cases/draft`
- `PATCH /api/v1/cases/:caseId/draft`
- `POST /api/v1/cases/:caseId/validate`
- `POST /api/v1/cases/:caseId/submit`
- `GET /api/v1/cases/:caseId/acknowledgement`
- `POST /api/v1/cases/:caseId/amend`
- `POST /api/v1/cases/:caseId/resubmit`
- `POST /api/v1/cases/duplicate-check`

## Form Sections

- enterprise details
- project details
- land and building details
- environmental details
- power details
- fire safety details
- industrial safety details
- labour details
- attachments metadata

## Validation Rules

### Draft save

- partial save allowed
- at least `enterprise.legalName` or `project.projectName` required
- warnings stored but do not block save

### Final submit

Required fields include:

- enterprise legal name
- organisation type
- contact email
- contact phone
- district
- project name
- project type
- sector
- investment amount
- employment expected
- project address
- project district
- project taluk
- project pincode
- land area
- power requirement
- employee count
- authorised signatory name
- authorised signatory email

Additional checks:

- PAN format
- GSTIN format
- pincode format
- phone format
- numeric values must be non-negative
- investment amount must be greater than zero
- commercial operation date must be after proposed start date
- required attachments must exist based on calculated approval tracks

## Duplicate Detection Logic

The duplicate service checks:

- `sourceSystem + sourceReferenceId`
- GSTIN
- PAN
- Udyam number
- project name + district
- same-investor active drafts

Blocking duplicate:

- matching `sourceSystem + sourceReferenceId`

Warning duplicate:

- same project name and district
- same GSTIN with similar project address
- same investor draft with similar project name

## Approval Track Rules

Pilot departments:

- pollution
- power
- fire
- industrial_safety
- labour

Examples:

- pollution track when environmental discharge/category criteria are present
- power track when load or transformer information is declared
- fire track when NOC, height, or flammable storage criteria apply
- industrial safety track when machinery, boilers, hazardous process, or workforce thresholds apply
- labour track when labour registration thresholds apply

## Universal Case ID Format

- format: `US360-KA-YYYY-NNNNNN`
- generated only on final submit
- immutable after generation
- backed by counter collection

## Acknowledgement Format

- format: `ACK-US360-KA-YYYY-NNNNNN`
- includes universal case ID, applicant snapshot, task count, attachment count, departments, and checksum placeholder

## Attachment Handling Strategy

- metadata only in MongoDB
- no binary file storage in MongoDB
- S3-compatible `objectKey` placeholder
- document records stored separately in `Document`
- attachment validation runs before final submit

## Event and Audit Behaviour

Domain events:

- `case.draft_created.v1`
- `case.draft_updated.v1`
- `case.validation_requested.v1`
- `case.duplicate_detected.v1`
- `case.submitted.v1`
- `task.created.v1`
- `document.uploaded.v1`
- `acknowledgement.generated.v1`
- `case.amended.v1`
- `case.resubmitted.v1`

Audit actions:

- `case.draft_created`
- `case.draft_updated`
- `case.validated`
- `case.submitted`
- `case.duplicate_detected`
- `case.amended`
- `case.resubmitted`
- `document.uploaded`
- `acknowledgement.generated`

## Transaction Behaviour

Final submission attempts a MongoDB transaction for:

- universal case ID generation
- case state update
- task creation
- event creation
- audit creation
- acknowledgement generation

If transactions are not available in local standalone MongoDB, the service falls back to a best-effort non-transactional path.

## Manual Test Steps

1. Start the web app.
2. Login as an investor.
3. Open `/cases/new`.
4. Save a draft with minimal data.
5. Edit the draft and complete all required sections.
6. Add attachment metadata rows.
7. Validate the draft.
8. Submit the final CAF.
9. Confirm the acknowledgement page and Universal Case ID.
10. Open the case detail page and confirm task/event records exist.
11. Retry the same submit with the same idempotency key and confirm replay protection.
12. Open amendment flow and apply a change.
13. Move a case to an allowed status and test resubmission.
