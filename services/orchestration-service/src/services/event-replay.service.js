const DomainEvent = require('../../../case-service/src/models/DomainEvent');
const processedEventRepository = require('../repositories/processed-event.repository');

async function isEventAlreadyProcessed(eventId, handlerName) {
  return processedEventRepository.findOne({ eventId, handlerName, status: 'processed' });
}

async function markEventProcessed(eventId, handlerName, result, context = {}) {
  return processedEventRepository.updateOne(
    { eventId, handlerName },
    {
      $set: {
        status: 'processed',
        processedAt: new Date(),
        result,
        correlationId: context.correlationId || null
      }
    },
    { upsert: true }
  );
}

async function markEventFailed(eventId, handlerName, error, context = {}) {
  return processedEventRepository.updateOne(
    { eventId, handlerName },
    {
      $set: {
        status: 'failed',
        processedAt: new Date(),
        errorMessage: error.message,
        correlationId: context.correlationId || null
      }
    },
    { upsert: true }
  );
}

async function handleEventOnce(event, handler, context = {}) {
  const handlerName = handler.name || 'anonymous_handler';
  const alreadyProcessed = await isEventAlreadyProcessed(event.eventId, handlerName);
  if (alreadyProcessed) {
    return { skipped: true, reason: 'already_processed', handlerName };
  }

  try {
    const result = await handler(event, context);
    await markEventProcessed(event.eventId, handlerName, result, context);
    return { processed: true, handlerName, result };
  } catch (error) {
    await markEventFailed(event.eventId, handlerName, error, context);
    throw error;
  }
}

async function replayCaseEvents(caseId, context = {}) {
  const events = await DomainEvent.find({
    $or: [{ aggregateId: String(caseId) }, { 'payload.caseId': String(caseId) }]
  })
    .sort({ createdAt: 1 })
    .lean();

  return {
    caseId,
    eventCount: events.length,
    events
  };
}

async function rebuildCaseProjection(caseId, context = {}) {
  return {
    caseId,
    rebuiltAt: new Date().toISOString(),
    correlationId: context.correlationId || null
  };
}

module.exports = {
  handleEventOnce,
  isEventAlreadyProcessed,
  markEventProcessed,
  replayCaseEvents,
  rebuildCaseProjection
};
