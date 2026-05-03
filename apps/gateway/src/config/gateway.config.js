const { loadEnv } = require('../../../../packages/shared/src/utils/config');

function toList(value, fallback = '') {
  return String(value || fallback)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getGatewayConfig() {
  loadEnv();

  return {
    serviceName: 'gateway',
    version: '1.0.0',
    apiVersion: process.env.API_VERSION || 'v1',
    port: Number(process.env.GATEWAY_PORT || process.env.PORT || 3000),
    nodeEnv: process.env.NODE_ENV || 'development',
    mongodbUri:
      process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udyogsetu360',
    corsOrigins: toList(process.env.CORS_ORIGINS, 'http://localhost:3000'),
    bodyLimitJson: process.env.BODY_LIMIT_JSON || '1mb',
    bodyLimitUrlencoded: process.env.BODY_LIMIT_URLENCODED || '1mb',
    trustProxy: String(process.env.TRUST_PROXY || 'false').toLowerCase() === 'true',
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300),
    webhookRateLimitMax: Number(process.env.WEBHOOK_RATE_LIMIT_MAX || 120),
    certVerifyRateLimitMax: Number(process.env.CERT_VERIFY_RATE_LIMIT_MAX || 60),
    dashboardRateLimitMax: Number(process.env.DASHBOARD_RATE_LIMIT_MAX || 100),
    idempotencyTtlSeconds: Number(process.env.IDEMPOTENCY_TTL_SECONDS || 86400),
    idempotencyLockSeconds: Number(process.env.IDEMPOTENCY_LOCK_SECONDS || 30),
    webhookDefaultSecret: process.env.WEBHOOK_DEFAULT_SECRET || 'change-me',
    webhookToleranceSeconds: Number(process.env.WEBHOOK_TOLERANCE_SECONDS || 300),
    webhookAllowDevBypass:
      String(process.env.WEBHOOK_ALLOW_DEV_BYPASS || 'true').toLowerCase() === 'true',
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
    jwtIssuer: process.env.JWT_ISSUER || 'udyogsetu-360',
    jwtAudience: process.env.JWT_AUDIENCE || 'udyogsetu-360-web',
    serviceJwtSecret: process.env.SERVICE_JWT_SECRET || 'dev-service-jwt-secret',
    internalServiceToken: process.env.INTERNAL_SERVICE_TOKEN || 'dev-internal-service-token',
    caseServiceUrl: process.env.CASE_SERVICE_URL || 'http://localhost:3101',
    orchestrationServiceUrl:
      process.env.ORCHESTRATION_SERVICE_URL || 'http://localhost:3102',
    adapterRuntimeUrl: process.env.ADAPTER_RUNTIME_URL || 'http://localhost:3103',
    notificationServiceUrl:
      process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3104',
    auditServiceUrl: process.env.AUDIT_SERVICE_URL || 'http://localhost:3105',
    aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000'
  };
}

module.exports = { getGatewayConfig };
