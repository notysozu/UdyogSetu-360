const test = require('node:test');
const assert = require('node:assert/strict');

const { TASK_STATUSES } = require('../../../packages/shared/src');
const { getBlockingDependencies } = require('../src/guards/dependency-guards');

test('dependency sequencing blocks invalid fee, inspection, and certificate transitions', () => {
  const caseDoc = { metadata: { documents: [] } };

  const feeBlocks = getBlockingDependencies(caseDoc, { departmentCode: 'power', status: TASK_STATUSES.UNDER_REVIEW }, TASK_STATUSES.FEE_PAID);
  assert.ok(feeBlocks.some((dependency) => dependency.key === 'fee_paid_requires_fee_demand'));

  const inspectionBlocks = getBlockingDependencies(caseDoc, { departmentCode: 'fire', status: TASK_STATUSES.INSPECTION_REQUIRED }, TASK_STATUSES.INSPECTION_COMPLETED);
  assert.ok(
    inspectionBlocks.some((dependency) => dependency.key === 'inspection_completed_requires_schedule')
  );

  const certificateBlocks = getBlockingDependencies(
    { status: 'under_scrutiny', metadata: { documents: [{ documentType: 'layout_plan' }] } },
    { departmentCode: 'fire', status: TASK_STATUSES.UNDER_REVIEW },
    TASK_STATUSES.CERTIFICATE_ISSUED
  );
  assert.ok(certificateBlocks.some((dependency) => dependency.key === 'certificate_requires_approval'));
});

test.todo('SLA starts, pauses, resumes, warns, breaches, and completes with persistence-backed timers');
test.todo('ProcessedEvent records enforce replay-safe handlers without duplicating side effects');
