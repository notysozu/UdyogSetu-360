const { randomUUID } = require('crypto');
const Case = require('../../../case-service/src/models/Case');
const ApprovalTask = require('../../../case-service/src/models/ApprovalTask');
const StuckCaseFinding = require('./StuckCaseFinding');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

const NO_ACTIVITY_HOURS = Number(process.env.STUCK_CASE_NO_ACTIVITY_HOURS || 48);
const MIN_AGE_HOURS = Number(process.env.STUCK_CASE_MIN_AGE_HOURS || 6);

function hoursAgo(date) {
  return (Date.now() - new Date(date).getTime()) / 3600000;
}

function buildFinding(caseDoc, findingType, severity, description, evidence = {}) {
  return {
    findingId: `${findingType}:${caseDoc.universalCaseId || caseDoc.caseId}`,
    universalCaseId: caseDoc.universalCaseId || null,
    caseId: caseDoc.caseId || null,
    departmentCode: caseDoc.departmentCode || null,
    findingType,
    severity,
    title: findingType.replaceAll('_', ' '),
    description,
    detectedAt: new Date(),
    lastSeenAt: new Date(),
    recommendedAction: 'Review case progression and trigger manual intervention if required.',
    evidence
  };
}

function detectNoActivity(caseDoc) {
  if (!caseDoc.updatedAt) return null;
  if (hoursAgo(caseDoc.createdAt) < MIN_AGE_HOURS) return null;
  if (hoursAgo(caseDoc.updatedAt) < NO_ACTIVITY_HOURS) return null;
  return buildFinding(caseDoc, 'no_activity', 'high', 'Case has no activity beyond threshold.', { updatedAt: caseDoc.updatedAt });
}

function detectMissingTasks(caseDoc, tasks) {
  if ((caseDoc.status || '').toLowerCase() === 'submitted' && (!tasks || tasks.length === 0)) {
    return buildFinding(caseDoc, 'missing_tasks', 'critical', 'Case submitted but no tasks were created.');
  }
  return null;
}

function detectStatusMismatch(caseDoc, tasks = []) {
  const allApproved = tasks.length > 0 && tasks.every((task) => ['approved', 'certificate_issued', 'closed'].includes(task.status));
  if (allApproved && !['approved', 'closed'].includes(caseDoc.status)) {
    return buildFinding(caseDoc, 'aggregate_status_mismatch', 'high', 'All tasks approved but case status not approved.', {
      caseStatus: caseDoc.status
    });
  }
  return null;
}

function detectOverdueTasks(caseDoc, tasks = []) {
  const overdue = tasks.find((task) => task.dueAt && new Date(task.dueAt) < new Date() && !['approved', 'rejected', 'closed'].includes(task.status));
  if (!overdue) return null;
  return buildFinding(caseDoc, 'overdue_task', 'medium', 'At least one task is overdue.', {
    taskId: overdue.taskId || overdue._id,
    dueAt: overdue.dueAt,
    status: overdue.status
  });
}

async function upsertFinding(finding, context = {}) {
  const updated = await StuckCaseFinding.findOneAndUpdate(
    { findingId: finding.findingId },
    { $set: { ...finding, lastSeenAt: new Date(), status: 'open', correlationId: context.correlationId || null } },
    { upsert: true, new: true }
  );
  return updated;
}

async function scanCase(caseDoc, context = {}) {
  const tasks = await ApprovalTask.find({ universalCaseId: caseDoc.universalCaseId }).lean().catch(() => []);
  const candidates = [
    detectNoActivity(caseDoc),
    detectMissingTasks(caseDoc, tasks),
    detectOverdueTasks(caseDoc, tasks),
    detectStatusMismatch(caseDoc, tasks)
  ].filter(Boolean);
  const findings = [];
  for (const finding of candidates) findings.push(await upsertFinding(finding, context));
  return findings;
}

async function scanForStuckCases(context = {}) {
  const cases = await Case.find({ isDeleted: { $ne: true } }).sort({ updatedAt: -1 }).limit(500).lean().catch(() => []);
  const findings = [];
  for (const caseDoc of cases) {
    const entries = await scanCase(caseDoc, context);
    findings.push(...entries);
  }
  return { scannedCases: cases.length, findings };
}

function resolveFinding(findingId, reason, context = {}) {
  return StuckCaseFinding.findOneAndUpdate(
    { findingId },
    { $set: { status: 'resolved', resolvedAt: new Date(), resolutionReason: reason || null, correlationId: context.correlationId || null } },
    { new: true }
  );
}

function acknowledgeFinding(findingId, context = {}) {
  return StuckCaseFinding.findOneAndUpdate(
    { findingId },
    { $set: { status: 'acknowledged', correlationId: context.correlationId || null } },
    { new: true }
  );
}

async function auditAdminScan(context = {}) {
  if (!context.manualTrigger) return;
  await recordAuditEvent({
    actor: context.actor || { actorType: 'user', actorId: context.userId || null, role: context.role || null },
    action: 'diagnostics.stuck_case_scan_run',
    resourceType: 'stuck_case_scan',
    resourceId: randomUUID(),
    correlationId: context.correlationId || null
  }, context).catch(() => {});
}

module.exports = {
  scanForStuckCases,
  scanCase,
  detectMissingTasks,
  detectNoActivity,
  detectOverdueTasks,
  detectStatusMismatch,
  detectOutboxStuck: async () => [],
  detectQueueDeadLetters: async () => [],
  upsertFinding,
  resolveFinding,
  acknowledgeFinding,
  auditAdminScan
};
