const { sendAccepted, sendCreated, sendSuccess } = require('../utils/api-response');

function stub(action, req, extra = {}) {
  return {
    resource: 'grievance',
    action,
    todo: `Wire grievance.${action} to the grievance service layer.`,
    correlationId: req.context.correlationId,
    ...extra
  };
}

async function createGrievance(req, res) {
  return sendCreated(res, stub('createGrievance', req, { input: req.body }));
}
async function listGrievances(req, res) {
  return sendSuccess(res, stub('listGrievances', req, { filters: req.query }));
}
async function getGrievanceById(req, res) {
  return sendSuccess(res, stub('getGrievanceById', req, { grievanceId: req.params.grievanceId }));
}
async function addGrievanceMessage(req, res) {
  return sendAccepted(res, stub('addGrievanceMessage', req, { grievanceId: req.params.grievanceId, body: req.body }));
}
async function updateGrievanceStatus(req, res) {
  return sendAccepted(res, stub('updateGrievanceStatus', req, { grievanceId: req.params.grievanceId, body: req.body }));
}

module.exports = {
  createGrievance,
  listGrievances,
  getGrievanceById,
  addGrievanceMessage,
  updateGrievanceStatus
};
