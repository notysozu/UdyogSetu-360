const {
  ADAPTER_CAPABILITIES,
  EVENT_NAMES,
  AdapterValidationError
} = require('../../../../packages/shared/src');
const { appendDomainEvent } = require('../../../case-service/src/services/event-outbox.service');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');
const {
  captureAcknowledgement
} = require('./acknowledgement-capture.service');
const { createAdapterForDepartment, loadActiveAdapters, reloadAdapter } = require('./adapter-factory');
const { buildCanonicalDepartmentPayload } = require('../transformers/canonical-payload-builder');

function actorFromContext(context = {}) {
  return context.actor || {
    id: 'adapter-runtime',
    primaryRole: 'system',
    permissions: ['system.internal_call']
  };
}

async function appendDispatchEvent(eventName, payload, context = {}) {
  try {
    await appendDomainEvent(
      {
        eventName,
        aggregateType: 'approval_task',
        aggregateId: payload.taskId || payload.externalReferenceId || payload.departmentCode || payload.universalCaseId || 'adapter-runtime',
        universalCaseId: payload.universalCaseId || null,
        source: 'us360.adapter-runtime',
        correlationId: context.correlationId || null,
        causationId: context.causationId || null,
        idempotencyKey: context.idempotencyKey || null,
        payload
      },
      { correlationId: context.correlationId, actor: actorFromContext(context) }
    );
    return true;
  } catch (_error) {
    return false;
  }
}

async function audit(action, resourceId, metadata, context = {}) {
  return recordAuditEvent(
    {
      actor: actorFromContext(context),
      action,
      resourceType: 'adapter_runtime',
      resourceId,
      universalCaseId: metadata.universalCaseId || null,
      correlationId: context.correlationId || null,
      metadata
    },
    { correlationId: context.correlationId, actor: actorFromContext(context) }
  );
}

async function submitToDepartment(departmentCode, canonicalPayload, context = {}) {
  const adapter = await createAdapterForDepartment(departmentCode, context);
  if (!adapter.supports(ADAPTER_CAPABILITIES.SUBMIT_APPLICATION)) {
    throw new AdapterValidationError(`Adapter ${adapter.adapterCode} does not support submit_application.`);
  }
  await appendDispatchEvent(EVENT_NAMES.INTEGRATION_DISPATCH_REQUESTED, {
    departmentCode,
    universalCaseId: canonicalPayload.universalCaseId || context.universalCaseId || null,
    taskId: canonicalPayload.taskId || context.taskId || null,
    operation: 'submit_application'
  }, context);
  await audit('adapter.submit.requested', adapter.adapterCode, {
    departmentCode,
    universalCaseId: canonicalPayload.universalCaseId || null
  }, context);

  try {
    const result = await adapter.submitApplication(canonicalPayload, context);
    await captureAcknowledgement(result, {
      ...context,
      taskId: canonicalPayload.taskId || context.taskId || null,
      universalCaseId: canonicalPayload.universalCaseId || null
    });
    await appendDispatchEvent(EVENT_NAMES.INTEGRATION_DISPATCH_SUCCEEDED, {
      departmentCode,
      universalCaseId: canonicalPayload.universalCaseId || null,
      taskId: canonicalPayload.taskId || null,
      operation: 'submit_application',
      externalReferenceId: result.externalReferenceId || null
    }, context);
    await audit('adapter.submit.succeeded', adapter.adapterCode, {
      departmentCode,
      universalCaseId: canonicalPayload.universalCaseId || null,
      externalReferenceId: result.externalReferenceId || null
    }, context);
    return result;
  } catch (error) {
    await appendDispatchEvent(EVENT_NAMES.INTEGRATION_DISPATCH_FAILED, {
      departmentCode,
      universalCaseId: canonicalPayload.universalCaseId || null,
      taskId: canonicalPayload.taskId || null,
      operation: 'submit_application',
      errorCode: error.code || error.name
    }, context);
    await audit('adapter.submit.failed', adapter.adapterCode, {
      departmentCode,
      universalCaseId: canonicalPayload.universalCaseId || null,
      errorCode: error.code || error.name
    }, context);
    throw error;
  }
}

async function checkDepartmentStatus(departmentCode, externalReferenceId, context = {}) {
  const adapter = await createAdapterForDepartment(departmentCode, context);
  if (!adapter.supports(ADAPTER_CAPABILITIES.STATUS_CHECK)) {
    throw new AdapterValidationError(`Adapter ${adapter.adapterCode} does not support status_check.`);
  }
  return adapter.getStatus(externalReferenceId, context);
}

async function pushDocumentToDepartment(departmentCode, documentPayload, context = {}) {
  const adapter = await createAdapterForDepartment(departmentCode, context);
  if (!adapter.supports(ADAPTER_CAPABILITIES.DOCUMENT_PUSH)) {
    throw new AdapterValidationError(`Adapter ${adapter.adapterCode} does not support document_push.`);
  }
  return adapter.pushDocument(documentPayload, context);
}

async function processDepartmentCallback(departmentCode, callbackPayload, headers = {}, context = {}) {
  const adapter = await createAdapterForDepartment(departmentCode, context);
  if (!adapter.supports(ADAPTER_CAPABILITIES.CALLBACK_RECEIVE)) {
    throw new AdapterValidationError(`Adapter ${adapter.adapterCode} does not support callback_receive.`);
  }
  try {
    adapter.validateSignature(callbackPayload, headers, context);
  } catch (error) {
    await audit('adapter.callback.signature_failed', adapter.adapterCode, {
      departmentCode,
      errorCode: error.code || error.name
    }, context);
    throw error;
  }
  const result = await adapter.receiveCallback(callbackPayload, context);
  await appendDispatchEvent(EVENT_NAMES.INTEGRATION_CALLBACK_RECEIVED, {
    departmentCode,
    universalCaseId: callbackPayload.universalCaseId || null,
    taskId: callbackPayload.taskId || null,
    callbackType: callbackPayload.callbackType || null,
    status: callbackPayload.status || null
  }, context);
  await audit('adapter.callback.received', adapter.adapterCode, {
    departmentCode,
    universalCaseId: callbackPayload.universalCaseId || null,
    externalReferenceId: callbackPayload.externalReferenceId || null
  }, context);
  return result;
}

async function getAdapterHealth(departmentCode, context = {}) {
  const adapter = await createAdapterForDepartment(departmentCode, context);
  return adapter.healthCheck(context);
}

async function listAdapterHealth(context = {}) {
  const adapters = await loadActiveAdapters();
  return Promise.all(
    adapters.map((adapter) =>
      adapter.healthCheck(context).catch((error) =>
        adapter.buildFailure('health_check', error, { correlationId: context.correlationId })
      )
    )
  );
}

async function reloadDepartmentAdapter(departmentCode, context = {}) {
  const adapter = await reloadAdapter(departmentCode);
  await audit('adapter.config.reloaded', adapter.adapterCode, { departmentCode }, context);
  return {
    ok: true,
    departmentCode,
    adapterCode: adapter.adapterCode
  };
}

function buildPayloadFromCase(taskDoc, caseDoc, documents, context = {}) {
  return buildCanonicalDepartmentPayload(caseDoc, taskDoc, documents, context);
}

module.exports = {
  submitToDepartment,
  checkDepartmentStatus,
  pushDocumentToDepartment,
  processDepartmentCallback,
  getAdapterHealth,
  listAdapterHealth,
  reloadAdapter: reloadDepartmentAdapter,
  buildPayloadFromCase
};
