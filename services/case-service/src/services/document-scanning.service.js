const { appendDomainEvent } = require('./event-outbox.service');
const { EVENT_NAMES } = require('../../../../packages/shared/src');
const documentRepository = require('../repositories/document.repository');

async function requestScan(documentId, context = {}) {
  const enabled = String(process.env.DOCUMENT_ENABLE_SCANNING || 'false') === 'true';
  const status = enabled ? 'pending' : 'skipped';
  const document = await documentRepository.updateMetadata(documentId, {
    scan: {
      status,
      provider: process.env.DOCUMENT_SCANNING_PROVIDER || 'stub',
      scannedAt: enabled ? null : new Date(),
      result: enabled ? 'queued' : 'scanning_disabled'
    }
  });
  await appendDomainEvent(
    {
      eventName: EVENT_NAMES.DOCUMENT_SCAN_REQUESTED,
      aggregateType: 'document',
      aggregateId: String(documentId),
      universalCaseId: document?.universalCaseId || null,
      payload: { documentId }
    },
    context
  ).catch(() => {});
  return document;
}

async function markScanClean(documentId, result, context = {}) {
  const document = await documentRepository.updateMetadata(documentId, {
    scan: {
      status: 'clean',
      provider: process.env.DOCUMENT_SCANNING_PROVIDER || 'stub',
      scannedAt: new Date(),
      result: result?.result || 'clean',
      threatName: null,
      rawResultRef: result?.rawResultRef || null
    }
  });
  await appendDomainEvent(
    {
      eventName: EVENT_NAMES.DOCUMENT_SCAN_COMPLETED,
      aggregateType: 'document',
      aggregateId: String(documentId),
      universalCaseId: document?.universalCaseId || null,
      payload: { documentId, outcome: 'clean' }
    },
    context
  ).catch(() => {});
  return document;
}

async function markScanInfected(documentId, result, context = {}) {
  return documentRepository.updateMetadata(documentId, {
    scan: {
      status: 'infected',
      provider: process.env.DOCUMENT_SCANNING_PROVIDER || 'stub',
      scannedAt: new Date(),
      result: result?.result || 'infected',
      threatName: result?.threatName || 'unknown',
      rawResultRef: result?.rawResultRef || null
    }
  });
}

async function markScanFailed(documentId, error) {
  return documentRepository.updateMetadata(documentId, {
    scan: {
      status: 'failed',
      provider: process.env.DOCUMENT_SCANNING_PROVIDER || 'stub',
      scannedAt: new Date(),
      result: error.message,
      threatName: null,
      rawResultRef: null
    }
  });
}

async function handleScanCallback(payload, context = {}) {
  if (payload.status === 'clean') {
    return markScanClean(payload.documentId, payload, context);
  }
  if (payload.status === 'infected') {
    return markScanInfected(payload.documentId, payload, context);
  }
  return markScanFailed(payload.documentId, new Error(payload.message || 'Scan callback failed'));
}

module.exports = {
  requestScan,
  handleScanCallback,
  markScanClean,
  markScanInfected,
  markScanFailed
};
