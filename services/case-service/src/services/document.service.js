const fs = require('fs/promises');
const path = require('path');
const { randomUUID, createHash } = require('crypto');
const mongoose = require('mongoose');
const {
  DOCUMENT_STORAGE_PROVIDERS,
  EVENT_NAMES
} = require('../../../../packages/shared/src');
const Document = require('../models/Document');
const Case = require('../models/Case');
const ApprovalTask = require('../models/ApprovalTask');
const Organisation = require('../models/Organisation');
const documentRepository = require('../repositories/document.repository');
const accessLogRepository = require('../repositories/document-access-log.repository');
const permissionService = require('./document-permission.service');
const { getStorageProvider } = require('../storage/storage-provider.factory');
const { buildDocumentObjectKey, sanitizeFileName } = require('../documents/document-object-key.util');
const { hashBuffer, hashFile } = require('../documents/document-hash.service');
const scanningService = require('./document-scanning.service');
const { verifySignedLocalRequest } = require('../storage/local-storage.provider');
const { appendDomainEvent } = require('./event-outbox.service');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

function buildContextActor(context = {}) {
  return context.user || context.actor || {
    id: 'system',
    primaryRole: 'system'
  };
}

async function logAudit(action, resourceId, metadata, context = {}) {
  return recordAuditEvent(
    {
      actor: buildContextActor(context),
      action,
      resourceType: 'document',
      resourceId,
      caseId: metadata.caseId || null,
      universalCaseId: metadata.universalCaseId || null,
      correlationId: context.correlationId || null,
      ipAddress: context.ipAddress || null,
      userAgent: context.userAgent || null,
      metadata
    },
    context
  ).catch(() => {});
}

async function emitEvent(eventName, aggregateId, payload, context = {}) {
  return appendDomainEvent(
    {
      eventName,
      aggregateType: 'document',
      aggregateId: String(aggregateId),
      universalCaseId: payload.universalCaseId || null,
      source: 'us360.case-service',
      correlationId: context.correlationId || null,
      idempotencyKey: context.idempotencyKey || null,
      payload
    },
    context
  ).catch(() => {});
}

async function logDocumentAccess(documentId, action, context = {}, success = true, failureReason = null) {
  const documentDoc = await documentRepository.findById(documentId);
  return accessLogRepository.createAccessLog({
    documentId,
    caseId: documentDoc?.caseId || null,
    universalCaseId: documentDoc?.universalCaseId || null,
    actorUserId: context.user?._id || context.user?.id || null,
    actorRole: context.user?.primaryRole || context.user?.role || null,
    action,
    accessType: action,
    ipAddress: context.ipAddress || null,
    userAgent: context.userAgent || null,
    success,
    failureReason,
    correlationId: context.correlationId || null,
    metadata: context.metadata || {}
  });
}

async function resolveCaseTaskContext(input = {}, context = {}) {
  const [caseDoc, taskDoc] = await Promise.all([
    input.caseId ? Case.findById(input.caseId) : null,
    input.taskId ? ApprovalTask.findById(input.taskId) : null
  ]);
  const organisationId = input.organisationId || caseDoc?.organisationId || context.user?.organisationId || null;
  const organisationDoc = organisationId ? await Organisation.findById(organisationId).catch(() => null) : null;
  return { caseDoc, taskDoc, organisationDoc };
}

function buildPermissions(input = {}, context = {}) {
  return {
    allowedUserIds: input.allowedUserIds || [context.user?._id || context.user?.id].filter(Boolean),
    allowedRoleCodes: input.allowedRoleCodes || [],
    allowedDepartmentCodes: input.allowedDepartmentCodes || [input.departmentCode].filter(Boolean),
    isDownloadAllowed: input.isDownloadAllowed !== false,
    isPreviewAllowed: input.isPreviewAllowed !== false,
    isPubliclyVerifiable: input.isPubliclyVerifiable === true
  };
}

