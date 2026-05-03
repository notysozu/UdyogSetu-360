const {
  publishTestDeliverySchema,
  publishTestCallbackSchema,
  requeueRequestSchema,
  validateSchema
} = require('../../../../packages/shared/src');
const queueJobRepository = require('../repositories/queue-job.repository');
const queueMonitoringService = require('../services/queue-monitoring.service');
const { publishDepartmentDeliveryJob, publishCallbackReconciliationJob } = require('../producers/queue-producer');
const { recordAuditEvent } = require('../../../audit-service/src/services/audit.service');

function getActor(req) {
  return req.user || req.serviceUser || {
    id: 'queue-admin',
    primaryRole: 'system',
    permissions: ['system.internal_call']
  };
}

async function health(_req, res) {
  const report = await queueMonitoringService.buildQueueHealthReport();
  res.json({ ok: true, data: report });
}

async function stats(_req, res) {
  const [queues, workers, deadLetter, retry] = await Promise.all([
    queueMonitoringService.getQueueStats(),
    Promise.resolve(queueMonitoringService.getWorkerStats()),
    queueMonitoringService.getDeadLetterStats(),
    queueMonitoringService.getRetryStats()
  ]);
  res.json({ ok: true, data: { queues, workers, deadLetter, retry } });
}

async function jobs(req, res) {
  const limit = Number(req.query.limit || 50);
  const status = req.query.status;
  const query = status ? { status, isDeleted: false } : { isDeleted: false };
  const rows = await require('../models/QueueJob').find(query).sort({ createdAt: -1 }).limit(limit);
  res.json({ ok: true, data: rows });
}

async function jobById(req, res) {
  const job = await queueJobRepository.findByMessageId(req.params.messageId);
  if (!job) {
    return res.status(404).json({ ok: false, error: { message: 'Queue job not found.' } });
  }
  return res.json({ ok: true, data: job });
}

async function deadLetter(req, res) {
  const rows = await queueJobRepository.findDeadLettered(
    req.query.department ? { departmentCode: req.query.department } : {},
    { limit: req.query.limit || 50 }
  );
  res.json({ ok: true, data: rows });
}

async function requeueDeadLetter(req, res) {
  const payload = validateSchema(requeueRequestSchema, req.body || {});
  const job = await queueJobRepository.findByMessageId(req.params.messageId);
  if (!job) {
    return res.status(404).json({ ok: false, error: { message: 'Dead-letter job not found.' } });
  }
  const actor = getActor(req);
  const { requeueQueueJob } = require('../services/queue-recovery.service');
  const result = await requeueQueueJob(job, payload.reason, {
    actor,
    force: payload.force
  });
  await recordAuditEvent({
    actor,
    action: 'queue.dead_letter.requeued',
    resourceType: 'queue_job',
    resourceId: job.messageId,
    universalCaseId: job.universalCaseId || null,
    metadata: {
      reason: payload.reason
    }
  });
  res.json({ ok: true, data: result });
}

async function requeueDeadLetterBatch(req, res) {
  const payload = validateSchema(requeueRequestSchema, req.body || {});
  const limit = Number(req.body.limit || 10);
  const departmentCode = req.body.department || null;
  const jobs = await queueJobRepository.findDeadLettered(
    departmentCode ? { departmentCode } : {},
    { limit }
  );
  const actor = getActor(req);
  const { requeueQueueJob } = require('../services/queue-recovery.service');
  const results = [];
  for (const job of jobs) {
    results.push(await requeueQueueJob(job, payload.reason, { actor, force: payload.force }));
  }
  await recordAuditEvent({
    actor,
    action: 'queue.dead_letter.requeue_batch',
    resourceType: 'queue_batch',
    resourceId: departmentCode || 'all',
    metadata: {
      reason: payload.reason,
      limit,
      count: results.length
    }
  });
  res.json({ ok: true, data: results });
}

async function cancelJob(req, res) {
  const actor = getActor(req);
  const reason = req.body.reason || 'Cancelled by operator';
  const job = await queueJobRepository.cancelJob(req.params.messageId, reason);
  await recordAuditEvent({
    actor,
    action: 'queue.job.cancelled',
    resourceType: 'queue_job',
    resourceId: req.params.messageId,
    metadata: { reason }
  });
  res.json({ ok: true, data: job });
}

async function publishTestDelivery(req, res) {
  const payload = validateSchema(publishTestDeliverySchema, req.body || {});
  const actor = getActor(req);
  const result = await publishDepartmentDeliveryJob(
    payload.department,
    payload.jobType,
    {
      departmentCode: payload.department,
      jobType: payload.jobType,
      universalCaseId: payload.case,
      canonicalPayload: {
        enterprise: {},
        project: {},
        documents: []
      }
    },
    {
      correlationId: req.correlationId || payload.case,
      metadata: { triggeredBy: actor.id }
    }
  );
  await recordAuditEvent({
    actor,
    action: 'queue.test_delivery_published',
    resourceType: 'queue_publish',
    resourceId: result.messageId || 'disabled',
    universalCaseId: payload.case
  });
  res.status(201).json({ ok: true, data: result });
}

async function publishTestCallback(req, res) {
  const payload = validateSchema(publishTestCallbackSchema, req.body || {});
  const actor = getActor(req);
  const result = await publishCallbackReconciliationJob(
    {
      departmentCode: payload.department,
      universalCaseId: payload.case,
      callbackType: payload.type,
      status: payload.type === 'inspection_completed' ? 'completed' : payload.type,
      remarks: 'Test callback',
      documents: [],
      receivedAt: new Date().toISOString()
    },
    {
      correlationId: req.correlationId || payload.case,
      metadata: { triggeredBy: actor.id }
    }
  );
  await recordAuditEvent({
    actor,
    action: 'queue.test_callback_published',
    resourceType: 'queue_publish',
    resourceId: result.messageId || 'disabled',
    universalCaseId: payload.case
  });
  res.status(201).json({ ok: true, data: result });
}

module.exports = {
  health,
  stats,
  jobs,
  jobById,
  deadLetter,
  requeueDeadLetter,
  requeueDeadLetterBatch,
  cancelJob,
  publishTestDelivery,
  publishTestCallback
};
