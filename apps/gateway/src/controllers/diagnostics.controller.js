const diagnosticsService = require('../diagnostics/diagnostics.service');
const stuckCaseDetector = require('../../../../services/orchestration-service/src/stuck-case/stuck-case-detector.service');

function envelope(req, data) {
  return {
    success: true,
    data,
    error: null,
    meta: {
      correlationId: req.context?.correlationId || req.correlationId || null,
      timestamp: new Date().toISOString()
    }
  };
}

async function health(req, res) { res.json(envelope(req, { health: await diagnosticsService.getServiceHealth() })); }
async function readiness(req, res) { res.json(envelope(req, await diagnosticsService.getReadinessReport())); }
async function config(req, res) { res.json(envelope(req, await diagnosticsService.getSafeConfig())); }
async function dependencies(req, res) { res.json(envelope(req, await diagnosticsService.getDependencyStatus())); }
async function queues(req, res) { res.json(envelope(req, await diagnosticsService.getQueueBacklog())); }
async function kafka(req, res) { res.json(envelope(req, await diagnosticsService.getKafkaStatus())); }
async function rabbitmq(req, res) { res.json(envelope(req, await diagnosticsService.getRabbitMqStatus())); }
async function adapters(req, res) { res.json(envelope(req, await diagnosticsService.getAdapterStatus())); }
async function consumers(req, res) { res.json(envelope(req, await diagnosticsService.getConsumerLagOrSlowConsumers())); }
async function jobs(req, res) { res.json(envelope(req, await diagnosticsService.getScheduledJobStatus())); }
async function stuckCases(req, res) { res.json(envelope(req, await diagnosticsService.listStuckCases({}, req.query || {}))); }
async function caseTrace(req, res) { res.json(envelope(req, await diagnosticsService.getCaseTraceHistory(req.params.caseId))); }
async function correlationTrace(req, res) { res.json(envelope(req, await diagnosticsService.getCorrelationTrace(req.params.correlationId))); }
async function runStuckCaseScan(req, res) {
  const result = await stuckCaseDetector.scanForStuckCases({
    correlationId: req.context?.correlationId || null,
    userId: req.context?.actor?.id || null,
    role: req.context?.actor?.role || null,
    actor: {
      actorType: 'user',
      actorId: req.context?.actor?.id || null,
      role: req.context?.actor?.role || null,
      serviceName: 'gateway'
    },
    manualTrigger: true
  });
  await stuckCaseDetector.auditAdminScan({
    correlationId: req.context?.correlationId || null,
    userId: req.context?.actor?.id || null,
    role: req.context?.actor?.role || null,
    actor: {
      actorType: 'user',
      actorId: req.context?.actor?.id || null,
      role: req.context?.actor?.role || null,
      serviceName: 'gateway'
    },
    manualTrigger: true
  });
  res.json(envelope(req, result));
}

module.exports = {
  health,
  readiness,
  config,
  dependencies,
  queues,
  kafka,
  rabbitmq,
  adapters,
  consumers,
  jobs,
  stuckCases,
  caseTrace,
  correlationTrace,
  runStuckCaseScan
};
