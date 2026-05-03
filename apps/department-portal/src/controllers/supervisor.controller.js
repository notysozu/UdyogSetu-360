const viewService = require('../services/department-task-view.service');
const workflowService = require('../services/supervisor-workflow.service');
const validators = require('../validators/department-task.validators');

function ctx(req) {
  return {
    user: req.user,
    role: req.user?.primaryRole || req.user?.role,
    departmentCode: req.user?.departmentCode || null,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    overrideReason: req.body.overrideReason || null
  };
}

async function listSupervisorTasks(req, res) {
  const tasks = await viewService.getTaskInbox(req.user, req.query || {}, {}, ctx(req));
  res.render('supervisor/task-list', { title: 'Supervisor Tasks', tasks });
}

async function showSupervisorTask(req, res) {
  const [task, documents, timeline, comments, sla] = await Promise.all([
    viewService.getTaskDetail(req.user, req.params.taskId, ctx(req)),
    viewService.getTaskDocuments(req.user, req.params.taskId, ctx(req)),
    viewService.getTaskTimeline(req.user, req.params.taskId, ctx(req)),
    viewService.getTaskComments(req.user, req.params.taskId, ctx(req)),
    viewService.getTaskSlaStatus(req.user, req.params.taskId, ctx(req))
  ]);
  res.render('supervisor/task-detail', { title: task?.title || 'Task Detail', task, documents, timeline, comments, sla });
}

async function assignTask(req, res) {
  const input = validators.assignTaskSchema(req.body || {});
  await workflowService.assignTask(req.params.taskId, input.officerId, ctx(req));
  req.flash('success', 'Task assigned.');
  res.redirect(`/supervisor/tasks/${req.params.taskId}`);
}

async function reassignTask(req, res) {
  const input = validators.assignTaskSchema(req.body || {});
  await workflowService.reassignTask(req.params.taskId, input.officerId, req.body.reason, ctx(req));
  req.flash('success', 'Task reassigned.');
  res.redirect(`/supervisor/tasks/${req.params.taskId}`);
}

async function escalateTask(req, res) {
  const input = validators.escalationSchema(req.body || {});
  await workflowService.escalateTask(req.params.taskId, input.reason, ctx(req));
  req.flash('success', 'Escalation raised.');
  res.redirect(`/supervisor/tasks/${req.params.taskId}`);
}

async function showWorkload(req, res) {
  const [workload, officers] = await Promise.all([
    workflowService.getDepartmentWorkload(req.user, ctx(req)),
    workflowService.getOfficerWorkload(req.user, ctx(req))
  ]);
  res.render('supervisor/workload', { title: 'Department Workload', workload, officers });
}

async function showSlaDashboard(req, res) {
  const tasks = await viewService.getTaskInbox(req.user, {}, {}, ctx(req));
  res.render('supervisor/sla-dashboard', { title: 'SLA Dashboard', tasks });
}

async function showOfficers(req, res) {
  const officers = await workflowService.getOfficerWorkload(req.user, ctx(req));
  res.render('supervisor/officers', { title: 'Officer Workload', officers });
}

module.exports = {
  listSupervisorTasks,
  showSupervisorTask,
  assignTask,
  reassignTask,
  escalateTask,
  showWorkload,
  showSlaDashboard,
  showOfficers
};
