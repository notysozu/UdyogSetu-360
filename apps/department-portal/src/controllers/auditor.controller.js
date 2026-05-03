const viewService = require('../services/department-task-view.service');
const { findAuditEvents } = require('../../../../services/audit-service/src/services/audit.service');

function ctx(req) {
  return { user: req.user, role: req.user?.primaryRole || req.user?.role };
}

async function listAuditTasks(req, res) {
  const tasks = await viewService.getTaskInbox({ ...req.user, primaryRole: 'auditor' }, req.query || {}, {}, ctx(req));
  res.render('auditor/task-list', { title: 'Audit Tasks', tasks });
}

async function showAuditTask(req, res) {
  const [task, documents, timeline, comments, sla] = await Promise.all([
    viewService.getTaskDetail({ ...req.user, primaryRole: 'auditor' }, req.params.taskId, ctx(req)),
    viewService.getTaskDocuments({ ...req.user, primaryRole: 'auditor' }, req.params.taskId, ctx(req)),
    viewService.getTaskTimeline({ ...req.user, primaryRole: 'auditor' }, req.params.taskId, ctx(req)),
    viewService.getTaskComments({ ...req.user, primaryRole: 'auditor' }, req.params.taskId, ctx(req)),
    viewService.getTaskSlaStatus({ ...req.user, primaryRole: 'auditor' }, req.params.taskId, ctx(req))
  ]);
  res.render('auditor/task-detail', { title: task?.title || 'Task Detail', task, documents, timeline, comments, sla });
}

async function showAuditCase(req, res) {
  const data = await viewService.getCaseCoordinationView({ ...req.user, primaryRole: 'auditor' }, req.params.caseId, ctx(req));
  res.render('auditor/case-audit', { title: 'Case Audit Trail', data });
}

async function listAuditEvents(req, res) {
  const events = await findAuditEvents({}, { limit: 100 });
  res.render('auditor/event-list', { title: 'Audit Events', events });
}

async function exportCaseAudit(req, res) {
  const events = await findAuditEvents({ universalCaseId: req.params.caseId }, { limit: 500 });
  res.json({ success: true, data: events });
}

module.exports = {
  listAuditTasks,
  showAuditTask,
  showAuditCase,
  listAuditEvents,
  exportCaseAudit
};
