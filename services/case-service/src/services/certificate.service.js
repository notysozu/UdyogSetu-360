const { randomUUID, createHash } = require('crypto');
const documentService = require('./document.service');
const documentRepository = require('../repositories/document.repository');
const { appendDomainEvent } = require('./event-outbox.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

function generateVerificationToken(certificateNumber) {
  return createHash('sha256').update(`${certificateNumber}:${randomUUID()}`).digest('hex').slice(0, 32);
}

function buildCertificateChecksum(documentDoc) {
  return createHash('sha256')
    .update(JSON.stringify({
      certificateNumber: documentDoc.certificate?.certificateNumber,
      checksum: documentDoc.hash?.checksum,
      issuedAt: documentDoc.certificate?.issuedAt
    }))
    .digest('hex');
}

async function storeCertificate(input, fileOrDocumentRef, context = {}) {
  const certificateNumber = input.certificateNumber || `CERT-${Date.now()}`;
  const verificationToken = input.verificationToken || generateVerificationToken(certificateNumber);
  const uploadInput = {
    ...input,
    documentType: 'certificate',
    isCertificate: true,
    certificateNumber,
    verificationToken,
    issuerDepartmentCode: input.issuerDepartmentCode || input.departmentCode || null,
    visibility: input.visibility || 'internal_only'
  };
  const document = await documentService.uploadDocument(fileOrDocumentRef, uploadInput, context);
  const checksum = buildCertificateChecksum(document);
  const updated = await documentRepository.updateMetadata(document.id, {
    status: 'verified',
    visibility: input.visibility || 'public_verification',
    'certificate.isCertificate': true,
    'certificate.certificateNumber': certificateNumber,
    'certificate.verificationToken': verificationToken,
    'certificate.issuedAt': input.issuedAt || new Date(),
    'certificate.validFrom': input.validFrom || new Date(),
    'certificate.validUntil': input.validUntil || null,
    'certificate.issuerDepartmentCode': input.issuerDepartmentCode || input.departmentCode || null,
    'certificate.checksum': checksum,
    'permissions.isPubliclyVerifiable': true
  });
  await appendDomainEvent(
    {
      eventName: EVENT_NAMES.CERTIFICATE_ISSUED,
      aggregateType: 'document',
      aggregateId: updated.id,
      universalCaseId: updated.universalCaseId || null,
      payload: {
        documentId: updated.id,
        certificateNumber,
        verificationToken
      }
    },
    context
  ).catch(() => {});
  await recordAuditEvent({
    actor: context.user || context.actor || null,
    action: 'certificate.issued',
    resourceType: 'document',
    resourceId: updated.id,
    caseId: updated.caseId,
    universalCaseId: updated.universalCaseId,
    correlationId: context.correlationId || null,
    metadata: {
      certificateNumber
    }
  }).catch(() => {});
  return updated;
}

async function issueCertificateForTask(taskId, input, context = {}) {
  return storeCertificate({ ...input, taskId }, input.file, context);
}

async function getCertificateByNumber(certificateNumber, context = {}) {
  const document = await documentRepository.findByCertificateNumber(certificateNumber);
  if (!document) {
    const error = new Error('Certificate not found.');
    error.statusCode = 404;
    throw error;
  }
  return documentService.getDocumentMetadata(document.id, context);
}

async function verifyCertificate(input, context = {}) {
  let document;
  if (input.certificateNumber) {
    document = await documentRepository.findByCertificateNumber(input.certificateNumber);
  } else if (input.verificationToken) {
    document = await documentRepository.findByVerificationToken(input.verificationToken);
  }
  if (!document) {
    return { status: 'not_found' };
  }
  if (document.status !== 'verified') {
    return { status: 'revoked_or_invalid' };
  }
  await appendDomainEvent(
    {
      eventName: EVENT_NAMES.CERTIFICATE_VERIFIED,
      aggregateType: 'document',
      aggregateId: document.id,
      universalCaseId: document.universalCaseId || null,
      payload: {
        certificateNumber: document.certificate.certificateNumber
      }
    },
    context
  ).catch(() => {});
  await recordAuditEvent({
    actor: context.user || context.actor || null,
    action: 'certificate.verified',
    resourceType: 'document',
    resourceId: document.id,
    caseId: document.caseId,
    universalCaseId: document.universalCaseId,
    correlationId: context.correlationId || null,
    metadata: {
      certificateNumber: document.certificate.certificateNumber
    }
  }).catch(() => {});
  return {
    status: 'verified',
    certificateNumber: document.certificate.certificateNumber,
    issuedAt: document.certificate.issuedAt,
    validUntil: document.certificate.validUntil,
    issuerDepartmentCode: document.certificate.issuerDepartmentCode,
    checksum: document.certificate.checksum,
    documentType: document.documentType
  };
}

async function revokeCertificate(certificateNumber, reason, context = {}) {
  const document = await documentRepository.findByCertificateNumber(certificateNumber);
  if (!document) {
    const error = new Error('Certificate not found.');
    error.statusCode = 404;
    throw error;
  }
  const updated = await documentRepository.updateMetadata(document.id, {
    status: 'rejected',
    metadata: {
      ...(document.metadata || {}),
      revocation: {
        reason,
        revokedAt: new Date().toISOString()
      }
    }
  });
  await appendDomainEvent(
    {
      eventName: EVENT_NAMES.CERTIFICATE_REVOKED,
      aggregateType: 'document',
      aggregateId: updated.id,
      universalCaseId: updated.universalCaseId || null,
      payload: {
        certificateNumber,
        reason
      }
    },
    context
  ).catch(() => {});
  await recordAuditEvent({
    actor: context.user || context.actor || null,
    action: 'certificate.revoked',
    resourceType: 'document',
    resourceId: updated.id,
    caseId: updated.caseId,
    universalCaseId: updated.universalCaseId,
    correlationId: context.correlationId || null,
    metadata: {
      certificateNumber,
      reason
    }
  }).catch(() => {});
  return updated;
}

module.exports = {
  storeCertificate,
  issueCertificateForTask,
  getCertificateByNumber,
  verifyCertificate,
  revokeCertificate,
  generateVerificationToken,
  buildCertificateChecksum
};
