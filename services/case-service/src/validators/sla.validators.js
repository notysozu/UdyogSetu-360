function validatePauseResume(input = {}) {
  const errors = [];
  if (!input.timerId && !input.id) errors.push('timerId is required');
  return errors;
}

module.exports = { validatePauseResume };
