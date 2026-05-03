const DocumentAccessLog = require('../models/DocumentAccessLog');

function createAccessLog(data) {
  return DocumentAccessLog.create(data);
}

function findByDocumentId(documentId, pagination = {}) {
  return DocumentAccessLog.find({ documentId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(Number(pagination.limit || 50))
    .skip(Number(pagination.skip || 0));
}

function findByCaseId(caseId, pagination = {}) {
  return DocumentAccessLog.find({ caseId, isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(Number(pagination.limit || 50))
    .skip(Number(pagination.skip || 0));
}

module.exports = {
  createAccessLog,
  findByDocumentId,
  findByCaseId
};
