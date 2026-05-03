# End-To-End Test Plan

Each journey must capture preconditions, test data, steps, expected result, expected events, expected audit entries, negative cases and cleanup notes.

## 1. Investor CAF Submission Journey
Preconditions: investor user exists, departments seeded, document storage reachable, AI service optional.
Test data: investor demo user, CAF project requiring pollution, power, fire, industrial safety and labour tracks.
Steps: login as investor; open CAF; save draft; upload documents; validate; submit final CAF.
Expected result: universal case ID generated, acknowledgement created, approval tracks and department tasks created, investor timeline updated.
Events expected: `case.draft_saved.v1`, `document.uploaded.v1`, `case.submitted.v1`, `task.created.v1`.
Audit entries expected: CAF draft save, document upload, final submit and task creation.
Negative cases: missing required document, duplicate submit with same idempotency key, invalid file type, unauthorised user.
Cleanup notes: delete demo case only in non-production or mark test case source.

## 2. Southbound Department Dispatch
Preconditions: submitted case exists, adapter configs enabled, RabbitMQ reachable.
Test data: submitted manufacturing case with five pilot department tracks.
Steps: submit case; run routing; create delivery jobs; run adapter worker; mock department returns acknowledgement.
Expected result: delivery job completed, external reference captured, timeline updated.
Events expected: `department.delivery_requested.v1`, `department.acknowledged.v1`, `integration.delivery_completed.v1`.
Audit entries expected: dispatch requested, acknowledgement captured.
Negative cases: adapter timeout, invalid mapping, RabbitMQ unavailable, duplicate delivery.
Cleanup notes: purge test delivery queues after assertions.

## 3. Northbound Callback Journey
Preconditions: external reference exists, webhook secret configured.
Test data: department callback payload with valid signature.
Steps: send callback; verify webhook; normalise callback; forward to orchestration; recalculate case status.
Expected result: task updated through orchestration and investor timeline reflects status.
Events expected: `department.callback_received.v1`, `task.status_changed.v1`, `case.status_recalculated.v1`.
Audit entries expected: callback accepted, task transition.
Negative cases: bad signature, unknown reference, duplicate callback, unsupported status.
Cleanup notes: keep processed-event idempotency record for duplicate tests.

## 4. Query And Response Journey
Preconditions: department officer and investor users exist, task is under review.
Test data: pollution task and response document.
Steps: officer raises query; investor receives notification; investor uploads response; document metadata stored; task resumes review.
Expected result: query visible to investor, response document version created, SLA pause/resume checked.
Events expected: `task.query_raised.v1`, `notification.created.v1`, `document.uploaded.v1`, `task.response_received.v1`.
Audit entries expected: query raised, response uploaded, SLA pause/resume.
Negative cases: empty query message, investor uploads wrong document type, unauthorised officer.
Cleanup notes: mark query thread test-owned.

## 5. Inspection Journey
Preconditions: fire task exists and inspection permission assigned.
Test data: inspection schedule and completion report.
Steps: officer schedules inspection; investor views schedule; officer completes inspection.
Expected result: inspection stored, task status updated and timeline/audit updated.
Events expected: `inspection.scheduled.v1`, `inspection.completed.v1`, `task.status_changed.v1`.
Audit entries expected: inspection scheduled and completed.
Negative cases: past inspection date without override, missing location, auditor attempts mutation.
Cleanup notes: delete only generated report object in non-production.

## 6. Fee Journey
Preconditions: power task exists and fee permission assigned.
Test data: fee demand and controlled payment stub.
Steps: officer creates fee demand; investor sees fee; controlled stub marks paid.
Expected result: fee status moves demanded to paid, task dependency cleared.
Events expected: `fee.demanded.v1`, `fee.paid.v1`, `task.status_changed.v1`.
Audit entries expected: fee demanded and payment status recorded.
Negative cases: negative amount, total less than base amount, duplicate payment callback.
Cleanup notes: retain payment stub reference for reconciliation.

## 7. Approval And Certificate Journey
Preconditions: mandatory tasks ready for approval, required checklist satisfied.
Test data: approved tasks and certificate payload.
Steps: approve all mandatory tasks; recalculate case; issue certificate; verify public token.
Expected result: case approved, certificate document stored, public verification succeeds safely.
Events expected: `task.approved.v1`, `case.approved.v1`, `certificate.issued.v1`.
Audit entries expected: approvals, certificate issue, public verification attempt.
Negative cases: incomplete checklist, unpaid fee, invalid verification token.
Cleanup notes: keep certificate for public verification tests.

## 8. Grievance Journey
Preconditions: case exists, grievance module enabled.
Test data: investor grievance, internal comment and external reply.
Steps: investor raises grievance; department acknowledges; internal comment added; external reply added; grievance resolved and closed.
Expected result: grievance history visible to authorised users.
Events expected: `grievance.created.v1`, `grievance.acknowledged.v1`, `comment.created.v1`, `grievance.resolved.v1`, `grievance.closed.v1`.
Audit entries expected: grievance create, comment, resolution and closure.
Negative cases: investor accesses another case, internal note visible to investor, missing closure reason.
Cleanup notes: mark grievance category `e2e`.

## 9. SLA Escalation Journey
Preconditions: SLA monitor enabled.
Test data: overdue task and overdue grievance.
Steps: create overdue entity; run SLA monitor; assert warning, breach and escalation.
Expected result: nodal dashboard shows ageing and notifications are queued.
Events expected: `sla.warning.v1`, `sla.breached.v1`, `sla.escalated.v1`, `notification.created.v1`.
Audit entries expected: SLA warning, breach and escalation.
Negative cases: paused SLA, completed task, duplicate escalation.
Cleanup notes: reset scheduled-job state in test database.

## 10. Audit And Operations Journey
Preconditions: admin user exists, operations console enabled.
Test data: case with events, replayable dry-run event and stuck-case fixture.
Steps: open operations; view health/queues/adapters; run stuck scan; open trace; dry-run replay; export audit; verify hash chain.
Expected result: all privileged actions produce audit events and no replay mutation occurs in dry-run.
Events expected: `operations.stuck_scan_requested.v1`, `operations.replay_dry_run.v1`, `audit.export_requested.v1`.
Audit entries expected: stuck scan, trace view if configured, replay dry-run, export, hash verification.
Negative cases: missing reason, non-admin access, production replay without confirmation.
Cleanup notes: expire test export artefacts.

## 11. Public Dashboard And Verification Journey
Preconditions: public portal enabled, metrics projections seeded.
Test data: aggregate metrics and certificate verification record.
Steps: load dashboard; verify no PII; submit valid certificate verification; submit invalid verification.
Expected result: aggregate metrics only, safe valid/invalid verification responses.
Events expected: `public.metrics_viewed.v1` optional, `certificate.verification_attempted.v1`.
Audit entries expected: verification attempt where configured.
Negative cases: low group size, invalid token, brute force rate limit.
Cleanup notes: reset verification attempt counters.

## 12. AI Advisory Journey
Preconditions: Node services running; AI service available for success path and disabled/unreachable for fallback path.
Test data: CAF requiring five departments and advisory SLA-risk payload.
Steps: call completeness/routing; call SLA risk/next-best-action; disable AI service; repeat calls.
Expected result: recommendations include confidence, explainability and uncertainty; fallback works; no case state mutates.
Events expected: none required unless Node records advisory request events.
Audit entries expected: none for routine advisory calls; human override or privileged use must be audited by Node.
Negative cases: AI timeout, low confidence, malformed AI payload.
Cleanup notes: remove local advisory feedback JSONL only in dev.
