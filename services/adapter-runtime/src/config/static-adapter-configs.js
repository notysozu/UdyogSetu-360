const {
  ADAPTER_CAPABILITIES,
  ADAPTER_TYPES
} = require('../../../../packages/shared/src');

const sharedCapabilities = [
  ADAPTER_CAPABILITIES.SUBMIT_APPLICATION,
  ADAPTER_CAPABILITIES.STATUS_CHECK,
  ADAPTER_CAPABILITIES.DOCUMENT_PUSH,
  ADAPTER_CAPABILITIES.CALLBACK_RECEIVE,
  ADAPTER_CAPABILITIES.HEALTH_CHECK
];

const STATIC_ADAPTER_CONFIGS = Object.freeze([
  {
    departmentCode: 'pollution',
    adapterCode: 'pollution_mock_v1',
    adapterType: ADAPTER_TYPES.REST_API,
    displayName: 'Pollution Mock Adapter',
    description: 'Mock Karnataka State Pollution Control Board integration',
    version: 'v1',
    isActive: true,
    environment: 'development',
    integrationType: 'rest_api',
    name: 'pollution-mock',
    capabilities: sharedCapabilities,
    timeoutMs: 3000,
    retryPolicy: { maxAttempts: 5 },
    metadata: { mock: true }
  },
  {
    departmentCode: 'power',
    adapterCode: 'power_mock_v1',
    adapterType: ADAPTER_TYPES.REST_API,
    displayName: 'Power Mock Adapter',
    description: 'Mock BESCOM integration',
    version: 'v1',
    isActive: true,
    environment: 'development',
    integrationType: 'rest_api',
    name: 'power-mock',
    capabilities: sharedCapabilities,
    timeoutMs: 3000,
    retryPolicy: { maxAttempts: 5 },
    metadata: { mock: true }
  },
  {
    departmentCode: 'fire',
    adapterCode: 'fire_mock_v1',
    adapterType: ADAPTER_TYPES.REST_API,
    displayName: 'Fire Mock Adapter',
    description: 'Mock fire and emergency services integration',
    version: 'v1',
    isActive: true,
    environment: 'development',
    integrationType: 'rest_api',
    name: 'fire-mock',
    capabilities: sharedCapabilities,
    timeoutMs: 3000,
    retryPolicy: { maxAttempts: 5 },
    metadata: { mock: true }
  },
  {
    departmentCode: 'industrial_safety',
    adapterCode: 'industrial_safety_mock_v1',
    adapterType: ADAPTER_TYPES.REST_API,
    displayName: 'Industrial Safety Mock Adapter',
    description: 'Mock DFBIS integration',
    version: 'v1',
    isActive: true,
    environment: 'development',
    integrationType: 'rest_api',
    name: 'industrial-safety-mock',
    capabilities: sharedCapabilities,
    timeoutMs: 3000,
    retryPolicy: { maxAttempts: 5 },
    metadata: { mock: true }
  },
  {
    departmentCode: 'labour',
    adapterCode: 'labour_mock_v1',
    adapterType: ADAPTER_TYPES.REST_API,
    displayName: 'Labour Mock Adapter',
    description: 'Mock labour department integration',
    version: 'v1',
    isActive: true,
    environment: 'development',
    integrationType: 'rest_api',
    name: 'labour-mock',
    capabilities: sharedCapabilities,
    timeoutMs: 3000,
    retryPolicy: { maxAttempts: 5 },
    metadata: { mock: true }
  }
]);

module.exports = { STATIC_ADAPTER_CONFIGS };
