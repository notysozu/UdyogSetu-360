const test = require('node:test');
const assert = require('node:assert/strict');

const { CASE_STATUSES, TASK_STATUSES, PERMISSIONS } = require('../../../packages/shared/src');
const { getCaseTransition } = require('../src/state-machines/case-state-machine');
const { getTaskTransition } = require('../src/state-machines/task-state-machine');
const {
  assertCaseTransitionAllowed,
  assertTaskTransitionAllowed
} = require('../src/guards/transition-guards');

const baseActor = {
  id: 'user-1',
  primaryRole: 'admin',
  roles: ['admin'],
  permissions: Object.values(PERMISSIONS)
};

test('valid case transitions pass and invalid transitions fail', () => {
  assert.ok(getCaseTransition(CASE_STATUSES.DRAFT, CASE_STATUSES.SUBMITTED));
  assert.equal(getCaseTransition(CASE_STATUSES.DRAFT, CASE_STATUSES.APPROVED), null);
});

test('valid task transitions pass and invalid transitions fail', () => {
  assert.ok(getTaskTransition(TASK_STATUSES.PENDING, TASK_STATUSES.ASSIGNED));
  assert.equal(getTaskTransition(TASK_STATUSES.PENDING, TASK_STATUSES.APPROVED), null);
});

test('closed case cannot transition unless reopened', () => {
  assert.throws(() =>
    assertCaseTransitionAllowed(
      { status: CASE_STATUSES.CLOSED },
      CASE_STATUSES.APPROVED,
      { actor: baseActor }
    )
  );
  assert.doesNotThrow(() =>
    assertCaseTransitionAllowed(
      { status: CASE_STATUSES.CLOSED },
      CASE_STATUSES.REOPENED,
      { actor: baseActor, reason: 'review override' }
    )
  );
});

test('rejection requires reason and approval requires checklist completion', () => {
  assert.throws(() =>
    assertTaskTransitionAllowed(
      { metadata: {} },
      { status: TASK_STATUSES.UNDER_REVIEW, checklist: [] },
      TASK_STATUSES.REJECTED,
      { actor: baseActor }
    )
  );

  assert.throws(() =>
    assertTaskTransitionAllowed(
      { metadata: {} },
      {
        status: TASK_STATUSES.UNDER_REVIEW,
        checklist: [{ code: 'a', label: 'A', required: true, status: 'pending' }],
        queryThread: []
      },
      TASK_STATUSES.APPROVED,
      { actor: baseActor }
    )
  );
});
