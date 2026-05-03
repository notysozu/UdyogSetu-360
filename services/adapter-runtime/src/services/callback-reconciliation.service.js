const {
  EVENT_NAMES,
  TASK_STATUSES,
  QueueValidationError,
  CallbackReconciliationError,
  NonRetryableQueueError
} = require('../../../../packages/shared/src');
const ApprovalTask = require('../../../case-service/src/models/ApprovalTask');
const Case = require('../../../case-service/src/models/Case');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');
const taskLifecycleService = require('../../../orchestration-service/src/services/task-lifecycle.service');
const adapterRuntimeService = require('./adapter-runtime.service');

function mapCallbackToAction(callbackType, status) {
  const key = `${callbackType}:${status}`.toLowerCase();
  const mapping = {
    'query_raised:open': { method: 'raiseQuery', nextStatus: TASK_STATUSES.QUERY_RAISED },
    'inspection_scheduled:scheduled': { method: 'scheduleInspection', nextStatus: TASK_STATUSES.INSPECTION_SCHEDULED },
    'inspection_completed:completed': { method: 'completeInspection', nextStatus: TASK_STATUSES.INSPECTION_COMPLETED },
    'fee_demanded:pending': { method: 'demandFee', nextStatus: TASK_STATUSES.FEE_DEMANDED },
    'fee_paid:paid': { method: 'markFeePaid', nextStatus: TASK_STATUSES.FEE_PAID },
    'approved:approved': { method: 'approveTask', nextStatus: TASK_STATUSES.APPROVED },
    'rejected:rejected': { method: 'rejectTask', nextStatus: TASK_STATUSES.REJECTED },
    'certificate_issued:issued': { method: 'issueCertificate', nextStatus: TASK_STATUSES.CERTIFICATE_ISSUED }
  };
  return mapping[key] || null;
}

async function findMatchingTask(payload) {
  if (payload.universalCaseId) {
    const byCase = await ApprovalTask.findOne({
      universalCaseId: payload.universalCaseId,
      departmentCode: payload.departmentCode,
      isDeleted: false
    });
    if (byCase) return byCase;
  }

  if (payload.externalReferenceId) {
    const byRef = await ApprovalTask.findOne({
      externalReferenceId: payload.externalReferenceId,
      departmentCode: payload.departmentCode,
      isDeleted: false
    });
    if (byRef) return byRef;
  }

  if (payload.taskId) {
    return ApprovalTask.findById(payload.taskId);
  }

  return null;
}

async function executeCallbackReconciliation(message, context = {}) {
  const payload = message.payload || {};
  if (!payload.departmentCode || !payload.callbackType || !payload.status) {
    throw new QueueValidationError('Callback payload is missing required fields.');
  }

  await adapterRuntimeService.processDepartmentCallback(payload.departmentCode, payload, payload.headers || {}, {
    ...context,
    correlationId: message.correlationId,
    causationId: message.messageId,
    idempotencyKey: message.idempotencyKey
  });

  const action = mapCallbackToAction(payload.callbackType, payload.status);
  if (!action) {
    throw new NonRetryableQueueError(`Unsupported callback transition ${payload.callbackType}:${payload.status}`);
  }

  const taskDoc = await findMatchingTask(payload);
  if (!taskDoc) {
    throw new CallbackReconciliationError('Matching task not found yet.');
  }

  const caseDoc = await Case.findById(taskDoc.caseId);
  if (!caseDoc) {
    throw new CallbackReconciliationError('Matching case not found yet.');
  }

  const lifecyclePayload = {
    reason: payload.remarks || payload.callbackType,
    externalReferenceId: payload.externalReferenceId || taskDoc.externalReferenceId || null,
    documents: payload.documents || [],
    callbackPayload: payload
  };
  const actor = context.actor || {
    id: 'adapter-runtime',
    primaryRole: 'system',
    permissions: ['system.internal_call']
  };

  await taskLifecycleService[action.method](taskDoc._id, lifecyclePayload, {
    actor,
    correlationId: message.correlationId,
    causationId: message.messageId,
    idempotencyKey: message.idempotencyKey
  });

  await recordAuditEvent(
    {
      actor,
      action: 'queue.callback_reconciled',
      resourceType: 'approval_task',
      resourceId: String(taskDoc._id),
      caseId: String(caseDoc._id),
      universalCaseId: caseDoc.universalCaseId,
      correlationId: message.correlationId,
      metadata: {
        callbackType: payload.callbackType,
        departmentCode: payload.departmentCode,
        status: payload.status
      }
    },
    { correlationId: message.correlationId, actor }
  );

  return {
    ok: true,
    taskId: String(taskDoc._id),
    universalCaseId: caseDoc.universalCaseId,
    nextStatus: action.nextStatus
  };
}

module.exports = {
  executeCallbackReconciliation,
  findMatchingTask,
  mapCallbackToAction
};
