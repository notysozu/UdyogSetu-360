const amqp = require('amqplib');
const { loadEnv } = require('../utils/config');
const { createLogger } = require('../logger');
const { QueueTopologyError } = require('../errors/queue-errors');
const { assertRabbitTopology } = require('./rabbitmq-topology');

const logger = createLogger('shared-rabbitmq');

let connectionPromise = null;
let connection = null;
let ready = false;
let lastError = null;
let reconnectTimer = null;
let connecting = false;

function parseBoolean(value, fallback = false) {
  if (value == null) return fallback;
  return String(value).toLowerCase() === 'true';
}

function getRabbitConfig() {
  loadEnv();
  const enabled = parseBoolean(process.env.RABBITMQ_ENABLED, true);
  return {
    enabled,
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    managementUrl: process.env.RABBITMQ_MANAGEMENT_URL || 'http://localhost:15672',
    prefetch: Number(process.env.RABBITMQ_PREFETCH || 10),
    heartbeat: Number(process.env.RABBITMQ_HEARTBEAT || 30),
    connectionRetryMs: Number(process.env.RABBITMQ_CONNECTION_RETRY_MS || 5000),
    maxConnectionAttempts: Number(process.env.RABBITMQ_MAX_CONNECTION_ATTEMPTS || 10),
    retryBaseDelayMs: Number(process.env.RABBITMQ_RETRY_BASE_DELAY_MS || 5000)
  };
}

function isRabbitEnabled() {
  return getRabbitConfig().enabled;
}

function scheduleReconnect(config) {
  if (reconnectTimer || !config.enabled) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createRabbitConnection(config).catch(() => {});
  }, config.connectionRetryMs);
}

async function wireConnection(conn, config) {
  conn.on('error', (error) => {
    lastError = error;
    ready = false;
    logger.error('rabbitmq_connection_error', { error: error.message });
  });
  conn.on('close', () => {
    ready = false;
    connection = null;
    connectionPromise = null;
    logger.warn('rabbitmq_connection_closed');
    scheduleReconnect(config);
  });

  const topologyChannel = await conn.createChannel();
  await assertRabbitTopology(topologyChannel, config);
  await topologyChannel.close();
  ready = true;
  lastError = null;
}

async function createRabbitConnection(config = getRabbitConfig()) {
  if (!config.enabled) {
    ready = false;
    return null;
  }
  if (connection) {
    return connection;
  }
  if (connectionPromise) {
    return connectionPromise;
  }
  connecting = true;
  connectionPromise = (async () => {
    let attempts = 0;
    while (attempts < config.maxConnectionAttempts) {
      attempts += 1;
      try {
        const conn = await amqp.connect(config.url, { heartbeat: config.heartbeat });
        connection = conn;
        await wireConnection(conn, config);
        logger.info('rabbitmq_connected', { attempts });
        return conn;
      } catch (error) {
        lastError = error;
        logger.warn('rabbitmq_connect_failed', { attempts, error: error.message });
        if (process.env.NODE_ENV === 'production' && attempts >= config.maxConnectionAttempts) {
          throw new QueueTopologyError('RabbitMQ connection failed.', { message: error.message });
        }
        await new Promise((resolve) => setTimeout(resolve, config.connectionRetryMs));
      }
    }
    return null;
  })();

  try {
    return await connectionPromise;
  } finally {
    connecting = false;
    if (!connection) {
      connectionPromise = null;
    }
  }
}

function getRabbitConnection() {
  return connection;
}

async function createChannel() {
  if (!isRabbitEnabled()) return null;
  const conn = connection || (await createRabbitConnection());
  if (!conn) return null;
  const channel = await conn.createChannel();
  await channel.prefetch(getRabbitConfig().prefetch);
  return channel;
}

async function createConfirmChannel() {
  if (!isRabbitEnabled()) return null;
  const conn = connection || (await createRabbitConnection());
  if (!conn) return null;
  const channel = await conn.createConfirmChannel();
  await channel.prefetch(getRabbitConfig().prefetch);
  return channel;
}

async function closeRabbitConnection() {
  ready = false;
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (connection) {
    const conn = connection;
    connection = null;
    connectionPromise = null;
    await conn.close().catch(() => {});
  }
}

async function waitForRabbitReady(timeoutMs = 10000) {
  if (!isRabbitEnabled()) {
    return { status: 'disabled' };
  }
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (ready) {
      return { status: 'ok' };
    }
    if (!connecting && !connection) {
      await createRabbitConnection().catch(() => {});
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return { status: 'degraded', reason: lastError?.message || 'not_ready' };
}

async function assertTopology(channel) {
  return assertRabbitTopology(channel, getRabbitConfig());
}

function getRabbitHealth() {
  const config = getRabbitConfig();
  if (!config.enabled) {
    return { status: 'disabled', enabled: false };
  }
  if (ready) {
    return { status: 'ok', enabled: true };
  }
  if (lastError) {
    return { status: 'degraded', enabled: true, reason: lastError.message };
  }
  return { status: 'configured', enabled: true };
}

module.exports = {
  getRabbitConfig,
  createRabbitConnection,
  getRabbitConnection,
  createChannel,
  createConfirmChannel,
  closeRabbitConnection,
  isRabbitEnabled,
  assertTopology,
  waitForRabbitReady,
  getRabbitHealth
};
