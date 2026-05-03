const mongoose = require('mongoose');
const { createGatewayProxyService } = require('../services/gateway-proxy.service');
const DomainEvent = require('../../../../services/case-service/src/models/DomainEvent');
const AuditEvent = require('../../../../services/audit-service/src/models/AuditEvent');
const Notification = require('../../../../services/notification-service/src/models/Notification');
const Grievance = require('../../../../services/case-service/src/models/Grievance');
const SlaTimer = require('../../../../services/case-service/src/models/SlaTimer');
const StuckCaseFinding = require('../../../../services/orchestration-service/src/stuck-case/StuckCaseFinding');
const ReplayAttempt = require('../../../../services/orchestration-service/src/replay/ReplayAttempt');

const proxy = createGatewayProxyService();

function serviceStatus(data) {
  if (!data) return 'degraded';
  if (data.ok === true) return 'ok';
  return 'degraded';
}

async function getServiceHealth() {
  const [caseHealth, auditHealth, notificationHealth, orchestrationHealth, adapterHealth] = await Promise.all([
    proxy.callCaseService('/health', {}, null),
    proxy.callAuditService('/health', {}, null),
    proxy.callNotificationService('/health', {}, null),
    proxy.callOrchestrationService('/health', {}, null),
    proxy.callAdapterRuntime('/health', {}, null)
  ]);
  return {
    gateway: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
    caseService: serviceStatus(caseHealth),
    auditService: serviceStatus(auditHealth),
    notificationService: serviceStatus(notificationHealth),
    orchestrationService: serviceStatus(orchestrationHealth),
    adapterRuntime: serviceStatus(adapterHealth)
  };
}

async function getReadinessReport() {
  const health = await getServiceHealth();
  return {
    ok: Object.values(health).every((status) => status === 'ok'),
    health
  };
}

function getSafeConfig() {
  return {
    observabilityEnabled: String(process.env.OBSERVABILITY_ENABLED || 'true') === 'true',
    diagnosticsEnabled: String(process.env.DIAGNOSTICS_ENABLED || 'true') === 'true',
    replayEnabled: String(process.env.REPLAY_TOOLS_ENABLED || 'true') === 'true',
    metricsEnabled: String(process.env.METRICS_ENABLED || 'true') === 'true',
    stuckCaseDetectionEnabled: String(process.env.STUCK_CASE_DETECTION_ENABLED || 'true') === 'true',
    thresholds: {
      stuckCaseNoActivityHours: Number(process.env.STUCK_CASE_NO_ACTIVITY_HOURS || 48),
      stuckTaskOverdueHours: Number(process.env.STUCK_TASK_OVERDUE_HOURS || 24),
      replayMaxEvents: Number(process.env.REPLAY_MAX_EVENTS || 1000)
    },
    retention: {
      operationalLogRetentionDays: Number(process.env.OPERATIONAL_LOG_RETENTION_DAYS || 30),
      metricsRetentionDays: Number(process.env.METRICS_RETENTION_DAYS || 30)
    }
  };
}

async function getDependencyStatus() {
  return {
    mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
    kafka: (await proxy.callCaseService('/health', {}, null))?.dependencies?.kafka || 'unknown',
    rabbitmq: 'unknown'
  };
}

async function getQueueBacklog() {
  const pendingEvents = await DomainEvent.countDocuments({ publishStatus: { $in: ['pending', 'failed', 'publishing'] } }).catch(() => 0);
  const deadLetteredEvents = await DomainEvent.countDocuments({ publishStatus: 'dead_lettered' }).catch(() => 0);
  return {
    queues: [
      {
        queueName: 'domain-events-outbox',
        readyMessages: pendingEvents,
        unackedMessages: 0,
        consumers: 1,
        deadLetterCount: deadLetteredEvents,
        retryCount: pendingEvents
      }
    ]
  };
}

async function getKafkaStatus() {
  const health = await proxy.callCaseService('/health', {}, null);
  return { status: health?.dependencies?.kafka || 'unknown' };
}

async function getRabbitMqStatus() {
  return { status: 'unknown', message: 'RabbitMQ diagnostics placeholder. Add direct broker stats integration if enabled.' };
}

