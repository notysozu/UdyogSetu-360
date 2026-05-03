function validateSlaPause(input = {}) {
  const errors = [];
  if (!String(input.reason || '').trim()) errors.push('reason is required');
  return errors;
}

module.exports = {
  validateSlaPause
};
