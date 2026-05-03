const Document = require('../models/Document');

function create(data, session = null) {
  return Document.create([data], session ? { session } : {}).then(([document]) => document);
}

function findById(documentId) {
  return Document.findOne({ _id: documentId, isDeleted: false });
}

function findByCaseId(caseId, filter = {}, pagination = {}) {
  return Document.find({ caseId, isDeleted: false, ...filter })
    .sort({ createdAt: -1 })
    .limit(Number(pagination.limit || 100))
    .skip(Number(pagination.skip || 0));
}

function findByTaskId(taskId, filter = {}, pagination = {}) {
  return Document.find({ taskId, isDeleted: false, ...filter })
    .sort({ createdAt: -1 })
    .limit(Number(pagination.limit || 100))
    .skip(Number(pagination.skip || 0));
}

function findByCertificateNumber(certificateNumber) {
  return Document.findOne({
    'certificate.certificateNumber': certificateNumber,
    isDeleted: false
  });
}

function findByVerificationToken(token) {
  return Document.findOne({
    'certificate.verificationToken': token,
    isDeleted: false
  });
}

function findByObjectKey(objectKey) {
  return Document.findOne({
    'storage.objectKey': objectKey,
    isDeleted: false
  });
}

function findVersions(parentDocumentId) {
  return Document.find({
    $or: [{ _id: parentDocumentId }, { parentDocumentId }],
    isDeleted: false
  }).sort({ version: 1, createdAt: 1 });
}

function updateMetadata(documentId, patch, session = null) {
  return Document.findOneAndUpdate(
    { _id: documentId, isDeleted: false },
    { $set: patch },
    { new: true, session }
  );
}

function markVerified(documentId, verification, session = null) {
  return Document.findOneAndUpdate(
    { _id: documentId, isDeleted: false },
    {
      $set: {
        status: 'verified',
        verification
      }
    },
    { new: true, session }
  );
}

function markRejected(documentId, rejection, session = null) {
  return Document.findOneAndUpdate(
    { _id: documentId, isDeleted: false },
    {
      $set: {
        status: 'rejected',
        'verification.status': 'failed',
        'verification.failureReason': rejection.failureReason || rejection.remarks || null,
        'verification.remarks': rejection.remarks || null
      }
    },
    { new: true, session }
  );
}

function markSuperseded(documentId, supersededByDocumentId, session = null) {
  return Document.findOneAndUpdate(
    { _id: documentId, isDeleted: false },
    {
      $set: {
        status: 'superseded',
        supersededByDocumentId
      }
    },
    { new: true, session }
  );
}

function softDelete(documentId, deletedBy, session = null) {
  return Document.findOneAndUpdate(
    { _id: documentId, isDeleted: false },
    {
      $set: {
        status: 'deleted',
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy
      }
    },
    { new: true, session }
  );
}

function incrementDownloadCount(documentId, actor, session = null) {
  return Document.findOneAndUpdate(
    { _id: documentId, isDeleted: false },
    {
      $inc: { 'accessStats.downloadCount': 1 },
      $set: {
        'accessStats.lastDownloadedAt': new Date(),
        'accessStats.lastAccessedBy': actor || null
      }
    },
    { new: true, session }
  );
}

function createMetadata(data, session = null) {
  return create(data, session);
}

function findRequiredByCaseId(caseId, requiredTypes = []) {
  return Document.find({ caseId, documentType: { $in: requiredTypes }, isDeleted: false });
}

module.exports = {
  create,
  createMetadata,
  findById,
  findByCaseId,
  findByTaskId,
  findByCertificateNumber,
  findByVerificationToken,
  findByObjectKey,
  findVersions,
  updateMetadata,
  markVerified,
  markRejected,
  markSuperseded,
  softDelete,
  incrementDownloadCount,
  findRequiredByCaseId
};