async function getAdapterStatus() {
  const data = await proxy.callAdapterRuntime('/health', {}, null);
  return {
    overall: data?.ok ? 'ok' : 'warning',
    adapters: []
  };
}

async function getConsumerLagOrSlowConsumers() {
  return {
    consumers: [
      {
        consumerGroup: 'domain-event-consumer',
        topicOrQueue: 'domain.events',
        lag: await DomainEvent.countDocuments({ publishStatus: { $in: ['pending', 'failed'] } }).catch(() => 0),
        averageProcessingTimeMs: 0,
        errorRate: 0,
        status: 'ok'
      }
    ]
  };
}

async function getScheduledJobStatus() {
  const runningWarnings = await SlaTimer.countDocuments({ status: 'warning' }).catch(() => 0);
  const runningBreaches = await SlaTimer.countDocuments({ status: 'breached' }).catch(() => 0);
  return {
    jobs: [
      { job: 'sla-monitoring', status: 'ok', warningCount: runningWarnings, breachCount: runningBreaches }
    ]
  };
}

function getCorrelationTrace(correlationId) {
  return Promise.all([
    AuditEvent.find({ correlationId }).sort({ createdAt: 1 }).lean().limit(200),
    DomainEvent.find({ correlationId }).sort({ createdAt: 1 }).lean().limit(200)
  ]).then(([auditEvents, domainEvents]) => ({ correlationId, auditEvents, domainEvents }));
}

async function getCaseTraceHistory(caseIdOrUniversalCaseId) {
  const [auditEvents, domainEvents, notifications, grievances, slaTimers] = await Promise.all([
    AuditEvent.find({ $or: [{ caseId: caseIdOrUniversalCaseId }, { universalCaseId: caseIdOrUniversalCaseId }] }).sort({ createdAt: 1 }).lean().limit(500),
    DomainEvent.find({ universalCaseId: caseIdOrUniversalCaseId }).sort({ createdAt: 1 }).lean().limit(500),
    Notification.find({ universalCaseId: caseIdOrUniversalCaseId }).sort({ createdAt: 1 }).lean().limit(200),
    Grievance.find({ universalCaseId: caseIdOrUniversalCaseId }).sort({ createdAt: 1 }).lean().limit(200),
    SlaTimer.find({ universalCaseId: caseIdOrUniversalCaseId }).sort({ createdAt: 1 }).lean().limit(200)
  ]);
  return { caseIdOrUniversalCaseId, auditEvents, domainEvents, notifications, grievances, slaTimers };
}

function listStuckCases(filter = {}, pagination = {}) {
  const page = Math.max(Number(pagination.page) || 1, 1);
  const limit = Math.min(Math.max(Number(pagination.limit) || 25, 1), 100);
  const skip = (page - 1) * limit;
  return Promise.all([
    StuckCaseFinding.find(filter).sort({ detectedAt: -1 }).skip(skip).limit(limit).lean(),
    StuckCaseFinding.countDocuments(filter)
  ]).then(([items, total]) => ({ items, total, page, limit }));
}

function getStuckCase(findingId) {
  return StuckCaseFinding.findOne({ findingId }).lean();
}

function listReplayAttempts(filter = {}, pagination = {}) {
  const page = Math.max(Number(pagination.page) || 1, 1);
  const limit = Math.min(Math.max(Number(pagination.limit) || 25, 1), 100);
  const skip = (page - 1) * limit;
  return Promise.all([
    ReplayAttempt.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ReplayAttempt.countDocuments(filter)
  ]).then(([items, total]) => ({ items, total, page, limit }));
}

module.exports = {
  getServiceHealth,
  getReadinessReport,
  getSafeConfig,
  getDependencyStatus,
  getQueueBacklog,
  getKafkaStatus,
  getRabbitMqStatus,
  getAdapterStatus,
  getConsumerLagOrSlowConsumers,
  getScheduledJobStatus,
  getCorrelationTrace,
  getCaseTraceHistory,
  listStuckCases,
  getStuckCase,
  listReplayAttempts
};
