const { createLogger, requestLoggerMiddleware: sharedRequestLogger } = require('../../../../packages/shared/src/logger');
const { getGatewayConfig } = require('../config/gateway.config');

function requestLoggerMiddleware() {
  const config = getGatewayConfig();
  const logger = createLogger(config.serviceName, config.nodeEnv);
  return sharedRequestLogger(logger);
}

module.exports = { requestLoggerMiddleware };