async function createUploadIntent(input, context = {}) {
  const storageProvider = await getStorageProvider();
  const documentId = new mongoose.Types.ObjectId();
  const version = Number(input.version || 1);
  const objectKey = buildDocumentObjectKey({
    universalCaseId: input.universalCaseId,
    organisationId: input.organisationId || context.user?.organisationId || 'unknown-org',
    documentType: input.documentType,
    version,
    documentId: documentId.toString(),
    fileName: input.originalName
  });
  const metadata = {
    documentid: documentId.toString(),
    universalcaseid: input.universalCaseId || '',
    documenttype: input.documentType,
    correlationid: context.correlationId || ''
  };
  const signed = await storageProvider.createSignedUploadUrl({
    objectKey,
    contentType: input.mimeType,
    expiresInSeconds: Number(process.env.DOCUMENT_UPLOAD_URL_EXPIRES_SECONDS || 900),
    metadata
  });
  const created = await documentRepository.create({
    _id: documentId,
    caseId: input.caseId || null,
    universalCaseId: input.universalCaseId || null,
    taskId: input.taskId || null,
    organisationId: input.organisationId || context.user?.organisationId || null,
    investorId: context.user?.investorId || null,
    uploadedBy: context.user?._id || context.user?.id || null,
    ownerUserId: context.user?._id || context.user?.id || null,
    departmentCode: input.departmentCode || null,
    documentType: input.documentType,
    title: input.title || input.documentType,
    description: input.description || '',
    tags: input.tags || [],
    status: 'draft',
    visibility: input.visibility || 'private',
    version,
    storage: {
      provider:
        process.env.DOCUMENT_STORAGE_PROVIDER === 'local'
          ? DOCUMENT_STORAGE_PROVIDERS.LOCAL
          : DOCUMENT_STORAGE_PROVIDERS.S3,
      bucket: process.env.S3_BUCKET || null,
      objectKey,
      region: process.env.S3_REGION || null,
      endpointRef: process.env.S3_ENDPOINT || null,
      signedUrlExpiresAt: new Date(Date.now() + Number(process.env.DOCUMENT_UPLOAD_URL_EXPIRES_SECONDS || 900) * 1000)
    },
    file: {
      originalName: input.originalName,
      storedName: sanitizeFileName(input.originalName),
      mimeType: input.mimeType,
      extension: path.extname(input.originalName),
      sizeBytes: input.sizeBytes || 1,
      encoding: input.encoding || 'binary'
    },
    hash: {
      algorithm: process.env.DOCUMENT_HASH_ALGORITHM || 'sha256',
      checksum: input.checksum || null,
      computedAt: null
    },
    verification: {
      status: 'not_required'
    },
    scan: {
      status: 'not_scanned',
      provider: process.env.DOCUMENT_SCANNING_PROVIDER || 'stub'
    },
    permissions: buildPermissions(input, context),
    retention: {
      retainUntil: input.retainUntil || null,
      legalHold: false,
      retentionPolicyCode: input.retentionPolicyCode || null
    },
    metadata: {
      uploadIntent: true
    },
    correlationId: context.correlationId || null
  });
  await logDocumentAccess(created.id, 'generate_signed_url', context);
  return {
    documentId: created.id,
    objectKey,
    signedUpload: signed
  };
}

