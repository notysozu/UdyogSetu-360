function validateThreadCreate(input = {}) {
  const errors = [];
  if (!String(input.threadType || '').trim()) errors.push('threadType is required');
  if (!String(input.resourceType || '').trim()) errors.push('resourceType is required');
  if (!String(input.resourceId || '').trim()) errors.push('resourceId is required');
  return errors;
}

function validateMessage(input = {}) {
  const errors = [];
  if (!String(input.body || '').trim()) errors.push('body is required');
  if (input.visibility && !['internal', 'investor_visible', 'department_visible', 'nodal_visible', 'audit_only'].includes(input.visibility)) {
    errors.push('visibility is invalid');
  }
  return errors;
}

module.exports = {
  validateThreadCreate,
  validateMessage
};
