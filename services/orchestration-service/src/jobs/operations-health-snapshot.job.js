const diagnosticsService = require('../../../../apps/gateway/src/diagnostics/diagnostics.service');
const { createLogger } = require('../../../../packages/shared/src/logger');

const logger = createLogger('orchestration-service');

async function runOperationsHealthSnapshotJob() {
  logger.info('job_started', { job: 'operations-health-snapshot' });
  const health = await diagnosticsService.getServiceHealth();
  logger.info('job_completed', { job: 'operations-health-snapshot', health });
  return health;
}

module.exports = { runOperationsHealthSnapshotJob };
