const slaMonitoringService = require('../services/sla-monitoring.service');

async function runSlaMonitoringJob(context = {}) {
  return slaMonitoringService.evaluateAll(new Date(), context);
}

module.exports = { runSlaMonitoringJob };
