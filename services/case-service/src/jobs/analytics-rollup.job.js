const projectionService = require('../services/analytics-projection.service');
const { logger } = require('../../../../packages/shared/src');

let running = false;

async function runAnalyticsRollupJob(context = {}) {
  if (running) return { skipped: true, reason: 'rollup_in_progress' };
  running = true;
  try {
    logger.info('analytics.rollup.start', { correlationId: context.correlationId || null });
    const summary = await projectionService.rebuildAllProjections({}, context);
    logger.info('analytics.rollup.completed', { summary });
    return { ok: true, summary };
  } catch (error) {
    logger.error('analytics.rollup.failed', { message: error.message });
    return { ok: false, error: error.message };
  } finally {
    running = false;
  }
}

module.exports = { runAnalyticsRollupJob };
