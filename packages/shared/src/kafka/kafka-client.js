const { Kafka, logLevel } = require('kafkajs');
const { loadEnv } = require('../utils/config');
const { createLogger } = require('../logger');
const { KafkaConnectionError } = require('../errors/event-errors');

const logger = createLogger('shared-kafka');
let kafkaInstance = null;
let producerInstance = null;
const consumerInstances = new Map();
let producerConnected = false;
let lastKafkaError = null;

function parseBoolean(value, fallback = false) {
  if (value == null) {
    return fallback;
  }
  return String(value).toLowerCase() === 'true';
}

function getKafkaConfig() {
  loadEnv();
  const enabled = parseBoolean(process.env.KAFKA_ENABLED, false);
  const brokers = String(process.env.KAFKA_BROKERS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const saslEnabled = parseBoolean(process.env.KAFKA_SASL_ENABLED, false);

  if (enabled && process.env.NODE_ENV === 'production' && !brokers.length) {
    throw new KafkaConnectionError('KAFKA_ENABLED=true but no KAFKA_BROKERS are configured.');
  }

  return {
    enabled,
    clientId: process.env.KAFKA_CLIENT_ID || 'udyogsetu-360',
    brokers,
    ssl: parseBoolean(process.env.KAFKA_SSL, false),
    sasl: saslEnabled
      ? {
          mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
          username: process.env.KAFKA_SASL_USERNAME || '',
          password: process.env.KAFKA_SASL_PASSWORD || ''
        }
      : null
  };
}

function isKafkaEnabled() {
  return getKafkaConfig().enabled;
}

function createKafkaClient(config = getKafkaConfig()) {
  if (!config.enabled) {
    return null;
  }
  return new Kafka({
    clientId: config.clientId,
    brokers: config.brokers,
    ssl: config.ssl,
    sasl: config.sasl || undefined,
    logLevel: logLevel.NOTHING
  });
}

function getKafka() {
  if (!kafkaInstance) {
    kafkaInstance = createKafkaClient();
  }
  return kafkaInstance;
}

function getProducer() {
  if (!isKafkaEnabled()) {
    return null;
  }
  if (!producerInstance) {
    const kafka = getKafka();
    producerInstance = kafka.producer({ allowAutoTopicCreation: true });
  }
  return producerInstance;
}

async function connectProducer() {
  if (!isKafkaEnabled()) {
    return null;
  }
  const producer = getProducer();
  if (!producerConnected) {
    try {
      await producer.connect();
      producerConnected = true;
      lastKafkaError = null;
      logger.info('kafka_producer_connected');
    } catch (error) {
      lastKafkaError = error;
      throw new KafkaConnectionError('Failed to connect Kafka producer.', { message: error.message });
    }
  }
  return producer;
}

async function disconnectProducer() {
  if (producerInstance && producerConnected) {
    await producerInstance.disconnect();
    producerConnected = false;
  }
}

function getConsumer(groupId) {
  if (!isKafkaEnabled()) {
    return null;
  }
  if (!consumerInstances.has(groupId)) {
    consumerInstances.set(groupId, getKafka().consumer({ groupId }));
  }
  return consumerInstances.get(groupId);
}

function createConsumer(options = {}) {
  return getConsumer(options.groupId);
}

async function connectConsumer(groupId) {
  const consumer = getConsumer(groupId);
  if (!consumer) {
    return null;
  }
  try {
    await consumer.connect();
    lastKafkaError = null;
    logger.info('kafka_consumer_connected', { consumerGroup: groupId });
    return consumer;
  } catch (error) {
    lastKafkaError = error;
    throw new KafkaConnectionError('Failed to connect Kafka consumer.', {
      consumerGroup: groupId,
      message: error.message
    });
  }
}

function getKafkaHealth() {
  const config = getKafkaConfig();
  if (!config.enabled) {
    return { status: 'disabled', enabled: false };
  }
  if (!config.brokers.length) {
    return { status: 'degraded', enabled: true, reason: 'missing_brokers' };
  }
  if (lastKafkaError) {
    return { status: 'degraded', enabled: true, reason: lastKafkaError.message };
  }
  return { status: producerConnected ? 'ok' : 'configured', enabled: true };
}

module.exports = {
  createKafkaClient,
  getKafkaConfig,
  getKafka,
  getProducer,
  getConsumer,
  createConsumer,
  connectProducer,
  disconnectProducer,
  connectConsumer,
  isKafkaEnabled,
  getKafkaHealth
};
