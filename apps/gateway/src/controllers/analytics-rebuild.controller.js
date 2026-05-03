const projectionService = require('../../../../services/case-service/src/services/analytics-projection.service');
const { sendAccepted, sendSuccess } = require('../utils/api-response');
const { recordAuditEvent } = require('../../../../services/audit-service/src/services/audit.service');

function rebuildContext(req) {
  const actor = req.user || {};
  return {
    user: actor,
    userId: actor.id,
    role: actor.primaryRole || actor.role,
    departmentCode: actor.departmentCode || null,
    correlationId: req.context?.correlationId || req.correlationId,
    requestId: req.context?.requestId || req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent')
  };
}

async function rebuildAnalytics(req, res) {
  const ctx = rebuildContext(req);
  const { projectionName, fromDate, toDate, reason, dryRun } = req.body || {};
  await recordAuditEvent({
    actor: { actorType: 'user', actorId: ctx.userId || null, role: ctx.role || null },
    action: 'analytics.rebuild_requested',
    resourceType: 'analytics_projection',
    resourceId: projectionName || 'all',
    correlationId: ctx.correlationId || null,
    reason,
    metadata: { projectionName: projectionName || null, fromDate, toDate, dryRun: Boolean(dryRun) }
  }, ctx).catch(() => {});

  if (dryRun) {
    return sendAccepted(res, { dryRun: true, projectionName: projectionName || 'all' });
  }

  try {
    const result = projectionName
      ? await projectionService.rebuildProjection(projectionName, { fromDate, toDate }, ctx)
      : await projectionService.rebuildAllProjections({ fromDate, toDate }, ctx);
    await recordAuditEvent({
      actor: { actorType: 'user', actorId: ctx.userId || null, role: ctx.role || null },
      action: 'analytics.rebuild_completed',
      resourceType: 'analytics_projection',
      resourceId: projectionName || 'all',
      correlationId: ctx.correlationId || null,
      metadata: { result }
    }, ctx).catch(() => {});
    return sendSuccess(res, { ok: true, result });
  } catch (error) {
    await recordAuditEvent({
      actor: { actorType: 'user', actorId: ctx.userId || null, role: ctx.role || null },
      action: 'analytics.rebuild_failed',
      resourceType: 'analytics_projection',
      resourceId: projectionName || 'all',
      correlationId: ctx.correlationId || null,
      outcome: 'failure',
      metadata: { message: error.message }
    }, ctx).catch(() => {});
    throw error;
  }
}

module.exports = { rebuildAnalytics };
