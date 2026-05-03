const projectionService = require('../services/analytics-projection.service');
const { logger } = require('../../../../packages/shared/src');

async function runAnalyticsProjectionRebuildJob(context = {}) {
  try {
    logger.info('analytics.projection.rebuild.start', { correlationId: context.correlationId || null });
    const summary = await projectionService.rebuildAllProjections({}, context);
    logger.info('analytics.projection.rebuild.completed', { summary });
    return { ok: true, summary };
  } catch (error) {
    logger.error('analytics.projection.rebuild.failed', { message: error.message });
    return { ok: false, error: error.message };
  }
}

module.exports = { runAnalyticsProjectionRebuildJob };
