const ADAPTER_TYPES = Object.freeze({
  REST_API: 'rest_api',
  SFTP_FILE_DROP: 'sftp_file_drop',
  DATABASE: 'database',
  WEBHOOK: 'webhook',
  HUMAN_ASSISTED: 'human_assisted',
  RPA: 'rpa'
});

const ADAPTER_TYPE_VALUES = Object.freeze(Object.values(ADAPTER_TYPES));

const ADAPTER_CAPABILITIES = Object.freeze({
  SUBMIT_APPLICATION: 'submit_application',
  STATUS_CHECK: 'status_check',
  DOCUMENT_PUSH: 'document_push',
  CALLBACK_RECEIVE: 'callback_receive',
  CERTIFICATE_PULL: 'certificate_pull',
  FEE_STATUS_PULL: 'fee_status_pull',
  INSPECTION_STATUS_PULL: 'inspection_status_pull',
  MANUAL_UPDATE: 'manual_update',
  HEALTH_CHECK: 'health_check'
});

const ADAPTER_CAPABILITY_VALUES = Object.freeze(Object.values(ADAPTER_CAPABILITIES));

const ADAPTER_ERROR_CLASSIFICATIONS = Object.freeze({
  RETRYABLE: 'retryable',
  NON_RETRYABLE: 'non_retryable',
  CONFIGURATION: 'configuration',
  AUTHENTICATION: 'authentication',
  AUTHORISATION: 'authorisation',
  VALIDATION: 'validation',
  MAPPING: 'mapping',
  TIMEOUT: 'timeout',
  UNAVAILABLE: 'unavailable',
  RATE_LIMITED: 'rate_limited',
  CONFLICT: 'conflict',
  UNKNOWN: 'unknown'
});

const ADAPTER_ENVIRONMENTS = Object.freeze(['development', 'staging', 'production']);

module.exports = {
  ADAPTER_TYPES,
  ADAPTER_TYPE_VALUES,
  ADAPTER_CAPABILITIES,
  ADAPTER_CAPABILITY_VALUES,
  ADAPTER_ERROR_CLASSIFICATIONS,
  ADAPTER_ENVIRONMENTS
};
