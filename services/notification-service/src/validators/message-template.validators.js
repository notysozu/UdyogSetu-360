function validateTemplateInput(input = {}) {
  const errors = [];
  if (!String(input.templateCode || '').trim()) errors.push('templateCode is required');
  if (!String(input.channel || '').trim()) errors.push('channel is required');
  if (!String(input.locale || '').trim()) errors.push('locale is required');
  if (!String(input.bodyTemplate || '').trim() && !String(input.smsTemplate || '').trim()) errors.push('bodyTemplate or smsTemplate is required');
  return errors;
}

module.exports = {
  validateTemplateInput
};
