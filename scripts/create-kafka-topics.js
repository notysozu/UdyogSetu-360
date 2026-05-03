#!/usr/bin/env node
const { getKafka, getKafkaConfig, isKafkaEnabled } = require('../packages/shared/src/kafka/kafka-client');
const { EVENT_TOPIC_VALUES } = require('../packages/shared/src/constants/event-topics.constants');

async function main() {
  if (!isKafkaEnabled()) {
    console.log('Kafka is disabled.');
    return;
  }
  const kafka = getKafka();
  const admin = kafka.admin();
  await admin.connect();
  await admin.createTopics({
    waitForLeaders: true,
    topics: EVENT_TOPIC_VALUES.map((topic) => ({
      topic,
      numPartitions: 6,
      replicationFactor: 1
    }))
  });
  await admin.disconnect();
  console.log(`Ensured ${EVENT_TOPIC_VALUES.length} Kafka topics exist.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
