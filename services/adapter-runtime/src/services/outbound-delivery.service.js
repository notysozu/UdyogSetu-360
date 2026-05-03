const { QueueValidationError } = require('../../../../packages/shared/src');
const Case = require('../../../case-service/src/models/Case');
const ApprovalTask = require('../../../case-service/src/models/ApprovalTask');
const adapterRuntimeService = require('./adapter-runtime.service');

async function executeOutboundDelivery(message, context = {}) {
  const payload = message.payload || {};
  const [caseDoc, taskDoc] = await Promise.all([
    payload.caseId ? Case.findById(payload.caseId) : payload.universalCaseId ? Case.findOne({ universalCaseId: payload.universalCaseId }) : null,
    payload.taskId ? ApprovalTask.findById(payload.taskId) : null
  ]);

  if (!caseDoc && !payload.universalCaseId) {
    throw new QueueValidationError('Delivery job requires caseId or universalCaseId.');
  }

  const operationContext = {
    ...context,
    correlationId: message.correlationId,
    causationId: message.messageId,
    idempotencyKey: message.idempotencyKey,
    taskId: payload.taskId || taskDoc?._id?.toString?.() || null,
    universalCaseId: payload.universalCaseId || caseDoc?.universalCaseId || null
  };

  let result;
  switch (payload.jobType) {
    case 'submit':
      result = await adapterRuntimeService.submitToDepartment(
        payload.departmentCode || message.departmentCode,
        payload.canonicalPayload || payload,
        operationContext
      );
      break;
    case 'status_check':
      if (!taskDoc?.externalReferenceId && !payload.externalReferenceId) {
        throw new QueueValidationError('Status check requires externalReferenceId.');
      }
      result = await adapterRuntimeService.checkDepartmentStatus(
        payload.departmentCode || message.departmentCode,
        taskDoc?.externalReferenceId || payload.externalReferenceId,
        operationContext
      );
      break;
    case 'document_push':
      result = await adapterRuntimeService.pushDocumentToDepartment(
        payload.departmentCode || message.departmentCode,
        payload.documentPayload || payload.canonicalPayload || payload,
        operationContext
      );
      break;
    default:
      throw new QueueValidationError(`Unsupported job type ${payload.jobType}`);
  }
  return result;
}

module.exports = { executeOutboundDelivery };
