const {
  ADAPTER_TYPE_VALUES,
  ADAPTER_CAPABILITY_VALUES,
  DEPARTMENT_CODE_VALUES
} = require('../../../../packages/shared/src');

function validateAdapterConfig(config = {}) {
  const errors = [];
  if (!DEPARTMENT_CODE_VALUES.includes(config.departmentCode)) {
    errors.push('departmentCode must be valid.');
  }
  if (!config.adapterCode) {
    errors.push('adapterCode is required.');
  }
  if (!ADAPTER_TYPE_VALUES.includes(config.adapterType)) {
    errors.push('adapterType must be valid.');
  }
  if (config.capabilities && !config.capabilities.every((capability) => ADAPTER_CAPABILITY_VALUES.includes(capability))) {
    errors.push('capabilities contain unsupported values.');
  }
  if (config.isActive && config.adapterType !== 'human_assisted' && !config.baseUrl && !config.fileDrop && !config.database && !config.webhook && !config.rpa && !String(config.adapterCode).includes('_mock_')) {
    errors.push('Active real adapters must provide type-specific configuration.');
  }
  if (config.isActive && !String(config.adapterCode).includes('_mock_') && !config.secretsRef && !config.auth?.secretRef && config.adapterType !== 'human_assisted') {
    errors.push('secretsRef or auth.secretRef is required for real integrations.');
  }
  if (config.auth?.clientSecret || config.auth?.token || config.auth?.password) {
    errors.push('Raw secrets must not be stored in adapter config.');
  }
  if (config.timeoutMs != null && Number(config.timeoutMs) <= 0) {
    errors.push('timeoutMs must be positive.');
  }
  if (config.retryPolicy?.maxAttempts != null && Number(config.retryPolicy.maxAttempts) > 20) {
    errors.push('retryPolicy.maxAttempts is unreasonably high.');
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = { validateAdapterConfig };
