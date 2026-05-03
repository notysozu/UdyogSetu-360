const { createLogger } = require('../../../../packages/shared/src/logger');
const {
  ADAPTER_TYPES,
  AdapterConfigError
} = require('../../../../packages/shared/src');
const { validateAdapterConfig } = require('../config/adapter-config.schema');
const { STATIC_ADAPTER_CONFIGS } = require('../config/static-adapter-configs');
const adapterRegistry = require('./adapter-registry');
const adapterConfigRepository = require('../repositories/adapter-config.repository');
const { PollutionMockAdapter } = require('../adapters/pollution/PollutionMockAdapter');
const { PowerMockAdapter } = require('../adapters/power/PowerMockAdapter');
const { FireMockAdapter } = require('../adapters/fire/FireMockAdapter');
const { IndustrialSafetyMockAdapter } = require('../adapters/industrial-safety/IndustrialSafetyMockAdapter');
const { LabourMockAdapter } = require('../adapters/labour/LabourMockAdapter');
const { RestDepartmentAdapter } = require('../adapters/rest/RestDepartmentAdapter');
const { SftpDepartmentAdapter } = require('../adapters/sftp/SftpDepartmentAdapter');
const { DatabaseDepartmentAdapter } = require('../adapters/database/DatabaseDepartmentAdapter');
const { WebhookDepartmentAdapter } = require('../adapters/webhook/WebhookDepartmentAdapter');
const { HumanAssistedAdapter } = require('../adapters/human-assisted/HumanAssistedAdapter');
const { RpaDepartmentAdapter } = require('../adapters/rpa/RpaDepartmentAdapter');

const logger = createLogger('adapter-factory');
const instanceCache = new Map();

const ADAPTER_CLASS_MAP = {
  pollution_mock_v1: PollutionMockAdapter,
  power_mock_v1: PowerMockAdapter,
  fire_mock_v1: FireMockAdapter,
  industrial_safety_mock_v1: IndustrialSafetyMockAdapter,
  labour_mock_v1: LabourMockAdapter
};

const BASE_TYPE_CLASS_MAP = {
  [ADAPTER_TYPES.REST_API]: RestDepartmentAdapter,
  [ADAPTER_TYPES.SFTP_FILE_DROP]: SftpDepartmentAdapter,
  [ADAPTER_TYPES.DATABASE]: DatabaseDepartmentAdapter,
  [ADAPTER_TYPES.WEBHOOK]: WebhookDepartmentAdapter,
  [ADAPTER_TYPES.HUMAN_ASSISTED]: HumanAssistedAdapter,
  [ADAPTER_TYPES.RPA]: RpaDepartmentAdapter
};

function registerKnownAdapterClasses() {
  [
    PollutionMockAdapter,
    PowerMockAdapter,
    FireMockAdapter,
    IndustrialSafetyMockAdapter,
    LabourMockAdapter
  ].forEach((adapterClass) => {
    try {
      adapterRegistry.registerAdapter(adapterClass);
    } catch (_error) {
      // ignore duplicate registration during reloads
    }
  });
}

registerKnownAdapterClasses();

function validateAdapterInstance(adapter) {
  if (!adapter?.departmentCode || !adapter?.adapterCode || typeof adapter.submitApplication !== 'function') {
    throw new AdapterConfigError('Adapter instance is invalid.');
  }
  return true;
}

function buildRuntimeConfig(adapterConfig) {
  return {
    ...(adapterConfig.toObject?.() || adapterConfig),
    logger: createLogger(`adapter-${adapterConfig.departmentCode}`)
  };
}

async function createAdapter(adapterConfig) {
  const plainConfig = buildRuntimeConfig(adapterConfig);
  const validation = validateAdapterConfig(plainConfig);
  if (!validation.valid) {
    throw new AdapterConfigError(`Adapter config invalid: ${validation.errors.join(' ')}`);
  }

  const AdapterClass = ADAPTER_CLASS_MAP[plainConfig.adapterCode] || BASE_TYPE_CLASS_MAP[plainConfig.adapterType];
  if (!AdapterClass) {
    throw new AdapterConfigError(`No adapter implementation found for ${plainConfig.adapterCode || plainConfig.adapterType}`);
  }

  const instance = new AdapterClass(plainConfig);
  instance.validateConfig();
  validateAdapterInstance(instance);
  await instance.initialise();
  adapterRegistry.registerAdapterInstance(instance);
  instanceCache.set(plainConfig.departmentCode, instance);
  return instance;
}

async function getConfigForDepartment(departmentCode) {
  const repositoryConfig = await adapterConfigRepository.findActiveByDepartment(departmentCode);
  if (repositoryConfig) return repositoryConfig;
  return STATIC_ADAPTER_CONFIGS.find((entry) => entry.departmentCode === departmentCode) || null;
}

async function createAdapterForDepartment(departmentCode, context = {}) {
  if (instanceCache.has(departmentCode)) {
    return instanceCache.get(departmentCode);
  }
  const config = await getConfigForDepartment(departmentCode);
  if (!config) {
    throw new AdapterConfigError(`No adapter config found for department ${departmentCode}.`, {
      code: 'ADAPTER_CONFIG_NOT_FOUND'
    });
  }
  logger.info('adapter_instance_created', {
    departmentCode,
    correlationId: context.correlationId || null,
    adapterCode: config.adapterCode
  });
  return createAdapter(config);
}

async function loadActiveAdapters() {
  const configs = await adapterConfigRepository.listActive();
  const source = configs.length ? configs : STATIC_ADAPTER_CONFIGS;
  const loaded = [];
  for (const config of source) {
    loaded.push(await createAdapter(config));
  }
  return loaded;
}

async function reloadAdapter(departmentCode) {
  const existing = instanceCache.get(departmentCode);
  if (existing?.close) {
    await existing.close().catch(() => {});
  }
  instanceCache.delete(departmentCode);
  return createAdapterForDepartment(departmentCode, {});
}

module.exports = {
  createAdapter,
  createAdapterForDepartment,
  loadActiveAdapters,
  reloadAdapter,
  validateAdapterInstance
};
