const mongoose = require('mongoose');
const { sendSuccess } = require('../utils/api-response');
const { getGatewayConfig } = require('../config/gateway.config');
const { createGatewayProxyService } = require('../services/gateway-proxy.service');
const { getKafkaHealth } = require('../../../../packages/shared/src/kafka/kafka-client');

function getHealth(_req, res) {
  const config = getGatewayConfig();
  return sendSuccess(res, {
    ok: true,
    service: config.serviceName,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: config.version
  });
}

async function getReady(_req, res) {
  const config = getGatewayConfig();
  const proxy = createGatewayProxyService();
  const dependencies = {
    mongodb: mongoose.connection.readyState === 1 ? 'ok' : 'degraded',
    kafka: getKafkaHealth().status,
    outbox: 'degraded',
    caseService: 'degraded',
    auditService: 'degraded',
    adapterRuntime: 'degraded',
    rabbitmq: 'degraded'
  };

  const [caseHealth, auditHealth, adapterHealth] = await Promise.all([
    proxy.callCaseService('/health', {}, null),
    proxy.callAuditService('/health', {}, null),
    proxy.callAdapterRuntime('/ready', {}, null)
  ]);

  if (caseHealth?.data?.service || caseHealth?.service) dependencies.caseService = 'ok';
  if (auditHealth?.data?.service || auditHealth?.service) dependencies.auditService = 'ok';
  if (adapterHealth?.service || adapterHealth?.data?.service) {
    dependencies.adapterRuntime = 'ok';
    dependencies.rabbitmq =
      adapterHealth?.dependencies?.rabbitmq ||
      adapterHealth?.data?.dependencies?.rabbitmq ||
      'degraded';
  }
  if (caseHealth?.data?.dependencies?.outbox || caseHealth?.dependencies?.outbox) {
    dependencies.outbox =
      caseHealth?.data?.dependencies?.outbox || caseHealth?.dependencies?.outbox;
  }

  const ok =
    config.nodeEnv !== 'production'
      ? true
      : dependencies.mongodb === 'ok' &&
        dependencies.caseService === 'ok' &&
        dependencies.kafka !== 'degraded';

  return sendSuccess(
    res,
    {
      ok,
      service: config.serviceName,
      timestamp: new Date().toISOString(),
      dependencies
    },
    {},
    ok ? 200 : 503
  );
}

module.exports = { getHealth, getReady };
