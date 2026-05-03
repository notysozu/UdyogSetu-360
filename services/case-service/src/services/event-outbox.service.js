const { randomUUID } = require('crypto');
const {
  buildEventEnvelope,
  getTopicForEvent
} = require('../../../../packages/shared/src');
const outboxRepository = require('../outbox/outbox.repository');

async function appendDomainEvent(input, context = {}) {
  const eventVersion = Number(String(input.eventVersion || '1.0').split('.')[0]) || 1;
  const envelope = buildEventEnvelope({
    type: input.eventName,
    source: input.source || 'us360.case-service',
    subject: input.subject || `${input.aggregateType}/${input.universalCaseId || input.aggregateId}`,
    correlationid: input.correlationId || context.correlationId,
    causationid: input.causationId || context.causationId || null,
    partitionkey:
      input.partitionKey ||
      input.universalCaseId ||
      input.payload?.externalReferenceId ||
      input.aggregateId,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    universalCaseId: input.universalCaseId || null,
    actor: input.actor || context.actor || null,
    payload: input.payload || {},
    metadata: {
      ...input.metadata
    },
    data: {
      eventVersion,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      universalCaseId: input.universalCaseId || null,
      previousStatus: input.payload?.previousStatus ?? null,
      nextStatus: input.payload?.nextStatus ?? null,
      actor: input.actor || context.actor || null,
      payload: input.payload || {},
      metadata: {
        ...input.metadata
      }
    }
  });
  const topic = getTopicForEvent(input.eventName);

  return outboxRepository.appendEvent(
    {
      eventId: input.eventId || envelope.id || randomUUID(),
      eventName: input.eventName,
      eventVersion: input.eventVersion || '1.0',
      source: envelope.source,
      subject: envelope.subject,
      correlationId: envelope.correlationid,
      causationId: input.causationId || null,
      idempotencyKey: input.idempotencyKey || null,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      universalCaseId: input.universalCaseId || null,
      topic,
      partitionKey: envelope.partitionkey,
      envelope,
      payload: envelope.data,
      metadata: {
        specversion: envelope.specversion,
        time: envelope.time,
        datacontenttype: envelope.datacontenttype,
        ...input.metadata
      },
      publishStatus: 'pending',
      publishAttempts: 0,
      nextPublishAt: new Date()
    },
    context
  );
}

function markPublished(eventId) {
  return outboxRepository.markPublished(eventId);
}

function markFailed(eventId, reason) {
  return outboxRepository.markFailed(eventId, reason, new Date(Date.now() + 5 * 60 * 1000));
}

function findPendingForPublish(limit = 50) {
  return outboxRepository.findPendingForPublish(limit);
}

module.exports = {
  appendDomainEvent,
  markPublished,
  markFailed,
  findPendingForPublish
};
