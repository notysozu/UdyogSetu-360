#!/usr/bin/env node
const { EVENT_TOPICS } = require('../packages/shared/src/constants/event-topics.constants');
const {
  createEventConsumer,
  subscribeToTopics,
  runConsumer
} = require('../packages/shared/src/kafka/event-consumer');

async function main() {
  const consumer = await createEventConsumer({ groupId: 'us360-sample-consumer' });
  if (!consumer) {
    console.log('Kafka is disabled.');
    return;
  }
  await subscribeToTopics(consumer, [
    EVENT_TOPICS.DOMAIN_CASE,
    EVENT_TOPICS.DOMAIN_TASK,
    EVENT_TOPICS.DOMAIN_DOCUMENT,
    EVENT_TOPICS.DOMAIN_GRIEVANCE,
    EVENT_TOPICS.DOMAIN_INSPECTION,
    EVENT_TOPICS.DOMAIN_FEE,
    EVENT_TOPICS.DOMAIN_CERTIFICATE
  ]);
  await runConsumer(
    consumer,
    new Proxy(
      {},
      {
        get() {
          return async function logEvent(eventEnvelope) {
            console.log(
              JSON.stringify(
                {
                  eventId: eventEnvelope.id,
                  eventName: eventEnvelope.type,
                  partitionKey: eventEnvelope.partitionkey,
                  correlationId: eventEnvelope.correlationid
                },
                null,
                2
              )
            );
          };
        }
      }
    ),
    {
      consumerGroup: 'us360-sample-consumer',
      ignoreMissingHandler: false
    }
  );
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
