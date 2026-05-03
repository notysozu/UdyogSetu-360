const aggregationService = require('./analytics-aggregation.service');

function buildScore(input = {}) {
  const waitTimeFactor = Math.min(30, Number(input.averageWaitHours || 0) / 4);
  const backlogFactor = Math.min(25, Number(input.queueDepth || 0) * 1.5);
  const breachFactor = Math.min(25, Number(input.slaBreachCount || 0) * 2);
  const trendFactor = input.trendDirection === 'up' ? 15 : input.trendDirection === 'down' ? 2 : 8;
  const severityFactor = input.severity === 'critical' ? 5 : input.severity === 'high' ? 4 : input.severity === 'medium' ? 3 : 2;
  return Math.min(100, Number((waitTimeFactor + backlogFactor + breachFactor + trendFactor + severityFactor).toFixed(2)));
}

async function detectBottlenecks(dateRange = {}, filters = {}, context = {}) {
  const rows = await aggregationService.aggregateBottlenecks(dateRange, filters, context);
  return rows.map((row) => ({
    ...row,
    bottleneckScore: buildScore(row),
    likelyCause: row.likelyCause || 'Stage wait time and backlog growth exceed threshold.',
    recommendedAction:
      row.recommendedAction ||
      'Review staffing, prioritize oldest pending cases, and trigger supervisor escalation for breached tasks.'
  }));
}

module.exports = { detectBottlenecks, buildScore };
