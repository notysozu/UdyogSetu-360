const { runAnalyticsRollupJob } = require('./analytics-rollup.job');

async function runAnalyticsDailyRollupJob(context = {}) {
  return runAnalyticsRollupJob({
    ...context,
    jobType: 'daily_rollup'
  });
}

module.exports = { runAnalyticsDailyRollupJob };
