const { createLogger } = require('../logger');
const { getTopicForEvent } = require('../events/event-topic-router');
const { validateEventByType } = require('../events/schemas');
const { EVENT_TOPICS } = require('../constants/event-topics.constants');
const {
  EventPublishError,
  EventValidationError
} = require('../errors/event-errors');
const { connectProducer, isKafkaEnabled } = require('./kafka-client');

const logger = createLogger('event-producer');

function buildHeaders(eventEnvelope) {
  return {
    'event-id': eventEnvelope.id,
    'event-type': eventEnvelope.type,
    'correlation-id': eventEnvelope.correlationid || '',
    'causation-id': eventEnvelope.causationid || '',
    source: eventEnvelope.source,
    specversion: eventEnvelope.specversion,
    'content-type': eventEnvelope.datacontenttype
  };
}

async function publishToTopic(topic, messages, options = {}) {
  if (!isKafkaEnabled()) {
    logger.info('kafka_publish_skipped_disabled', {
      topic,
      messageCount: messages.length
    });
    return { disabled: true, topic, messageCount: messages.length };
  }

  try {
    const producer = await connectProducer();
    const result = await producer.send({ topic, messages });
    logger.info('kafka_publish_succeeded', {
      topic,
      messageCount: messages.length
    });
    return result;
  } catch (error) {
    logger.error('kafka_publish_failed', {
      topic,
      messageCount: messages.length,
      errorCode: error.code || 'KAFKA_SEND_FAILED',
      errorMessage: error.message
    });
    throw new EventPublishError('Failed to publish Kafka message batch.', {
      topic,
      messageCount: messages.length,
      message: error.message
    });
  }
}

async function publishEvent(eventEnvelope, options = {}) {
  validateEventByType(eventEnvelope);
  const topic = options.topic || getTopicForEvent(eventEnvelope.type);
  const message = {
    key: eventEnvelope.partitionkey,
    value: JSON.stringify(eventEnvelope),
    headers: buildHeaders(eventEnvelope)
  };
  const result = await publishToTopic(topic, [message], options);
  return {
    topic,
    key: message.key,
    result
  };
}

async function publishEvents(eventEnvelopes, options = {}) {
  if (!Array.isArray(eventEnvelopes) || !eventEnvelopes.length) {
    return [];
  }
  const grouped = new Map();
  for (const eventEnvelope of eventEnvelopes) {
    validateEventByType(eventEnvelope);
    const topic = options.topic || getTopicForEvent(eventEnvelope.type);
    if (!grouped.has(topic)) {
      grouped.set(topic, []);
    }
    grouped.get(topic).push({
      key: eventEnvelope.partitionkey,
      value: JSON.stringify(eventEnvelope),
      headers: buildHeaders(eventEnvelope)
    });
  }

  const results = [];
  for (const [topic, messages] of grouped.entries()) {
    results.push(await publishToTopic(topic, messages, options));
  }
  return results;
}

async function publishDeadLetter(originalEvent, error, context = {}) {
  if (!originalEvent?.id) {
    throw new EventValidationError('Dead-letter publishing requires an original event envelope.');
  }
  const deadLetterEnvelope = {
    ...originalEvent,
    type: 'integration.dispatch_failed.v1',
    source: context.source || 'us360.dead-letter',
    data: {
      ...originalEvent.data,
      metadata: {
        ...(originalEvent.data?.metadata || {}),
        deadLetteredAt: new Date().toISOString(),
        deadLetterReason: error.message,
        originalEventId: originalEvent.id
      }
    }
  };
  return publishToTopic(
    EVENT_TOPICS.DEAD_LETTER,
    [
      {
        key: originalEvent.partitionkey,
        value: JSON.stringify(deadLetterEnvelope),
        headers: buildHeaders(deadLetterEnvelope)
      }
    ],
    context
  );
}

module.exports = {
  publishEvent,
  publishEvents,
  publishToTopic,
  publishDeadLetter
};
