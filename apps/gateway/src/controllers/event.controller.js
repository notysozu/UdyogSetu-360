const { sendAccepted, sendSuccess } = require('../utils/api-response');
const outboxRepository = require('../../../../services/case-service/src/outbox/outbox.repository');
const { publishEvent } = require('../../../../packages/shared/src/kafka/event-producer');

function stub(action, req, extra = {}) {
  return {
    resource: 'event',
    action,
    todo: `Wire event.${action} to the domain event ingest/outbox flow.`,
    correlationId: req.context.correlationId,
    ...extra
  };
}

async function ingestEvent(req, res) {
  return sendAccepted(res, stub('ingestEvent', req, { event: req.body, webhook: req.context.webhook || null }));
}
async function getEventById(req, res) {
  const event = await outboxRepository.findByEventId(req.params.eventId);
  return sendSuccess(res, event || stub('getEventById', req, { eventId: req.params.eventId }));
}
async function listCaseEvents(req, res) {
  const events = await outboxRepository.findByCase(req.params.caseId);
  return sendSuccess(res, { items: events });
}
async function receiveDepartmentCallback(req, res) {
  return sendAccepted(res, stub('receiveDepartmentCallback', req, { departmentCode: req.params.departmentCode }));
}
async function getDepartmentIntegrationHealth(req, res) {
  return sendSuccess(res, stub('getDepartmentIntegrationHealth', req, { departmentCode: req.params.departmentCode }));
}
async function receiveN8nWebhook(req, res) {
  return sendAccepted(res, stub('receiveN8nWebhook', req, { workflowCode: req.params.workflowCode }));
}
async function receiveDepartmentWebhook(req, res) {
  return sendAccepted(res, stub('receiveDepartmentWebhook', req, { departmentCode: req.params.departmentCode }));
}
async function listEvents(req, res) {
  const filter = {};
  if (req.query.eventName) filter.eventName = req.query.eventName;
  if (req.query.aggregateType) filter.aggregateType = req.query.aggregateType;
  const events = await outboxRepository.findByFilter(filter, { limit: 100, sort: { createdAt: -1 } });
  return sendSuccess(res, { items: events });
}
async function listCaseEventsByUniversalCaseId(req, res) {
  const events = await outboxRepository.findByCase(req.params.universalCaseId);
  return sendSuccess(res, { items: events });
}
async function replayEvents(req, res) {
  const filter = {};
  if (req.body.universalCaseId) filter.universalCaseId = req.body.universalCaseId;
  if (req.body.aggregateType) filter.aggregateType = req.body.aggregateType;
  if (req.body.aggregateId) filter.aggregateId = req.body.aggregateId;
  if (req.body.eventName) filter.eventName = req.body.eventName;
  if (req.body.from || req.body.to) {
    filter.createdAt = {};
    if (req.body.from) filter.createdAt.$gte = new Date(req.body.from);
    if (req.body.to) filter.createdAt.$lte = new Date(req.body.to);
  }
  const events = await outboxRepository.findByFilter(filter, { limit: 100, sort: { createdAt: 1 } });
  if (req.body.republish && !req.body.dryRun) {
    for (const event of events) {
      await publishEvent({
        ...event.envelope,
        data: {
          ...(event.envelope?.data || {}),
          metadata: {
            ...(event.envelope?.data?.metadata || {}),
            replayedAt: new Date().toISOString(),
            replayedBy: req.user?.id || req.serviceUser?.id || 'gateway-admin',
            replayReason: req.body.reason,
            originalEventId: event.eventId
          }
        }
      }, { topic: event.topic });
    }
  }
  return sendAccepted(res, {
    count: events.length,
    dryRun: Boolean(req.body.dryRun),
    republish: Boolean(req.body.republish)
  });
}

module.exports = {
  ingestEvent,
  getEventById,
  listCaseEvents,
  listEvents,
  listCaseEventsByUniversalCaseId,
  replayEvents,
  receiveDepartmentCallback,
  getDepartmentIntegrationHealth,
  receiveN8nWebhook,
  receiveDepartmentWebhook
};
