const {
  DEPARTMENT_CODE_VALUES,
  ADAPTER_TYPE_VALUES
} = require('../../../../packages/shared/src');
const { AdapterValidationError } = require('../errors/adapter.errors');

function assert(condition, message) {
  if (!condition) {
    throw new AdapterValidationError(message);
  }
}

function departmentCodeParamSchema(value) {
  assert(DEPARTMENT_CODE_VALUES.includes(value), `Unsupported departmentCode: ${value}`);
  return value;
}

function statusParamSchema(value) {
  assert(Boolean(value), 'externalReferenceId is required.');
  return value;
}

function submitApplicationSchema(payload = {}) {
  assert(payload.canonicalPayload || payload.universalCaseId || payload.enterprise || payload.project, 'canonicalPayload is required.');
  return payload.canonicalPayload || payload;
}

function pushDocumentSchema(payload = {}) {
  assert(payload.documentId || payload.documentType || payload.objectKey || payload.downloadUrl || payload.signedUrl, 'document payload reference is required.');
  return payload;
}

function callbackPayloadSchema(payload = {}) {
  assert(payload && typeof payload === 'object' && !Array.isArray(payload), 'callback payload object is required.');
  return payload;
}

function adapterConfigSchema(payload = {}) {
  assert(DEPARTMENT_CODE_VALUES.includes(payload.departmentCode), 'departmentCode invalid.');
  assert(ADAPTER_TYPE_VALUES.includes(payload.adapterType), 'adapterType invalid.');
  return payload;
}

function reloadAdapterSchema(payload = {}) {
  return payload;
}

module.exports = {
  departmentCodeParamSchema,
  statusParamSchema,
  submitApplicationSchema,
  pushDocumentSchema,
  callbackPayloadSchema,
  adapterConfigSchema,
  reloadAdapterSchema,
  validateDepartmentCode: departmentCodeParamSchema,
  validateSubmitPayload: submitApplicationSchema,
  validateDocumentPayload: pushDocumentSchema,
  validateCallbackPayload: callbackPayloadSchema
};
