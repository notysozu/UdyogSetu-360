const { createStructuredLogger } = require('./structured-logger');
const { withLogContext } = require('./log-context');
const { requestLoggerMiddleware } = require('./request-logger');
const { redactSensitive } = require('./redaction');

function createLogger(serviceName, envName) {
  return createStructuredLogger(serviceName, envName);
}

module.exports = {
  createLogger,
  createStructuredLogger,
  withLogContext,
  requestLoggerMiddleware,
  redactSensitive
};
