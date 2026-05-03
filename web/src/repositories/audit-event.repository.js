const { audit } = require('../services/auditLogService');

function append(event, session = null) {
  void session;
  return audit(
    event.action,
    event.resourceType,
    event.resourceId,
    event.context || {},
    {
      caseId: event.caseId,
      universalCaseId: event.universalCaseId,
      metadata: event.metadata,
      before: event.before,
      after: event.after
    }
  );
}

module.exports = { append };
