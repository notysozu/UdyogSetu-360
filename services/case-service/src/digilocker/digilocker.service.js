const { randomUUID } = require('crypto');
const { ensureConfigured, listDocumentsMock } = require('./digilocker.client');
const { mapDigiLockerDocument } = require('./digilocker.mapper');
const consentRepository = require('../repositories/digilocker-consent.repository');
const reconciliationService = require('./digilocker-reconciliation.service');
const documentRepository = require('../repositories/document.repository');
const { DOCUMENT_STORAGE_PROVIDERS } = require('../../../../packages/shared/src');

async function handleCallback(query, context = {}) {
  ensureConfigured();
  const consent = await consentRepository.findByState(query.state);
  if (!consent) {
    const error = new Error('Invalid DigiLocker callback state.');
    error.statusCode = 400;
    throw error;
  }
  const updated = await consentRepository.updateByConsentId(consent.consentId, {
    status: query.error ? 'failed' : 'granted',
    grantedAt: query.error ? null : new Date(),
    digilockerAuthCode: query.code || null
  });
  await reconciliationService.logOperation({
    consentId: consent.consentId,
    userId: consent.userId,
    caseId: consent.caseId,
    universalCaseId: consent.universalCaseId,
    operation: 'consent_callback_received',
    status: query.error ? 'failed' : 'succeeded',
    requestPayload: query,
    correlationId: context.correlationId
  });
  return updated;
}

async function getConsent(consentId) {
  return consentRepository.findByConsentId(consentId);
}

async function revokeConsent(consentId, context = {}) {
  const updated = await consentRepository.updateByConsentId(consentId, {
    status: 'revoked',
    revokedAt: new Date()
  });
  await reconciliationService.logOperation({
    consentId,
    operation: 'consent_callback_received',
    status: 'succeeded',
    requestPayload: { revoked: true },
    correlationId: context.correlationId
  });
  return updated;
}

async function listAvailableDocuments(consentId, context = {}) {
  ensureConfigured();
  const consent = await consentRepository.findByConsentId(consentId);
  const documents = (await listDocumentsMock()).map(mapDigiLockerDocument);
  await reconciliationService.logOperation({
    consentId,
    userId: consent?.userId || null,
    caseId: consent?.caseId || null,
    universalCaseId: consent?.universalCaseId || null,
    operation: 'document_list_requested',
    status: 'succeeded',
    responsePayload: documents,
    correlationId: context.correlationId
  });
  return documents;
}

async function retrieveDocument(consentId, documentRequest, context = {}) {
  const consent = await consentRepository.findByConsentId(consentId);
  const document = {
    digilockerDocumentId: documentRequest.digilockerDocumentId || 'DL-MOCK-001',
    uri: documentRequest.uri || 'digilocker://mock/document/001',
    documentType: documentRequest.documentType,
    issuerName: 'Mock DigiLocker Issuer'
  };
  await reconciliationService.logOperation({
    consentId,
    userId: consent?.userId || null,
    caseId: consent?.caseId || null,
    universalCaseId: consent?.universalCaseId || null,
    documentType: document.documentType,
    digilockerDocumentId: document.digilockerDocumentId,
    operation: 'document_retrieved',
    status: 'succeeded',
    responsePayload: document,
    correlationId: context.correlationId
  });
  return document;
}

async function verifyDocument(consentId, documentRequest, context = {}) {
  const response = {
    success: true,
    verificationReference: `dl-verify-${randomUUID()}`,
    documentType: documentRequest.documentType
  };
  await reconciliationService.logOperation({
    consentId,
    documentType: documentRequest.documentType,
    digilockerDocumentId: documentRequest.digilockerDocumentId || null,
    operation: 'document_verified',
    status: 'succeeded',
    responsePayload: response,
    correlationId: context.correlationId
  });
  return response;
}

async function importDocumentToCase(consentId, documentRequest, caseId, context = {}) {
  const retrieved = await retrieveDocument(consentId, documentRequest, context);
  const created = await documentRepository.create({
    caseId,
    universalCaseId: context.universalCaseId || null,
    organisationId: context.user?.organisationId || null,
    uploadedBy: context.user?._id || context.user?.id || null,
    ownerUserId: context.user?._id || context.user?.id || null,
    documentType: documentRequest.documentType,
    title: `${documentRequest.documentType} from DigiLocker`,
    description: 'Imported reference from DigiLocker',
    tags: ['digilocker'],
    status: 'verified',
    visibility: 'private',
    version: 1,
    storage: {
      provider: DOCUMENT_STORAGE_PROVIDERS.DIGILOCKER_REFERENCE,
      bucket: null,
      objectKey: null,
      region: null,
      endpointRef: 'digilocker',
      signedUrlExpiresAt: null
    },
    file: {
      originalName: `${documentRequest.documentType}.json`,
      storedName: `${documentRequest.documentType}.json`,
      mimeType: 'application/json',
      extension: '.json',
      sizeBytes: 1,
      encoding: 'utf8'
    },
    hash: {
      algorithm: 'sha256',
      checksum: `digilocker-${retrieved.digilockerDocumentId}`,
      computedAt: new Date()
    },
    verification: {
      status: 'digilocker_verified',
      method: 'digilocker',
      verifiedAt: new Date()
    },
    scan: {
      status: 'skipped',
      provider: 'stub',
      scannedAt: new Date(),
      result: 'reference_only'
    },
    permissions: {
      isDownloadAllowed: false,
      isPreviewAllowed: true,
      isPubliclyVerifiable: false
    },
    digilocker: {
      isFromDigiLocker: true,
      digilockerDocumentId: retrieved.digilockerDocumentId,
      issuerName: retrieved.issuerName,
      uri: retrieved.uri,
      fetchedAt: new Date(),
      consentId
    }
  });
  await reconciliationService.logOperation({
    consentId,
    caseId,
    universalCaseId: context.universalCaseId || null,
    documentType: documentRequest.documentType,
    digilockerDocumentId: retrieved.digilockerDocumentId,
    operation: 'document_imported',
    status: 'succeeded',
    responsePayload: { documentId: created.id },
    correlationId: context.correlationId
  });
  return created;
}

async function handleWebhook(payload, _headers, context = {}) {
  await reconciliationService.logOperation({
    consentId: payload.consentId || null,
    caseId: payload.caseId || null,
    universalCaseId: payload.universalCaseId || null,
    operation: 'webhook_received',
    status: 'succeeded',
    requestPayload: payload,
    correlationId: context.correlationId
  });
  return { ok: true };
}

module.exports = {
  handleCallback,
  getConsent,
  revokeConsent,
  listAvailableDocuments,
  retrieveDocument,
  verifyDocument,
  importDocumentToCase,
  handleWebhook
};
