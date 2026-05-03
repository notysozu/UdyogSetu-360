function validateThreadMessage(input = {}) {
  const errors = [];
  if (!input.body) errors.push('body is required');
  return errors;
}

module.exports = { validateThreadMessage };
