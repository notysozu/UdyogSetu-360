const { createLogger } = require('../logger');
const {
  EventHandlerNotFoundError,
  EventSchemaError,
  RetryableEventError,
  NonRetryableEventError
} = require('../errors/event-errors');
const { validateEventByType } = require('../events/schemas');
const { connectConsumer, isKafkaEnabled } = require('./kafka-client');
const { publishDeadLetter } = require('./event-producer');

const logger = createLogger('event-consumer');

function createEventConsumer(config = {}) {
  if (!isKafkaEnabled()) {
    return null;
  }
  return connectConsumer(config.groupId);
}

async function subscribeToTopics(consumer, topics) {
  if (!consumer) {
    return null;
  }
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }
  return consumer;
}

async function runConsumer(consumer, handlerMap, options = {}) {
  if (!consumer) {
    return { disabled: true };
  }
  const consumerGroup = options.consumerGroup;
  const idempotencyService = options.idempotencyService;
  const ignoreMissingHandler = Boolean(options.ignoreMissingHandler);

  await consumer.run({
    autoCommit: true,
    eachMessage: async ({ topic, message }) => {
      let eventEnvelope;
      try {
        eventEnvelope = JSON.parse(message.value.toString('utf8'));
        validateEventByType(eventEnvelope);
      } catch (error) {
        await publishDeadLetter(
          {
            id: `invalid-${Date.now()}`,
            type: 'integration.dispatch_failed.v1',
            source: 'us360.consumer',
            specversion: '1.0',
            subject: `topic/${topic}`,
            time: new Date().toISOString(),
            datacontenttype: 'application/json',
            correlationid: '',
            partitionkey: message.key?.toString() || topic,
            data: {
              eventVersion: 1,
              aggregateType: 'invalid_event',
              aggregateId: message.offset,
              payload: {}
            }
          },
          new EventSchemaError('Invalid event envelope received.', { message: error.message }),
          { source: 'us360.consumer.invalid' }
        );
        return;
      }

      const handler = handlerMap[eventEnvelope.type];
      if (!handler) {
        if (ignoreMissingHandler) {
          logger.warn('kafka_handler_missing_ignored', {
            eventId: eventEnvelope.id,
            eventName: eventEnvelope.type,
            topic,
            correlationId: eventEnvelope.correlationid,
            consumerGroup
          });
          return;
        }
        await publishDeadLetter(
          eventEnvelope,
          new EventHandlerNotFoundError(`No handler registered for ${eventEnvelope.type}.`),
          { source: 'us360.consumer.handler-missing' }
        );
        return;
      }

      const executeHandler = async () => handler(eventEnvelope, {
        topic,
        consumerGroup
      });

      try {
        if (idempotencyService) {
          await idempotencyService.withIdempotency(
            eventEnvelope,
            handler.name || eventEnvelope.type,
            consumerGroup,
            executeHandler
          );
        } else {
          await executeHandler();
        }
        logger.info('kafka_event_processed', {
          eventId: eventEnvelope.id,
          eventName: eventEnvelope.type,
          topic,
          partitionKey: eventEnvelope.partitionkey,
          correlationId: eventEnvelope.correlationid,
          consumerGroup,
          handlerName: handler.name || 'anonymous'
        });
      } catch (error) {
        if (error instanceof RetryableEventError) {
          logger.warn('kafka_retryable_handler_error', {
            eventId: eventEnvelope.id,
            eventName: eventEnvelope.type,
            topic,
            partitionKey: eventEnvelope.partitionkey,
            correlationId: eventEnvelope.correlationid,
            consumerGroup,
            handlerName: handler.name || 'anonymous',
            errorCode: error.code
          });
          throw error;
        }

        await publishDeadLetter(eventEnvelope, error, { source: 'us360.consumer.dead-letter' });
        logger.error('kafka_non_retryable_handler_error', {
          eventId: eventEnvelope.id,
          eventName: eventEnvelope.type,
          topic,
          partitionKey: eventEnvelope.partitionkey,
          correlationId: eventEnvelope.correlationid,
          consumerGroup,
          handlerName: handler.name || 'anonymous',
          errorCode: error.code || 'HANDLER_FAILED'
        });
      }
    }
  });
}

async function pauseConsumer(consumer) {
  if (consumer) {
    consumer.pause(consumer.assignments());
  }
}

async function resumeConsumer(consumer) {
  if (consumer) {
    consumer.resume(consumer.assignments());
  }
}

async function shutdownConsumer(consumer) {
  if (consumer) {
    await consumer.disconnect();
  }
}

module.exports = {
  createEventConsumer,
  subscribeToTopics,
  runConsumer,
  pauseConsumer,
  resumeConsumer,
  shutdownConsumer
};
