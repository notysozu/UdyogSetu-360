const slaMonitoringService = require('../services/sla-monitoring.service');

async function runApprovalAgeingRollupJob(context = {}) {
  const user = context.user || { role: 'admin', primaryRole: 'admin' };
  return slaMonitoringService.getApprovalAgeingDashboard(user, context.filters || {});
}

module.exports = { runApprovalAgeingRollupJob };
