const { EventIdempotencyError } = require('../errors/event-errors');

function createEventIdempotencyService(repository, options = {}) {
  const staleMs = Number(options.staleMs || 5 * 60 * 1000);

  async function hasProcessed(eventId, handlerName, consumerGroup) {
    return repository.findOne({
      eventId,
      handlerName,
      consumerGroup,
      status: 'processed'
    });
  }

  async function beginProcessing(eventEnvelope, handlerName, consumerGroup) {
    const existing = await repository.findOne({
      eventId: eventEnvelope.id,
      handlerName,
      consumerGroup
    });

    if (existing?.status === 'processed') {
      return { skipped: true, reason: 'already_processed', record: existing };
    }
    if (
      existing?.status === 'processing' &&
      existing.updatedAt &&
      Date.now() - new Date(existing.updatedAt).getTime() < staleMs
    ) {
      return { skipped: true, reason: 'already_processing', record: existing };
    }

    const patch = {
      eventId: eventEnvelope.id,
      eventType: eventEnvelope.type,
      handlerName,
      consumerGroup,
      aggregateType: eventEnvelope.data.aggregateType,
      aggregateId: eventEnvelope.data.aggregateId,
      universalCaseId: eventEnvelope.data.universalCaseId || null,
      status: 'processing',
      correlationId: eventEnvelope.correlationid || null,
      processedAt: null,
      errorMessage: null
    };

    const record = await repository.findOneAndUpdate(
      { eventId: eventEnvelope.id, handlerName, consumerGroup },
      { $set: patch },
      { upsert: true, new: true }
    );

    return { skipped: false, record };
  }

  async function markProcessed(eventEnvelope, handlerName, consumerGroup, result) {
    return repository.findOneAndUpdate(
      { eventId: eventEnvelope.id, handlerName, consumerGroup },
      {
        $set: {
          status: 'processed',
          processedAt: new Date(),
          result,
          errorMessage: null,
          correlationId: eventEnvelope.correlationid || null
        }
      },
      { new: true, upsert: true }
    );
  }

  async function markFailed(eventEnvelope, handlerName, consumerGroup, error) {
    return repository.findOneAndUpdate(
      { eventId: eventEnvelope.id, handlerName, consumerGroup },
      {
        $set: {
          status: 'failed',
          processedAt: new Date(),
          errorMessage: error.message,
          correlationId: eventEnvelope.correlationid || null
        }
      },
      { new: true, upsert: true }
    );
  }

  async function withIdempotency(eventEnvelope, handlerName, consumerGroup, handler) {
    const beginResult = await beginProcessing(eventEnvelope, handlerName, consumerGroup);
    if (beginResult.skipped) {
      return { skipped: true, reason: beginResult.reason };
    }

    try {
      const result = await handler(eventEnvelope);
      await markProcessed(eventEnvelope, handlerName, consumerGroup, result);
      return { processed: true, result };
    } catch (error) {
      await markFailed(eventEnvelope, handlerName, consumerGroup, error);
      throw error;
    }
  }

  return {
    beginProcessing,
    markProcessed,
    markFailed,
    hasProcessed,
    withIdempotency
  };
}

module.exports = { createEventIdempotencyService };
