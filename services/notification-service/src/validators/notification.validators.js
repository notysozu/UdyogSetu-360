function validateCreateNotificationBody(body = {}) {
  const errors = [];
  if (!body.channel) errors.push('channel is required');
  if (!body.recipientUserId && !body.recipientRole && !body.recipientDepartmentCode) {
    errors.push('recipientUserId or recipientRole or recipientDepartmentCode is required');
  }
  if (!body.templateCode && !body.body) errors.push('body is required when templateCode is missing');
  return errors;
}

module.exports = { validateCreateNotificationBody };