async function uploadDocument(file, input, context = {}) {
  const { caseDoc, taskDoc } = await resolveCaseTaskContext(input, context);
  permissionService.assertCanUploadDocument(context.user, caseDoc, taskDoc);
  const storageProvider = await getStorageProvider();
  const documentId = new mongoose.Types.ObjectId();
  const baseDocument = input.parentDocumentId
    ? await documentRepository.findById(input.parentDocumentId)
    : null;
  const version = baseDocument ? Number(baseDocument.version || 1) + 1 : 1;
  const universalCaseId = input.universalCaseId || caseDoc?.universalCaseId || null;
  const objectKey = buildDocumentObjectKey({
    universalCaseId,
    organisationId: input.organisationId || caseDoc?.organisationId || context.user?.organisationId || 'unknown-org',
    documentType: input.documentType,
    version,
    documentId: documentId.toString(),
    fileName: file.originalname
  });
  const checksum = file.buffer ? hashBuffer(file.buffer) : await hashFile(file.path);
  const body = file.buffer || (await fs.readFile(file.path));
  await storageProvider.putObject({
    objectKey,
    body,
    contentType: file.mimetype,
    metadata: {
      documentid: documentId.toString(),
      universalcaseid: universalCaseId || '',
      documenttype: input.documentType,
      checksum,
      correlationid: context.correlationId || ''
    }
  });
  const status =
    String(process.env.DOCUMENT_QUARANTINE_ON_UPLOAD || 'false') === 'true'
      ? 'quarantined'
      : 'uploaded';
  const document = await documentRepository.create({
    _id: documentId,
    caseId: input.caseId || null,
    universalCaseId,
    taskId: input.taskId || null,
    organisationId: input.organisationId || caseDoc?.organisationId || context.user?.organisationId || null,
    investorId: context.user?.investorId || null,
    uploadedBy: context.user?._id || context.user?.id || null,
    ownerUserId: context.user?._id || context.user?.id || null,
    departmentCode: input.departmentCode || taskDoc?.departmentCode || null,
    documentType: input.documentType,
    title: input.title || input.documentType,
    description: input.description || '',
    tags: input.tags || [],
    status,
    visibility: input.visibility || 'private',
    version,
    parentDocumentId: baseDocument ? baseDocument.parentDocumentId || baseDocument._id : null,
    storage: {
      provider:
        process.env.DOCUMENT_STORAGE_PROVIDER === 'local'
          ? DOCUMENT_STORAGE_PROVIDERS.LOCAL
          : DOCUMENT_STORAGE_PROVIDERS.S3,
      bucket: process.env.S3_BUCKET || null,
      objectKey,
      region: process.env.S3_REGION || null,
      endpointRef: process.env.S3_ENDPOINT || null,
      signedUrlExpiresAt: null
    },
    file: {
      originalName: file.originalname,
      storedName: sanitizeFileName(file.originalname),
      mimeType: file.mimetype,
      extension: path.extname(file.originalname),
      sizeBytes: file.size,
      encoding: file.encoding || 'binary'
    },
    hash: {
      algorithm: process.env.DOCUMENT_HASH_ALGORITHM || 'sha256',
      checksum,
      computedAt: new Date()
    },
    verification: {
      status: input.verificationRequired ? 'pending' : 'not_required'
    },
    scan: {
      status: 'not_scanned',
      provider: process.env.DOCUMENT_SCANNING_PROVIDER || 'stub'
    },
    permissions: buildPermissions(input, context),
    certificate: {
      isCertificate: Boolean(input.isCertificate),
      certificateNumber: input.certificateNumber || null,
      verificationToken: input.verificationToken || null,
      issuedAt: input.issuedAt || null,
      validFrom: input.validFrom || null,
      validUntil: input.validUntil || null,
      issuerDepartmentCode: input.issuerDepartmentCode || null,
      checksum: input.certificateChecksum || null
    },
    metadata: input.metadata || {},
    correlationId: context.correlationId || null
  });
  if (file.path) {
    await fs.rm(file.path, { force: true }).catch(() => {});
  }
  await logDocumentAccess(document.id, 'upload', context);
  await emitEvent(EVENT_NAMES.DOCUMENT_UPLOADED, document.id, {
    documentId: document.id,
    caseId: document.caseId,
    universalCaseId: document.universalCaseId,
    documentType: document.documentType
  }, context);
  await logAudit('document.uploaded', document.id, {
    caseId: document.caseId,
    universalCaseId: document.universalCaseId,
    documentType: document.documentType,
    objectKey: document.storage.objectKey
  }, context);
  await scanningService.requestScan(document.id, context);
  if (baseDocument) {
    await documentRepository.markSuperseded(baseDocument.id, document.id);
    await emitEvent(EVENT_NAMES.DOCUMENT_VERSION_CREATED, document.id, {
      documentId: document.id,
      parentDocumentId: baseDocument.id,
      version: document.version,
      universalCaseId: document.universalCaseId
    }, context);
  }
  return document;
}

async function confirmSignedUpload(documentId, input, context = {}) {
  const document = await documentRepository.findById(documentId);
  if (!document) {
    const error = new Error('Document not found.');
    error.statusCode = 404;
    throw error;
  }
  const storageProvider = await getStorageProvider();
  const exists = await storageProvider.objectExists({ objectKey: document.storage.objectKey });
  if (!exists) {
    const error = new Error('Uploaded object not found in storage.');
    error.statusCode = 404;
    throw error;
  }
  const updated = await documentRepository.updateMetadata(documentId, {
    status: String(process.env.DOCUMENT_QUARANTINE_ON_UPLOAD || 'false') === 'true' ? 'quarantined' : 'uploaded',
    'hash.checksum': input.checksum || document.hash.checksum || `pending-${documentId}`,
    'hash.computedAt': new Date(),
    'file.sizeBytes': input.sizeBytes || document.file.sizeBytes
  });
  await logDocumentAccess(documentId, 'upload', context);
  await emitEvent(EVENT_NAMES.DOCUMENT_UPLOADED, documentId, {
    documentId,
    caseId: updated.caseId,
    universalCaseId: updated.universalCaseId,
    documentType: updated.documentType
  }, context);
  return updated;
}

