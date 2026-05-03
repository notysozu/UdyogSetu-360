const { createHash } = require('crypto');
const { appendDomainEvent } = require('../../../case-service/src/services/event-outbox.service');
const ApprovalTask = require('../../../case-service/src/models/ApprovalTask');
const { maskSensitiveFields } = require('../transformers/payload-transformers');

function extractExternalReferenceId(rawResponse = {}, mappingProfile = null) {
  return (
    rawResponse.externalReferenceId ||
    rawResponse.applicationNo ||
    rawResponse.referenceId ||
    mappingProfile?.extractors?.externalReferenceId?.(rawResponse) ||
    null
  );
}

function extractAcknowledgementNumber(rawResponse = {}, mappingProfile = null) {
  return (
    rawResponse.acknowledgementNumber ||
    rawResponse.ackNo ||
    mappingProfile?.extractors?.acknowledgementNumber?.(rawResponse) ||
    null
  );
}

function buildCanonicalAcknowledgement(result, context = {}) {
  const rawResponseHash = createHash('sha256')
    .update(JSON.stringify(maskSensitiveFields(result.rawResponse || {})))
    .digest('hex');
  return {
    departmentCode: result.departmentCode,
    adapterCode: result.adapterCode,
    operation: result.operation,
    externalReferenceId: result.externalReferenceId || null,
    acknowledgementNumber: result.acknowledgement?.acknowledgementNumber || null,
    acknowledgedAt: result.acknowledgement?.acknowledgedAt || new Date().toISOString(),
    externalStatus: result.status?.externalStatus || null,
    canonicalStatus: result.status?.canonicalStatus || null,
    message: result.acknowledgement?.message || result.status?.statusMessage || null,
    rawResponseHash,
    correlationId: context.correlationId || result.metadata?.correlationId || null
  };
}

async function persistAcknowledgement(taskId, acknowledgement, _context = {}) {
  if (!taskId) {
    return { persisted: false, reason: 'missing_task_id' };
  }
  const taskDoc = await ApprovalTask.findById(taskId);
  if (!taskDoc) {
    return { persisted: false, reason: 'task_not_found' };
  }
  taskDoc.externalReferenceId = acknowledgement.externalReferenceId || taskDoc.externalReferenceId;
  taskDoc.departmentPayload = {
    ...(taskDoc.departmentPayload || {}),
    acknowledgement
  };
  taskDoc.lastSyncedAt = new Date();
  await taskDoc.save();
  return { persisted: true };
}

async function appendAcknowledgementEvent(acknowledgement, context = {}) {
  if (!acknowledgement?.externalReferenceId && !acknowledgement?.acknowledgementNumber) {
    return { appended: false };
  }
  await appendDomainEvent(
    {
      eventName: 'integration.dispatch_succeeded.v1',
      aggregateType: 'approval_task',
      aggregateId: context.taskId || acknowledgement.externalReferenceId || acknowledgement.acknowledgementNumber,
      universalCaseId: context.universalCaseId || null,
      source: 'us360.adapter-runtime',
      correlationId: acknowledgement.correlationId,
      payload: acknowledgement
    },
    { correlationId: acknowledgement.correlationId, actor: context.actor }
  );
  return { appended: true };
}

async function captureAcknowledgement(adapterResult, context = {}) {
  const acknowledgement = buildCanonicalAcknowledgement(adapterResult, context);
  const persisted = await persistAcknowledgement(context.taskId, acknowledgement, context);
  await appendAcknowledgementEvent(acknowledgement, context).catch(() => {});
  return {
    acknowledgement,
    persisted
  };
}

module.exports = {
  captureAcknowledgement,
  extractExternalReferenceId,
  extractAcknowledgementNumber,
  buildCanonicalAcknowledgement,
  persistAcknowledgement,
  appendAcknowledgementEvent
};
