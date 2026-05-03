const slaMonitoringService = require('../services/sla-monitoring.service');

async function runGrievanceAgeingRollupJob(context = {}) {
  const user = context.user || { role: 'admin', primaryRole: 'admin' };
  return slaMonitoringService.getGrievanceAgeingDashboard(user, context.filters || {});
}

module.exports = { runGrievanceAgeingRollupJob };
