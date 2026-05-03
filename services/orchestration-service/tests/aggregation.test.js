const test = require('node:test');
const assert = require('node:assert/strict');

const { CASE_STATUSES, TASK_STATUSES } = require('../../../packages/shared/src');
const { deriveAggregateCaseStatus } = require('../src/services/orchestration.service');

function makeTask(status, metadata = {}) {
  return {
    status,
    metadata,
    queryThread: []
  };
}

test('case remains under scrutiny while tasks are pending', () => {
  const status = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.UNDER_SCRUTINY },
    [makeTask(TASK_STATUSES.PENDING), makeTask(TASK_STATUSES.ASSIGNED)]
  );
  assert.equal(status, CASE_STATUSES.UNDER_SCRUTINY);
});

test('any task query raised moves case to query raised', () => {
  const status = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.UNDER_SCRUTINY },
    [makeTask(TASK_STATUSES.QUERY_RAISED), makeTask(TASK_STATUSES.APPROVED)]
  );
  assert.equal(status, CASE_STATUSES.QUERY_RAISED);
});

test('all query responses move case back to under scrutiny', () => {
  const status = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.QUERY_RAISED },
    [makeTask(TASK_STATUSES.RESPONSE_RECEIVED), makeTask(TASK_STATUSES.UNDER_REVIEW)]
  );
  assert.equal(status, CASE_STATUSES.UNDER_SCRUTINY);
});

test('all mandatory tasks approved moves case to approved', () => {
  const status = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.UNDER_SCRUTINY },
    [makeTask(TASK_STATUSES.APPROVED), makeTask(TASK_STATUSES.CERTIFICATE_ISSUED)]
  );
  assert.equal(status, CASE_STATUSES.APPROVED);
});

test('any mandatory task rejected moves case to rejected while optional rejection does not', () => {
  const rejectedStatus = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.UNDER_SCRUTINY },
    [makeTask(TASK_STATUSES.REJECTED), makeTask(TASK_STATUSES.APPROVED)]
  );
  assert.equal(rejectedStatus, CASE_STATUSES.REJECTED);

  const optionalOnly = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.UNDER_SCRUTINY },
    [
      makeTask(TASK_STATUSES.REJECTED, { isMandatory: false }),
      makeTask(TASK_STATUSES.APPROVED),
      makeTask(TASK_STATUSES.APPROVED)
    ]
  );
  assert.equal(optionalOnly, CASE_STATUSES.APPROVED);
});

test('multi-department flow reaches approved and then certificate issued', () => {
  const scrutinyState = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.UNDER_SCRUTINY },
    [
      makeTask(TASK_STATUSES.QUERY_RAISED),
      makeTask(TASK_STATUSES.UNDER_REVIEW),
      makeTask(TASK_STATUSES.UNDER_REVIEW),
      makeTask(TASK_STATUSES.UNDER_REVIEW),
      makeTask(TASK_STATUSES.UNDER_REVIEW)
    ]
  );
  assert.equal(scrutinyState, CASE_STATUSES.QUERY_RAISED);

  const postResponse = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.QUERY_RAISED },
    [
      makeTask(TASK_STATUSES.RESPONSE_RECEIVED),
      makeTask(TASK_STATUSES.INSPECTION_SCHEDULED),
      makeTask(TASK_STATUSES.FEE_DEMANDED),
      makeTask(TASK_STATUSES.APPROVED),
      makeTask(TASK_STATUSES.APPROVED)
    ]
  );
  assert.equal(postResponse, CASE_STATUSES.INSPECTION_SCHEDULED);

  const feeState = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.INSPECTION_COMPLETED },
    [
      makeTask(TASK_STATUSES.APPROVED),
      makeTask(TASK_STATUSES.FEE_DEMANDED),
      makeTask(TASK_STATUSES.APPROVED),
      makeTask(TASK_STATUSES.APPROVED),
      makeTask(TASK_STATUSES.APPROVED)
    ]
  );
  assert.equal(feeState, CASE_STATUSES.FEE_DEMANDED);

  const approvedState = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.FEE_PAID },
    [
      makeTask(TASK_STATUSES.APPROVED),
      makeTask(TASK_STATUSES.APPROVED),
      makeTask(TASK_STATUSES.APPROVED),
      makeTask(TASK_STATUSES.APPROVED),
      makeTask(TASK_STATUSES.APPROVED)
    ]
  );
  assert.equal(approvedState, CASE_STATUSES.APPROVED);

  const certificateState = deriveAggregateCaseStatus(
    { status: CASE_STATUSES.APPROVED },
    [
      makeTask(TASK_STATUSES.CERTIFICATE_ISSUED),
      makeTask(TASK_STATUSES.CERTIFICATE_ISSUED),
      makeTask(TASK_STATUSES.CERTIFICATE_ISSUED),
      makeTask(TASK_STATUSES.CERTIFICATE_ISSUED),
      makeTask(TASK_STATUSES.CERTIFICATE_ISSUED)
    ]
  );
  assert.equal(certificateState, CASE_STATUSES.CERTIFICATE_ISSUED);
});
