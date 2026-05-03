const { sendAccepted, sendSuccess } = require('../utils/api-response');

function stub(action, req, extra = {}) {
  return {
    resource: 'task',
    action,
    todo: `Wire task.${action} to the orchestration/case service.`,
    correlationId: req.context.correlationId,
    ...extra
  };
}

async function listTasks(req, res) {
  return sendSuccess(res, stub('listTasks', req, { filters: req.query }));
}
async function getTaskById(req, res) {
  return sendSuccess(res, stub('getTaskById', req, { taskId: req.params.taskId }));
}
async function updateTask(req, res) {
  return sendSuccess(res, stub('updateTask', req, { taskId: req.params.taskId, patch: req.body }));
}
async function assignTask(req, res) {
  return sendAccepted(res, stub('assignTask', req, { taskId: req.params.taskId, body: req.body }));
}
async function raiseQuery(req, res) {
  return sendAccepted(res, stub('raiseQuery', req, { taskId: req.params.taskId, body: req.body }));
}
async function respondQuery(req, res) {
  return sendAccepted(res, stub('respondQuery', req, { taskId: req.params.taskId, body: req.body }));
}
async function scheduleInspection(req, res) {
  return sendAccepted(res, stub('scheduleInspection', req, { taskId: req.params.taskId, body: req.body }));
}
async function approveTask(req, res) {
  return sendAccepted(res, stub('approveTask', req, { taskId: req.params.taskId, body: req.body }));
}
async function rejectTask(req, res) {
  return sendAccepted(res, stub('rejectTask', req, { taskId: req.params.taskId, body: req.body }));
}

module.exports = {
  listTasks,
  getTaskById,
  updateTask,
  assignTask,
  raiseQuery,
  respondQuery,
  scheduleInspection,
  approveTask,
  rejectTask
};
