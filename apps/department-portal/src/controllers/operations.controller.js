const diagnosticsService = require('../../../../apps/gateway/src/diagnostics/diagnostics.service');
const replayService = require('../../../../services/orchestration-service/src/replay/replay.service');
const stuckCaseService = require('../../../../services/orchestration-service/src/stuck-case/stuck-case-detector.service');
const auditService = require('../../../../services/audit-service/src/services/audit.service');

function ensureOpsRole(req) {
  const role = req.user?.primaryRole || req.user?.role;
  if (!['admin', 'auditor'].includes(role)) {
    const error = new Error('Access denied');
    error.status = 403;
    throw error;
  }
}

function ctx(req) {
  return {
    correlationId: req.correlationId || req.context?.correlationId || null,
    userId: req.user?.id || req.user?._id || null,
    role: req.user?.primaryRole || req.user?.role || null,
    actor: {
      actorType: 'user',
      actorId: req.user?.id || req.user?._id || null,
      role: req.user?.primaryRole || req.user?.role || null,
      serviceName: 'department-portal'
    }
  };
}

async function dashboard(req, res) {
  ensureOpsRole(req);
  const [health, queues, consumers, stuck, replay] = await Promise.all([
    diagnosticsService.getServiceHealth(),
    diagnosticsService.getQueueBacklog(),
    diagnosticsService.getConsumerLagOrSlowConsumers(),
    diagnosticsService.listStuckCases({}, { page: 1, limit: 10 }),
    diagnosticsService.listReplayAttempts({}, { page: 1, limit: 10 })
  ]);
  res.render('operations/dashboard', { title: 'Operations Console', health, queues, consumers, stuck, replay });
}

async function health(req, res) {
  ensureOpsRole(req);
  res.render('operations/health', { title: 'Service Health', health: await diagnosticsService.getServiceHealth() });
}

async function queues(req, res) {
  ensureOpsRole(req);
  res.render('operations/queues', { title: 'Queue Backlog', data: await diagnosticsService.getQueueBacklog() });
}

async function adapters(req, res) {
  ensureOpsRole(req);
  res.render('operations/adapters', { title: 'Adapter Health', data: await diagnosticsService.getAdapterStatus() });
}

async function consumers(req, res) {
  ensureOpsRole(req);
  res.render('operations/consumers', { title: 'Slow Consumers', data: await diagnosticsService.getConsumerLagOrSlowConsumers() });
}

async function stuckCases(req, res) {
  ensureOpsRole(req);
  const data = await diagnosticsService.listStuckCases({}, req.query || {});
  res.render('operations/stuck-cases', { title: 'Stuck Cases', data });
}

async function stuckCaseDetail(req, res) {
  ensureOpsRole(req);
  const finding = await diagnosticsService.getStuckCase(req.params.findingId);
  if (!finding) {
    const error = new Error('Finding not found');
    error.status = 404;
    throw error;
  }
  res.render('operations/stuck-case-detail', { title: 'Stuck Case Detail', finding });
}

async function acknowledgeStuckCase(req, res) {
  ensureOpsRole(req);
  if ((req.user?.primaryRole || req.user?.role) !== 'admin') return res.status(403).render('errors/403', { title: 'Forbidden' });
  await stuckCaseService.acknowledgeFinding(req.params.findingId, ctx(req));
  await auditService.recordAuditEvent({
    actor: ctx(req).actor,
    action: 'stuck_case.acknowledged',
    resourceType: 'stuck_case_finding',
    resourceId: req.params.findingId,
    correlationId: ctx(req).correlationId
  }, ctx(req));
  req.flash('success', 'Stuck case acknowledged.');
  res.redirect(`/admin/operations/stuck-cases/${req.params.findingId}`);
}

async function resolveStuckCase(req, res) {
  ensureOpsRole(req);
  if ((req.user?.primaryRole || req.user?.role) !== 'admin') return res.status(403).render('errors/403', { title: 'Forbidden' });
  await stuckCaseService.resolveFinding(req.params.findingId, req.body.reason, ctx(req));
  await auditService.recordAuditEvent({
    actor: ctx(req).actor,
    action: 'stuck_case.resolved',
    resourceType: 'stuck_case_finding',
    resourceId: req.params.findingId,
    reason: req.body.reason,
    correlationId: ctx(req).correlationId
  }, ctx(req));
  req.flash('success', 'Stuck case resolved.');
  res.redirect(`/admin/operations/stuck-cases/${req.params.findingId}`);
}

async function replayList(req, res) {
  ensureOpsRole(req);
  const data = await replayService.listReplayAttempts({}, req.query || {});
  res.render('operations/replay-list', { title: 'Replay Attempts', data });
}

async function replayDetail(req, res) {
  ensureOpsRole(req);
  const attempt = await replayService.getReplayAttempt(req.params.replayId);
  if (!attempt) {
    const error = new Error('Replay attempt not found');
    error.status = 404;
    throw error;
  }
  res.render('operations/replay-detail', { title: 'Replay Attempt', attempt });
}

async function replayForm(req, res) {
  ensureOpsRole(req);
  res.render('operations/replay-form', { title: 'Start Replay' });
}

async function replayStart(req, res) {
  ensureOpsRole(req);
  if ((req.user?.primaryRole || req.user?.role) !== 'admin') return res.status(403).render('errors/403', { title: 'Forbidden' });
  const attempt = await replayService.createReplayAttempt({
    reason: req.body.reason,
    mode: req.body.mode,
    dryRun: req.body.dryRun !== 'false',
    filter: req.body.universalCaseId ? { universalCaseId: req.body.universalCaseId } : {}
  }, ctx(req));
  await replayService.runReplay(attempt.replayId, ctx(req));
  req.flash('success', `Replay ${attempt.replayId} started.`);
  res.redirect(`/admin/operations/replay/${attempt.replayId}`);
}

async function caseTrace(req, res) {
  ensureOpsRole(req);
  const data = await diagnosticsService.getCaseTraceHistory(req.params.caseId);
  res.render('operations/case-trace', { title: 'Case Trace', data });
}

async function correlationTrace(req, res) {
  ensureOpsRole(req);
  const data = await diagnosticsService.getCorrelationTrace(req.params.correlationId);
  res.render('operations/correlation-trace', { title: 'Correlation Trace', data });
}

module.exports = {
  dashboard,
  health,
  queues,
  adapters,
  consumers,
  stuckCases,
  stuckCaseDetail,
  acknowledgeStuckCase,
  resolveStuckCase,
  replayList,
  replayDetail,
  replayForm,
  replayStart,
  caseTrace,
  correlationTrace
};
