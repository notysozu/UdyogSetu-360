const { randomUUID } = require('crypto');
const { EVENT_NAME_VALUES } = require('../constants/event-names.constants');
const { EventValidationError } = require('../errors/event-errors');
const { getTopicForEvent } = require('./event-topic-router');

function parseEventVersion(eventName) {
  const match = /\.v(\d+)$/.exec(eventName || '');
  if (!match) {
    throw new EventValidationError(`Event name ${eventName} does not contain a version suffix.`);
  }
  return Number(match[1]);
}

function ensureKnownEventName(eventName) {
  if (!EVENT_NAME_VALUES.includes(eventName)) {
    throw new EventValidationError(`Unknown event name: ${eventName}`);
  }
}

function buildBaseEnvelope(input = {}) {
  ensureKnownEventName(input.type);
  getTopicForEvent(input.type);
  const partitionkey = input.partitionkey || input.partitionKey || input.subject || input.source;
  if (!partitionkey) {
    throw new EventValidationError('partitionkey is required to build an event envelope.');
  }
  const correlationId = input.correlationid || input.correlationId || randomUUID();
  const causationId = input.causationid || input.causationId || null;
  return {
    id: input.id || randomUUID(),
    source: input.source,
    specversion: '1.0',
    type: input.type,
    subject: input.subject,
    time: input.time || new Date().toISOString(),
    datacontenttype: 'application/json',
    dataschema:
      input.dataschema || `https://udyogsetu360.local/schemas/${input.type}.json`,
    correlationid: correlationId,
    causationid: causationId,
    traceparent: input.traceparent || null,
    partitionkey,
    correlationId,
    causationId,
    partitionKey: partitionkey
  };
}

function buildEventEnvelope(input = {}) {
  const aggregateType = input.data?.aggregateType || input.aggregateType || 'event';
  const aggregateId =
    input.data?.aggregateId || input.aggregateId || input.subject || input.id || randomUUID();

  const envelope = buildBaseEnvelope(input);
  return {
    ...envelope,
    data: {
      eventVersion: input.data?.eventVersion || parseEventVersion(input.type),
      aggregateType,
      aggregateId: String(aggregateId),
      universalCaseId:
        input.data?.universalCaseId || input.universalCaseId || null,
      previousStatus: input.data?.previousStatus ?? null,
      nextStatus: input.data?.nextStatus ?? null,
      actor: input.data?.actor || input.actor || null,
      payload: input.data?.payload || input.payload || {},
      metadata: input.data?.metadata || input.metadata || {}
    }
  };
}

function buildAggregateEnvelope(eventName, aggregateType, aggregateDoc, payload = {}, context = {}) {
  const universalCaseId =
    aggregateDoc?.universalCaseId ||
    payload?.universalCaseId ||
    aggregateDoc?.grievanceNumber ||
    aggregateDoc?.certificateNumber ||
    aggregateDoc?.id ||
    aggregateDoc?._id?.toString?.();
  const aggregateId = aggregateDoc?._id?.toString?.() || aggregateDoc?.id || aggregateDoc?.aggregateId;
  const partitionkey =
    payload?.partitionKey ||
    universalCaseId ||
    aggregateDoc?.externalReferenceId ||
    aggregateId;
  return buildEventEnvelope({
    type: eventName,
    source: context.source || `us360.${aggregateType}-service`,
    subject: `${aggregateType}/${universalCaseId || aggregateId}`,
    correlationid: context.correlationId || context.correlationid,
    causationid: context.causationId || context.causationid || null,
    traceparent: context.traceparent || null,
    partitionkey,
    aggregateType,
    aggregateId,
    universalCaseId: aggregateDoc?.universalCaseId || payload?.universalCaseId || null,
    actor: context.actor || null,
    payload,
    metadata: context.metadata || {},
    data: {
      aggregateType,
      aggregateId,
      universalCaseId: aggregateDoc?.universalCaseId || payload?.universalCaseId || null,
      previousStatus: payload.previousStatus ?? aggregateDoc?.previousStatus ?? null,
      nextStatus: payload.nextStatus ?? aggregateDoc?.status ?? null,
      actor: context.actor || null,
      payload,
      metadata: context.metadata || {}
    }
  });
}

function buildCaseEvent(eventName, caseDoc, payload = {}, context = {}) {
  return buildAggregateEnvelope(eventName, 'case', caseDoc, payload, context);
}

function buildTaskEvent(eventName, taskDoc, payload = {}, context = {}) {
  return buildAggregateEnvelope(eventName, 'task', taskDoc, payload, context);
}

function buildDocumentEvent(eventName, documentDoc, payload = {}, context = {}) {
  return buildAggregateEnvelope(eventName, 'document', documentDoc, payload, context);
}

function buildGrievanceEvent(eventName, grievanceDoc, payload = {}, context = {}) {
  return buildAggregateEnvelope(eventName, 'grievance', grievanceDoc, payload, context);
}

function buildInspectionEvent(eventName, inspectionDoc, payload = {}, context = {}) {
  return buildAggregateEnvelope(eventName, 'inspection', inspectionDoc, payload, context);
}

function buildFeeEvent(eventName, feeDoc, payload = {}, context = {}) {
  return buildAggregateEnvelope(eventName, 'fee', feeDoc, payload, context);
}

function buildCertificateEvent(eventName, certificateDoc, payload = {}, context = {}) {
  return buildAggregateEnvelope(eventName, 'certificate', certificateDoc, payload, context);
}

module.exports = {
  parseEventVersion,
  buildEventEnvelope,
  buildCaseEvent,
  buildTaskEvent,
  buildDocumentEvent,
  buildGrievanceEvent,
  buildInspectionEvent,
  buildFeeEvent,
  buildCertificateEvent
};
