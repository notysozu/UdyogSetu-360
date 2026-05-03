const { DEPARTMENT_CODE_VALUES } = require('../../../../packages/shared/src');

function validateGrievanceCreate(input = {}) {
  const errors = [];
  if (!input.category) errors.push('category is required');
  if (!input.subject) errors.push('subject is required');
  if (!input.description) errors.push('description is required');
  if (input.priority && !['low', 'normal', 'high', 'urgent'].includes(input.priority)) {
    errors.push('priority is invalid');
  }
  if (input.departmentCode && !DEPARTMENT_CODE_VALUES.includes(input.departmentCode)) {
    errors.push('departmentCode is invalid');
  }
  return errors;
}

function validateMessageInput(input = {}) {
  const errors = [];
  if (!input.body) errors.push('body is required');
  if (input.visibility && !['internal', 'investor_visible', 'department_visible', 'nodal_visible', 'audit_only'].includes(input.visibility)) {
    errors.push('visibility is invalid');
  }
  return errors;
}

function validateStatusChange(input = {}) {
  const errors = [];
  if (!input.nextStatus) errors.push('nextStatus is required');
  if (['rejected', 'resolved', 'closed', 'reopened'].includes(input.nextStatus) && !input.reason) {
    errors.push('reason is required');
  }
  if (input.nextStatus === 'closed' && !input.closureReason) errors.push('closureReason is required');
  if (input.nextStatus === 'resolved' && !input.resolutionSummary) errors.push('resolutionSummary is required');
  return errors;
}

module.exports = {
  validateGrievanceCreate,
  validateMessageInput,
  validateStatusChange
};
