const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../src/models/User');
const Case = require('../src/models/Case');
const ApprovalTask = require('../src/models/ApprovalTask');
const AuditEvent = require('../../audit-service/src/models/AuditEvent');
const DomainEvent = require('../src/models/DomainEvent');
const SlaTimer = require('../src/models/SlaTimer');
const { generateUniversalCaseId } = require('../../../packages/shared/src/utils/caseId');

test('User schema has partial unique email index', () => {
  const indexes = User.schema.indexes();
  const emailIndex = indexes.find(([fields]) => fields.email === 1);
  assert.ok(emailIndex);
  assert.equal(emailIndex[1].unique, true);
  assert.equal(emailIndex[1].partialFilterExpression.isDeleted, false);
});

test('Universal case IDs are unique across calls', () => {
  assert.notEqual(generateUniversalCaseId(), generateUniversalCaseId());
});

test('Case schema requires submittedAt once status is beyond draft', async () => {
  const doc = new Case({
    universalCaseId: 'US360-TEST-CASE-01',
    organisationId: '507f1f77bcf86cd799439011',
    applicantUserId: '507f1f77bcf86cd799439012',
    caseType: 'common_application',
    title: 'Test Case',
    status: 'submitted',
    requiredDepartments: [{ departmentCode: 'pollution', isMandatory: true }]
  });

  await assert.rejects(() => doc.validate(), /submittedAt is required/);
});

test('ApprovalTask schema supports department task creation for five departments', () => {
  const departmentCodes = ['pollution', 'power', 'fire', 'industrial_safety', 'labour'];
  const docs = departmentCodes.map((departmentCode) => new ApprovalTask({
    caseId: '507f1f77bcf86cd799439013',
    universalCaseId: 'US360-TEST-CASE-02',
    departmentCode,
    title: `${departmentCode} task`,
    dueAt: new Date()
  }));

  assert.equal(docs.length, 5);
});

test('AuditEvent schema is append-only oriented', () => {
  assert.equal(AuditEvent.schema.options.timestamps.updatedAt, false);
});

test('DomainEvent schema supports outbox publish indexes', () => {
  const indexes = DomainEvent.schema.indexes();
  assert.ok(indexes.some(([fields]) => fields.publishStatus === 1 && fields.nextPublishAt === 1));
});

test('SlaTimer due date must be after start date', async () => {
  const doc = new SlaTimer({
    caseId: '507f1f77bcf86cd799439013',
    timerType: 'case',
    startsAt: new Date('2026-01-02T00:00:00Z'),
    dueAt: new Date('2026-01-01T00:00:00Z')
  });

  await assert.rejects(() => doc.validate(), /dueAt must be after startsAt/);
});

test('Soft delete helper exists on operational schemas', () => {
  assert.equal(typeof User.softDeleteById, 'function');
  assert.equal(typeof User.find().active, 'function');
});