async function getDocumentMetadata(documentId, context = {}) {
  const document = await documentRepository.findById(documentId);
  if (!document) {
    const error = new Error('Document not found.');
    error.statusCode = 404;
    throw error;
  }
  permissionService.assertCanViewDocument(context.user, document);
  await logDocumentAccess(documentId, 'view_metadata', context);
  await logAudit('document.metadata_viewed', documentId, {
    caseId: document.caseId,
    universalCaseId: document.universalCaseId
  }, context);
  return document;
}

function listCaseDocuments(caseId, filter = {}, context = {}) {
  return documentRepository.findByCaseId(caseId, filter, context.pagination || {});
}

function listTaskDocuments(taskId, filter = {}, context = {}) {
  return documentRepository.findByTaskId(taskId, filter, context.pagination || {});
}

async function generateSignedDownloadUrl(documentId, context = {}) {
  const document = await getDocumentMetadata(documentId, context);
  permissionService.assertCanDownloadDocument(context.user, document);
  const storageProvider = await getStorageProvider();
  let signed;
  if (document.storage.provider === DOCUMENT_STORAGE_PROVIDERS.LOCAL) {
    signed = {
      url: `/api/v1/documents/${documentId}/download`,
      method: 'GET',
      expiresInSeconds: Number(process.env.DOCUMENT_SIGNED_URL_EXPIRES_SECONDS || 900)
    };
  } else {
    signed = await storageProvider.createSignedDownloadUrl({
      objectKey: document.storage.objectKey,
      expiresInSeconds: Number(process.env.DOCUMENT_SIGNED_URL_EXPIRES_SECONDS || 900),
      responseContentDisposition: `attachment; filename="${document.file.storedName}"`
    });
  }
  await logDocumentAccess(documentId, 'generate_signed_url', context);
  await logAudit('document.download_url_generated', documentId, {
    caseId: document.caseId,
    universalCaseId: document.universalCaseId
  }, context);
  return signed;
}

async function downloadDocument(documentId, context = {}) {
  const document = await getDocumentMetadata(documentId, context);
  permissionService.assertCanDownloadDocument(context.user, document);
  const storageProvider = await getStorageProvider();
  const object = await storageProvider.getObject({ objectKey: document.storage.objectKey });
  await documentRepository.incrementDownloadCount(documentId, context.user?._id || context.user?.id || null);
  await logDocumentAccess(documentId, 'download', context);
  await logAudit('document.downloaded', documentId, {
    caseId: document.caseId,
    universalCaseId: document.universalCaseId
  }, context);
  return { document, object };
}

async function updateDocumentMetadata(documentId, patch, context = {}) {
  const document = await getDocumentMetadata(documentId, context);
  permissionService.assertCanViewDocument(context.user, document);
  return documentRepository.updateMetadata(documentId, patch);
}

async function createNewVersion(documentId, fileOrIntent, context = {}) {
  const existing = await getDocumentMetadata(documentId, context);
  const input = {
    caseId: existing.caseId,
    universalCaseId: existing.universalCaseId,
    taskId: existing.taskId,
    organisationId: existing.organisationId,
    departmentCode: existing.departmentCode,
    documentType: existing.documentType,
    title: existing.title,
    description: existing.description,
    tags: existing.tags,
    visibility: existing.visibility,
    parentDocumentId: existing.parentDocumentId || existing._id
  };
  if (fileOrIntent?.buffer || fileOrIntent?.path) {
    return uploadDocument(fileOrIntent, input, context);
  }
  return createUploadIntent({ ...input, originalName: fileOrIntent.originalName, mimeType: fileOrIntent.mimeType, sizeBytes: fileOrIntent.sizeBytes, version: existing.version + 1 }, context);
}

function getDocumentVersions(documentId) {
  return documentRepository.findVersions(documentId);
}

async function tagDocument(documentId, tags, context = {}) {
  const document = await getDocumentMetadata(documentId, context);
  const nextTags = [...new Set([...(document.tags || []), ...tags])];
  return documentRepository.updateMetadata(documentId, { tags: nextTags });
}

async function removeDocumentTag(documentId, tag, context = {}) {
  const document = await getDocumentMetadata(documentId, context);
  return documentRepository.updateMetadata(documentId, {
    tags: (document.tags || []).filter((entry) => entry !== tag)
  });
}

