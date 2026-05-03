const { redactSensitive } = require('./redaction');
const { getLogContext } = require('./log-context');

const LEVEL_ORDER = { debug: 10, info: 20, warn: 30, error: 40 };

function shouldEmit(level) {
  const configured = String(process.env.LOG_LEVEL || 'info').toLowerCase();
  return (LEVEL_ORDER[level] || 20) >= (LEVEL_ORDER[configured] || 20);
}

function buildPayload(serviceName, level, message, meta = {}) {
  const context = getLogContext();
  const payload = {
    level,
    serviceName,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    message,
    ...context,
    ...meta
  };
  if (String(process.env.LOG_REDACT_SENSITIVE || 'true') === 'true') {
    return redactSensitive(payload);
  }
  return payload;
}

function createStructuredLogger(serviceName, envName = process.env.NODE_ENV || 'development', baseContext = {}) {
  const resolvedName = serviceName || process.env.OTEL_SERVICE_NAME || 'udyogsetu-360';

  function emit(level, message, meta = {}) {
    if (!shouldEmit(level)) return;
    const payload = buildPayload(resolvedName, level, message, { environment: envName, ...baseContext, ...meta });
    const line = JSON.stringify(payload);
    if (level === 'error') {
      console.error(line);
      return;
    }
    console.log(line);
  }

  return {
    info(message, meta) { emit('info', message, meta); },
    warn(message, meta) { emit('warn', message, meta); },
    error(message, meta) { emit('error', message, meta); },
    debug(message, meta) { emit('debug', message, meta); },
    child(context = {}) {
      return createStructuredLogger(resolvedName, envName, { ...baseContext, ...context });
    }
  };
}

module.exports = {
  createStructuredLogger
};
