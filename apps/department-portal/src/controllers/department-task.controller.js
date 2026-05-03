const viewService = require('../services/department-task-view.service');
const actionService = require('../services/department-task-action.service');
const validators = require('../validators/department-task.validators');

function ctx(req) {
  return {
    user: req.user,
    role: req.user?.primaryRole || req.user?.role,
    permissions: req.user?.permissions || [],
    departmentCode: req.user?.departmentCode || null,
    correlationId: req.correlationId,
    requestId: req.requestId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    overrideReason: req.body.overrideReason || null
  };
}

function respond(req, res, viewName, payload) {
  if (req.originalUrl.startsWith('/api/')) {
    return res.json({ success: true, data: payload, meta: { correlationId: req.correlationId } });
  }
  return res.render(viewName, payload);
}

async function listTasks(req, res) {
  const filters = validators.taskFilterSchema(req.query || {});
  const tasks = await viewService.getTaskInbox(req.user, filters, {}, ctx(req));
  return respond(req, res, 'officer/task-inbox', { title: 'Task Inbox', tasks, filters });
}

async function showTaskDetail(req, res) {
  validators.validateObjectId(req.params.taskId, 'taskId');
  const [task, documents, timeline, comments, sla] = await Promise.all([
    viewService.getTaskDetail(req.user, req.params.taskId, ctx(req)),
    viewService.getTaskDocuments(req.user, req.params.taskId, ctx(req)),
    viewService.getTaskTimeline(req.user, req.params.taskId, ctx(req)),
    viewService.getTaskComments(req.user, req.params.taskId, ctx(req)),
    viewService.getTaskSlaStatus(req.user, req.params.taskId, ctx(req))
  ]);
  if (!task) {
    const error = new Error('Task not found.');
    error.status = 404;
    throw error;
  }
  return respond(req, res, 'officer/task-detail', { title: task.title, task, documents, timeline, comments, sla });
}

async function startReview(req, res) {
  await actionService.startReview(req.params.taskId, req.body || {}, ctx(req));
  req.flash('success', 'Task review started.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function updateChecklist(req, res) {
  const input = validators.checklistUpdateSchema(req.body || {});
  await actionService.updateChecklist(req.params.taskId, input, ctx(req));
  req.flash('success', 'Checklist updated.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function reviewDocument(req, res) {
  const input = validators.documentReviewSchema(req.body || {});
  await actionService.reviewDocument(req.params.taskId, req.params.documentId, input, ctx(req));
  req.flash('success', input.decision === 'verify' ? 'Document verified.' : 'Document rejected.');
  return res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function raiseQuery(req, res) {
  const input = validators.raiseQuerySchema(req.body || {});
  await actionService.raiseQuery(req.params.taskId, input, ctx(req));
  req.flash('success', 'Query raised.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function scheduleInspection(req, res) {
  const input = validators.scheduleInspectionSchema(req.body || {});
  await actionService.scheduleInspection(req.params.taskId, input, ctx(req));
  req.flash('success', 'Inspection scheduled.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function completeInspection(req, res) {
  const input = validators.completeInspectionSchema(req.body || {});
  await actionService.completeInspection(req.params.taskId, input, ctx(req));
  req.flash('success', 'Inspection completed.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function createFeeDemand(req, res) {
  const input = validators.feeDemandSchema(req.body || {});
  await actionService.createFeeDemand(req.params.taskId, input, ctx(req));
  req.flash('success', 'Fee demand created.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function approveTask(req, res) {
  const input = validators.approvalSchema(req.body || {});
  await actionService.approveTask(req.params.taskId, input, ctx(req));
  req.flash('success', 'Task approved.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function rejectTask(req, res) {
  const input = validators.rejectionSchema(req.body || {});
  await actionService.rejectTask(req.params.taskId, input, ctx(req));
  req.flash('success', 'Task rejected.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function returnTask(req, res) {
  const input = validators.returnTaskSchema(req.body || {});
  await actionService.returnTask(req.params.taskId, input, ctx(req));
  req.flash('success', 'Task returned for correction.');
  return res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function issueCertificate(req, res) {
  const input = validators.certificateIssueSchema(req.body || {});
  await actionService.issueCertificate(req.params.taskId, input, ctx(req));
  req.flash('success', 'Certificate issued.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

async function addComment(req, res) {
  const input = validators.commentSchema(req.body || {});
  await actionService.addComment(req.params.taskId, input, ctx(req));
  req.flash('success', 'Comment added.');
  return req.originalUrl.startsWith('/api/') ? res.json({ success: true }) : res.redirect(`/department/tasks/${req.params.taskId}`);
}

module.exports = {
  listTasks,
  showTaskDetail,
  startReview,
  updateChecklist,
  reviewDocument,
  raiseQuery,
  scheduleInspection,
  completeInspection,
  createFeeDemand,
  approveTask,
  rejectTask,
  returnTask,
  issueCertificate,
  addComment
};