async function verifyDocument(documentId, verification, context = {}) {
  const document = await getDocumentMetadata(documentId, context);
  permissionService.assertCanVerifyDocument(context.user, document);
  const updated = await documentRepository.markVerified(documentId, {
    status: verification.status || 'verified',
    method: verification.method || 'manual',
    verifiedBy: context.user?._id || context.user?.id || null,
    verifiedAt: new Date(),
    confidence: verification.confidence || null,
    remarks: verification.remarks || null,
    failureReason: null
  });
  await logDocumentAccess(documentId, 'verify', context);
  await emitEvent(EVENT_NAMES.DOCUMENT_VERIFIED, documentId, {
    documentId,
    caseId: updated.caseId,
    universalCaseId: updated.universalCaseId
  }, context);
  await logAudit('document.verified', documentId, {
    caseId: updated.caseId,
    universalCaseId: updated.universalCaseId
  }, context);
  return updated;
}

async function rejectDocument(documentId, rejection, context = {}) {
  const document = await getDocumentMetadata(documentId, context);
  permissionService.assertCanVerifyDocument(context.user, document);
  const updated = await documentRepository.markRejected(documentId, rejection);
  await logDocumentAccess(documentId, 'verify', context);
  await emitEvent(EVENT_NAMES.DOCUMENT_REJECTED, documentId, {
    documentId,
    caseId: updated.caseId,
    universalCaseId: updated.universalCaseId
  }, context);
  await logAudit('document.rejected', documentId, {
    caseId: updated.caseId,
    universalCaseId: updated.universalCaseId
  }, context);
  return updated;
}

async function supersedeDocument(documentId, newDocumentId, context = {}) {
  const updated = await documentRepository.markSuperseded(documentId, newDocumentId);
  await emitEvent(EVENT_NAMES.DOCUMENT_SUPERSEDED, documentId, {
    documentId,
    supersededByDocumentId: newDocumentId,
    universalCaseId: updated?.universalCaseId || null
  }, context);
  await logAudit('document.superseded', documentId, {
    caseId: updated?.caseId || null,
    universalCaseId: updated?.universalCaseId || null
  }, context);
  return updated;
}

async function softDeleteDocument(documentId, reason, context = {}) {
  const document = await getDocumentMetadata(documentId, context);
  if (!permissionService.canDeleteDocument(context.user, document)) {
    const error = new Error('You do not have permission to delete this document.');
    error.statusCode = 403;
    throw error;
  }
  const updated = await documentRepository.softDelete(documentId, context.user?._id || context.user?.id || null);
  await emitEvent(EVENT_NAMES.DOCUMENT_DELETED, documentId, {
    documentId,
    universalCaseId: updated.universalCaseId
  }, context);
  await logAudit('document.deleted', documentId, {
    caseId: updated.caseId,
    universalCaseId: updated.universalCaseId,
    reason
  }, context);
  return updated;
}

async function handleLocalSignedUpload({ objectKey, expiresAt, signature, body, contentType }) {
  verifySignedLocalRequest({
    operation: 'upload',
    objectKey,
    expiresAt,
    signature
  });
  const storageProvider = await getStorageProvider();
  await storageProvider.putObject({
    objectKey,
    body,
    contentType
  });
  return {
    ok: true,
    objectKey
  };
}

async function downloadLocalSignedObject({ objectKey, expiresAt, signature, context = {} }) {
  verifySignedLocalRequest({
    operation: 'download',
    objectKey,
    expiresAt,
    signature
  });
  const storageProvider = await getStorageProvider();
  const [object, document] = await Promise.all([
    storageProvider.getObject({ objectKey }),
    documentRepository.findByObjectKey(objectKey)
  ]);
  if (document) {
    await logDocumentAccess(document.id, 'download', context).catch(() => {});
  }
  return { object, document };
}

module.exports = {
  createUploadIntent,
  uploadDocument,
  confirmSignedUpload,
  getDocumentMetadata,
  listCaseDocuments,
  listTaskDocuments,
  generateSignedDownloadUrl,
  downloadDocument,
  updateDocumentMetadata,
  createNewVersion,
  getDocumentVersions,
  tagDocument,
  removeDocumentTag,
  verifyDocument,
  rejectDocument,
  supersedeDocument,
  softDeleteDocument,
  logDocumentAccess,
  handleLocalSignedUpload,
  downloadLocalSignedObject
};
