const { getGatewayConfig } = require('../config/gateway.config');
const { AppError } = require('../utils/app-error');

async function performCall(baseUrl, path, options = {}) {
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (_error) {
    payload = { raw: text };
  }
  if (!response.ok) {
    throw new AppError(
      'SERVICE_UNAVAILABLE',
      `Downstream service call failed for ${url}.`,
      response.status,
      payload ? [payload] : []
    );
  }
  return payload;
}

async function callWithFallback(baseUrl, path, options, fallback) {
  try {
    return await performCall(baseUrl, path, options);
  } catch (_error) {
    return fallback;
  }
}

function createGatewayProxyService() {
  const config = getGatewayConfig();

  return {
    callCaseService(path, options = {}, fallback = null) {
      return callWithFallback(config.caseServiceUrl, path, options, fallback);
    },
    callOrchestrationService(path, options = {}, fallback = null) {
      return callWithFallback(config.orchestrationServiceUrl, path, options, fallback);
    },
    callAdapterRuntime(path, options = {}, fallback = null) {
      return callWithFallback(config.adapterRuntimeUrl, path, options, fallback);
    },
    callNotificationService(path, options = {}, fallback = null) {
      return callWithFallback(config.notificationServiceUrl, path, options, fallback);
    },
    callAuditService(path, options = {}, fallback = null) {
      return callWithFallback(config.auditServiceUrl, path, options, fallback);
    }
  };
}

module.exports = { createGatewayProxyService };
