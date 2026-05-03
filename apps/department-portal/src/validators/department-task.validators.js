const mongoose = require('mongoose');

function assert(condition, message, status = 400) {
  if (!condition) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
}

function validateObjectId(value, fieldName) {
  assert(mongoose.Types.ObjectId.isValid(value) || String(value).startsWith('mock-'), `${fieldName} must be a valid identifier.`);
  return value;
}

function taskFilterSchema(input = {}) {
  return {
    status: input.status || '',
    priority: input.priority || '',
    departmentCode: input.departmentCode || ''
  };
}

function checklistUpdateSchema(input = {}) {
  assert(input.itemCode, 'itemCode is required.');
  assert(['pending', 'satisfied', 'not_satisfied', 'needs_clarification', 'not_applicable'].includes(input.status), 'Invalid checklist status.');
  return input;
}

function documentReviewSchema(input = {}) {
  assert(['verify', 'reject'].includes(input.decision), 'decision must be verify or reject.');
  if (input.decision === 'reject') assert(input.reason, 'reason is required for reject.');
  return input;
}

function raiseQuerySchema(input = {}) {
  assert(input.subject, 'subject is required.');
  assert(input.message, 'message is required.');
  return input;
}

function scheduleInspectionSchema(input = {}) {
  assert(input.inspectionType, 'inspectionType is required.');
  assert(input.location, 'location is required.');
  assert(input.scheduledAt, 'scheduledAt is required.');
  return input;
}

function completeInspectionSchema(input = {}) {
  assert(['passed', 'failed', 'conditional', 'reschedule_required'].includes(input.result), 'Invalid inspection result.');
  assert(input.completedAt || input.result, 'completedAt is required.');
  return input;
}

function feeDemandSchema(input = {}) {
  assert(input.feeType, 'feeType is required.');
  assert(Number(input.amount) >= 0, 'amount must be non-negative.');
  assert(Number(input.totalAmount || input.amount) >= Number(input.amount), 'totalAmount must be greater than or equal to amount.');
  assert(input.dueAt, 'dueAt is required.');
  return input;
}

function approvalSchema(input = {}) {
  assert(input.decisionReason, 'decisionReason is required.');
  return input;
}

function rejectionSchema(input = {}) {
  assert(input.rejectionReason, 'rejectionReason is required.');
  return input;
}

function returnTaskSchema(input = {}) {
  assert(input.reason, 'reason is required.');
  return input;
}

function certificateIssueSchema(input = {}) {
  assert(input.certificateType, 'certificateType is required.');
  assert(input.certificateNumber || input.generateCertificatePlaceholder, 'certificateNumber required unless generated.');
  return input;
}

function commentSchema(input = {}) {
  assert(input.body, 'comment body is required.');
  return input;
}

function assignTaskSchema(input = {}) {
  assert(input.officerId, 'officerId is required.');
  return input;
}

function escalationSchema(input = {}) {
  assert(input.reason || input.overrideReason, 'reason is required.');
  return input;
}

module.exports = {
  validateObjectId,
  taskFilterSchema,
  checklistUpdateSchema,
  documentReviewSchema,
  raiseQuerySchema,
  scheduleInspectionSchema,
  completeInspectionSchema,
  feeDemandSchema,
  approvalSchema,
  rejectionSchema,
  returnTaskSchema,
  certificateIssueSchema,
  commentSchema,
  assignTaskSchema,
  escalationSchema
};
