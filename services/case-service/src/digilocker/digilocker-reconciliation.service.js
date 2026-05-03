const { randomUUID, createHash } = require('crypto');
const repository = require('../repositories/digilocker-reconciliation.repository');

function hashPayload(payload) {
  return createHash('sha256').update(JSON.stringify(payload || {})).digest('hex');
}

async function logOperation(input) {
  return repository.create({
    reconciliationId: input.reconciliationId || randomUUID(),
    consentId: input.consentId || null,
    userId: input.userId || null,
    caseId: input.caseId || null,
    universalCaseId: input.universalCaseId || null,
    documentType: input.documentType || null,
    digilockerDocumentId: input.digilockerDocumentId || null,
    operation: input.operation,
    status: input.status || 'pending',
    requestPayloadHash: input.requestPayloadHash || hashPayload(input.requestPayload),
    responsePayloadHash: input.responsePayloadHash || hashPayload(input.responsePayload),
    externalReference: input.externalReference || null,
    errorCode: input.errorCode || null,
    errorMessage: input.errorMessage || null,
    correlationId: input.correlationId || null,
    metadata: input.metadata || {}
  });
}

module.exports = { logOperation };
