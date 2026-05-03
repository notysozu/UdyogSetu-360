const { randomUUID } = require('crypto');
const { recordAuditEvent } = require('../../../services/audit-service/src/services/audit.service');

function toAuditActor(user) {
  if (!user) {
    return {
      actorType: 'anonymous',
      actorId: 'anonymous',
      role: 'anonymous',
      displayName: 'Anonymous'
    };
  }
  return {
    actorType: 'user',
    actorId: String(user.id || user._id),
    role: user.primaryRole || user.role,
    displayName: user.name || user.email || 'User'
  };
}

async function audit(action, resourceType, resourceId, context = {}, extra = {}) {
  return recordAuditEvent(
    {
      eventId: randomUUID(),
      actor: toAuditActor(context.user),
      action,
      resourceType,
      resourceId: String(resourceId || 'unknown'),
      caseId: extra.caseId || null,
      universalCaseId: extra.universalCaseId || null,
      correlationId: context.correlationId || null,
      requestId: context.requestId || null,
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
      metadata: extra.metadata || {},
      before: extra.before || null,
      after: extra.after || null
    },
    context
  );
}

module.exports = { audit };
