const crypto = require('crypto');
const documentRepository = require('../repositories/document.repository');
const domainEventRepository = require('../repositories/domain-event.repository');
const auditEventRepository = require('../repositories/audit-event.repository');
const { env } = require('../config/env');

function buildAttachmentService(deps = {}) {
  const documents = deps.documentRepository || documentRepository;
  const events = deps.domainEventRepository || domainEventRepository;
  const auditEvents = deps.auditEventRepository || auditEventRepository;

  async function attachDocumentMetadata(caseId, filesOrMetadata = [], context = {}, session = null) {
    const created = [];

    for (const item of filesOrMetadata) {
      const checksum =
        item.checksum ||
        crypto
          .createHash('sha256')
          .update(
            JSON.stringify({
              caseId,
              documentType: item.documentType,
              fileName: item.fileName,
              objectKey: item.objectKey
            })
          )
          .digest('hex');

      const document = await documents.createMetadata(
        {
          caseId,
          universalCaseId: context.universalCaseId || null,
          documentType: item.documentType,
          title: item.title || item.documentType,
          fileName: item.fileName || `${item.documentType}.pdf`,
          mimeType: item.mimeType || 'application/pdf',
          fileSize: item.fileSize || 0,
          checksum,
          storageProvider: env.ATTACHMENT_STORAGE_PROVIDER || 's3',
          objectKey:
            item.objectKey ||
            `${caseId}/${item.documentType}-${Date.now()}.pdf`,
          status: 'uploaded',
          version: item.version || 1,
          uploadedBy: context.user?._id || context.user?.id || null,
          metadata: item.metadata || {}
        },
        session
      );

      created.push(document);

      await events.append(
        {
          eventName: 'document.uploaded.v1',
          eventVersion: 'v1',
          source: 'udyogsetu-web',
          subject: `cases/${caseId}/documents/${document._id}`,
          correlationId: context.correlationId || null,
          aggregateType: 'case',
          aggregateId: caseId,
          universalCaseId: context.universalCaseId || null,
          payload: {
            documentId: String(document._id),
            documentType: document.documentType,
            fileName: document.fileName
          }
        },
        session
      );

      await auditEvents.append(
        {
          action: 'document.uploaded',
          resourceType: 'document',
          resourceId: String(document._id),
          caseId,
          universalCaseId: context.universalCaseId || null,
          metadata: {
            documentType: document.documentType,
            fileName: document.fileName
          },
          context
        },
        session
      );
    }

    return created;
  }

  async function validateRequiredAttachments(caseDoc, requiredAttachments = []) {
    const documentsForCase = await documents.findRequiredByCaseId(caseDoc.caseId, requiredAttachments);
    const availableTypes = new Set(documentsForCase.map((item) => item.documentType));
    const missing = requiredAttachments.filter((item) => !availableTypes.has(item));

    return {
      valid: missing.length === 0,
      missing,
      documents: documentsForCase
    };
  }

  async function markAttachmentLinked(documentId, caseId, _context = {}) {
    return { documentId, caseId, linked: true };
  }

  return {
    attachDocumentMetadata,
    validateRequiredAttachments,
    markAttachmentLinked
  };
}

module.exports = { ...buildAttachmentService(), buildAttachmentService };
