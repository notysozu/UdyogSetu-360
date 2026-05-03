const { sendAccepted, sendCreated, sendSuccess } = require('../utils/api-response');

function stub(action, req, extra = {}) {
  return {
    resource: 'document',
    action,
    todo: `Wire document.${action} to the case service and storage adapter.`,
    correlationId: req.context.correlationId,
    ...extra
  };
}

async function uploadDocument(req, res) {
  return sendCreated(res, stub('uploadDocument', req, { input: req.body }));
}
async function getDocumentById(req, res) {
  return sendSuccess(res, stub('getDocumentById', req, { documentId: req.params.documentId }));
}
async function listCaseDocuments(req, res) {
  return sendSuccess(res, stub('listCaseDocuments', req, { caseId: req.params.caseId }));
}
async function updateDocumentMetadata(req, res) {
  return sendSuccess(res, stub('updateDocumentMetadata', req, { documentId: req.params.documentId, patch: req.body }));
}
async function verifyDocument(req, res) {
  return sendAccepted(res, stub('verifyDocument', req, { documentId: req.params.documentId, body: req.body }));
}
async function supersedeDocument(req, res) {
  return sendAccepted(res, stub('supersedeDocument', req, { documentId: req.params.documentId, body: req.body }));
}

module.exports = {
  uploadDocument,
  getDocumentById,
  listCaseDocuments,
  updateDocumentMetadata,
  verifyDocument,
  supersedeDocument
};
