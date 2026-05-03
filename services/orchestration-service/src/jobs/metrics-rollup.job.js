const { createLogger } = require('../../../../packages/shared/src/logger');
const metrics = require('../../../../packages/shared/src/metrics/metrics-registry');

const logger = createLogger('orchestration-service');

async function runMetricsRollupJob() {
  logger.info('job_started', { job: 'metrics-rollup' });
  const snapshot = metrics.snapshot();
  logger.info('job_completed', { job: 'metrics-rollup', counters: Object.keys(snapshot.counters).length });
  return snapshot;
}

module.exports = { runMetricsRollupJob };
